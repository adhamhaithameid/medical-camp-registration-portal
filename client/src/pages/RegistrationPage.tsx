import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { Camp, RegistrationInput, RegistrationRecord } from "@medical-camp/shared";
import { ErrorCallout } from "../components/ErrorCallout";
import { FieldErrorText } from "../components/FieldErrorText";
import { useToast } from "../context/ToastContext";
import { api, getFieldError } from "../lib/api";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

const initialForm: RegistrationInput = {
  fullName: "",
  age: 18,
  contactNumber: "",
  email: "",
  campId: 0
};

export const RegistrationPage = () => {
  const [searchParams] = useSearchParams();
  const { pushToast } = useToast();
  const isOnline = useOnlineStatus();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [form, setForm] = useState<RegistrationInput>(initialForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [successRegistration, setSuccessRegistration] = useState<RegistrationRecord | null>(null);

  const loadCamps = async (cancelled = false) => {
    try {
      setError(null);
      setIsLoading(true);
      const response = await api.getCamps();
      if (cancelled) {
        return;
      }

      setCamps(response.camps);
      const preferredCampId = Number(searchParams.get("campId"));
      const selectedCampId =
        Number.isInteger(preferredCampId) && response.camps.some((camp) => camp.id === preferredCampId)
          ? preferredCampId
          : response.camps[0]?.id ?? 0;

      setForm((previous) => ({ ...previous, campId: selectedCampId }));
    } catch (requestError) {
      if (!cancelled) {
        setError(requestError);
      }
    } finally {
      if (!cancelled) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    void loadCamps(cancelled);

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  const selectedCamp = useMemo(
    () => camps.find((camp) => camp.id === Number(form.campId)) ?? null,
    [camps, form.campId]
  );

  const validate = () => {
    if (!form.fullName.trim()) {
      return "Full name is required.";
    }

    if (!form.contactNumber.trim()) {
      return "Contact number is required.";
    }

    if (!form.campId) {
      return "Please select a camp.";
    }

    if (!Number.isInteger(Number(form.age)) || Number(form.age) <= 0) {
      return "Age must be a positive number.";
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccessRegistration(null);

    if (!isOnline) {
      setError(new Error("You are offline. Reconnect before submitting registration."));
      return;
    }

    const validationError = validate();
    if (validationError) {
      setError(new Error(validationError));
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.createRegistration({
        fullName: form.fullName.trim(),
        age: Number(form.age),
        contactNumber: form.contactNumber.trim(),
        email: form.email?.trim() ? form.email.trim() : undefined,
        campId: Number(form.campId)
      });
      setSuccessRegistration(response.registration);
      pushToast({
        variant: response.registration.status === "WAITLISTED" ? "warning" : "success",
        title: "Registration Submitted",
        message:
          response.registration.status === "WAITLISTED"
            ? "Camp is full, registration is waitlisted."
            : "Registration confirmed successfully."
      });
      setForm((previous) => ({
        ...previous,
        fullName: "",
        age: 18,
        contactNumber: "",
        email: ""
      }));
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <p>Loading registration form...</p>;
  }

  return (
    <section className="workspace-page form-panel">
      <h2>Camp Registration</h2>
      <p className="muted-text">
        When a camp reaches capacity, new registrations are automatically waitlisted.
      </p>

      {selectedCamp && (
        <p className="muted-text">
          {selectedCamp.name} has {selectedCamp.remainingSeats} seats remaining.
        </p>
      )}

      {!isOnline && (
        <p className="warning-text">You are offline. Form submission is disabled until reconnect.</p>
      )}
      <ErrorCallout error={error} onRetry={() => loadCamps()} />

      {successRegistration && (
        <div className="success-box">
          <p className="inline-actions">
            <span
              className={
                successRegistration.status === "WAITLISTED"
                  ? "status-chip status-chip-amber"
                  : "status-chip status-chip-green"
              }
            >
              {successRegistration.status}
            </span>
          </p>
          <p>
            Your confirmation code: <strong>{successRegistration.confirmationCode}</strong>
          </p>
          <p>Use this code on the Manage Registration page to update or cancel.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-grid" noValidate>
        <label htmlFor="registrationCamp">
          Camp
          <select
            id="registrationCamp"
            value={form.campId}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                campId: Number(event.target.value)
              }))
            }
          >
            {camps.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.name} ({camp.remainingSeats} seats left)
              </option>
            ))}
          </select>
          <FieldErrorText message={getFieldError(error, "campId")} />
        </label>

        <label htmlFor="registrationName">
          Full Name
          <input
            id="registrationName"
            value={form.fullName}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, fullName: event.target.value }))
            }
          />
          <FieldErrorText message={getFieldError(error, "fullName")} />
        </label>

        <label htmlFor="registrationAge">
          Age
          <input
            id="registrationAge"
            type="number"
            min={1}
            max={120}
            value={form.age}
            onChange={(event) => setForm((previous) => ({ ...previous, age: Number(event.target.value) }))}
          />
          <FieldErrorText message={getFieldError(error, "age")} />
        </label>

        <label htmlFor="registrationContact">
          Contact Number
          <input
            id="registrationContact"
            value={form.contactNumber}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, contactNumber: event.target.value }))
            }
          />
          <FieldErrorText message={getFieldError(error, "contactNumber")} />
        </label>

        <label htmlFor="registrationEmail">
          Email (optional)
          <input
            id="registrationEmail"
            type="email"
            value={form.email ?? ""}
            onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
          />
          <FieldErrorText message={getFieldError(error, "email")} />
        </label>

        <button className="btn btn-primary" type="submit" disabled={isSubmitting || !isOnline}>
          {isSubmitting ? "Submitting..." : "Submit Registration"}
        </button>
      </form>
    </section>
  );
};
