import { useState } from "react";
import type { RegistrationLookupResponse } from "@medical-camp/shared";
import { api } from "../lib/api";

export const RegistrationLookupPage = () => {
  const [confirmationCode, setConfirmationCode] = useState("");
  const [lookupResult, setLookupResult] = useState<RegistrationLookupResponse | null>(null);
  const [formState, setFormState] = useState({
    fullName: "",
    age: "",
    contactNumber: "",
    email: ""
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const syncForm = (result: RegistrationLookupResponse) => {
    setFormState({
      fullName: result.registration.fullName,
      age: String(result.registration.age),
      contactNumber: result.registration.contactNumber,
      email: result.registration.email ?? ""
    });
  };

  const handleLookup = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setLookupResult(null);

    if (!confirmationCode.trim()) {
      setErrorMessage("Confirmation code is required.");
      return;
    }

    try {
      setIsLoading(true);
      const result = await api.lookupRegistration(confirmationCode.trim());
      setLookupResult(result);
      syncForm(result);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Lookup failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!lookupResult) {
      return;
    }

    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      const response = await api.updateRegistration(lookupResult.registration.confirmationCode, {
        fullName: formState.fullName.trim(),
        age: Number(formState.age),
        contactNumber: formState.contactNumber.trim(),
        email: formState.email.trim() ? formState.email.trim() : null
      });

      const refreshed = await api.getRegistrationByCode(response.registration.confirmationCode);
      setLookupResult(refreshed);
      syncForm(refreshed);
      setSuccessMessage("Registration updated.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Update failed");
    }
  };

  const handleCancel = async () => {
    if (!lookupResult) {
      return;
    }

    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      const response = await api.cancelRegistration(lookupResult.registration.confirmationCode);
      const refreshed = await api.getRegistrationByCode(response.registration.confirmationCode);
      setLookupResult(refreshed);
      syncForm(refreshed);
      setSuccessMessage("Registration cancelled.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Cancellation failed");
    }
  };

  return (
    <section className="workspace-page">
      <h2>Manage Registration</h2>
      <p className="muted-text">
        Use your confirmation code to view, edit, or cancel your registration.
      </p>

      {errorMessage && <p className="error-text">{errorMessage}</p>}
      {successMessage && <p className="success-text">{successMessage}</p>}

      <div className="toolbar">
        <input
          aria-label="Confirmation Code"
          placeholder="Enter confirmation code"
          value={confirmationCode}
          onChange={(event) => setConfirmationCode(event.target.value)}
        />
        <button className="btn btn-primary" type="button" onClick={handleLookup} disabled={isLoading}>
          {isLoading ? "Loading..." : "Lookup"}
        </button>
      </div>

      {lookupResult && (
        <section className="detail-panel">
          <h3>Registration Details</h3>
          <p>
            <strong>Status:</strong>{" "}
            <span
              className={
                lookupResult.registration.status === "CONFIRMED"
                  ? "status-chip status-chip-green"
                  : lookupResult.registration.status === "WAITLISTED"
                    ? "status-chip status-chip-amber"
                    : "status-chip status-chip-gray"
              }
            >
              {lookupResult.registration.status}
            </span>
          </p>
          <p>
            <strong>Camp:</strong> {lookupResult.camp.name} -{" "}
            {new Date(lookupResult.camp.date).toLocaleString()}
          </p>
          <p>
            <strong>Location:</strong> {lookupResult.camp.location}
          </p>

          <div className="form-grid">
            <label htmlFor="manageName">
              Full Name
              <input
                id="manageName"
                value={formState.fullName}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, fullName: event.target.value }))
                }
                disabled={lookupResult.registration.status === "CANCELLED"}
              />
            </label>
            <label htmlFor="manageAge">
              Age
              <input
                id="manageAge"
                type="number"
                value={formState.age}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, age: event.target.value }))
                }
                disabled={lookupResult.registration.status === "CANCELLED"}
              />
            </label>
            <label htmlFor="manageContact">
              Contact Number
              <input
                id="manageContact"
                value={formState.contactNumber}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, contactNumber: event.target.value }))
                }
                disabled={lookupResult.registration.status === "CANCELLED"}
              />
            </label>
            <label htmlFor="manageEmail">
              Email
              <input
                id="manageEmail"
                type="email"
                value={formState.email}
                onChange={(event) =>
                  setFormState((previous) => ({ ...previous, email: event.target.value }))
                }
                disabled={lookupResult.registration.status === "CANCELLED"}
              />
            </label>
          </div>

          <div className="inline-actions">
            <button
              className="btn btn-primary"
              type="button"
              onClick={handleUpdate}
              disabled={lookupResult.registration.status === "CANCELLED"}
            >
              Update Registration
            </button>
            <button
              className="btn btn-secondary"
              type="button"
              onClick={handleCancel}
              disabled={lookupResult.registration.status === "CANCELLED"}
            >
              Cancel Registration
            </button>
          </div>
        </section>
      )}
    </section>
  );
};
