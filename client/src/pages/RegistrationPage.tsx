import { useEffect, useMemo, useState } from "react";
import type { Camp, RegistrationInput } from "@medical-camp/shared";
import { api } from "../lib/api";

const initialFormState = {
  fullName: "",
  age: "",
  contactNumber: "",
  campId: ""
};

export const RegistrationPage = () => {
  const [formState, setFormState] = useState(initialFormState);
  const [camps, setCamps] = useState<Camp[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCamps, setIsLoadingCamps] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;

    const loadCamps = async () => {
      try {
        const response = await api.getCamps();
        if (!ignore) {
          setCamps(response.camps);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load camps");
        }
      } finally {
        if (!ignore) {
          setIsLoadingCamps(false);
        }
      }
    };

    loadCamps();

    return () => {
      ignore = true;
    };
  }, []);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (formState.fullName.trim().length < 2) {
      errors.push("Full name must be at least 2 characters.");
    }

    const age = Number(formState.age);
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      errors.push("Age must be a valid number between 1 and 120.");
    }

    if (!/^[+]?[-0-9\s]{7,20}$/u.test(formState.contactNumber.trim())) {
      errors.push("Contact number format is invalid.");
    }

    if (!formState.campId) {
      errors.push("Please select a camp.");
    }

    return errors;
  }, [formState]);

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setFormState((previous) => ({
      ...previous,
      [name]: value
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    if (validationErrors.length > 0) {
      setErrorMessage(validationErrors.join(" "));
      return;
    }

    const payload: RegistrationInput = {
      fullName: formState.fullName.trim(),
      age: Number(formState.age),
      contactNumber: formState.contactNumber.trim(),
      campId: Number(formState.campId)
    };

    try {
      setIsSubmitting(true);
      const response = await api.submitRegistration(payload);
      setSuccessMessage(response.message);
      setFormState(initialFormState);
    } catch (submitError) {
      setErrorMessage(submitError instanceof Error ? submitError.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="form-panel">
      <h2>Registration</h2>
      <p>Submit your details to reserve a spot in an upcoming medical camp.</p>

      {isLoadingCamps && <p>Loading available camps...</p>}
      {errorMessage && <p className="error-text">{errorMessage}</p>}
      {successMessage && <p className="success-text">{successMessage}</p>}

      <form onSubmit={handleSubmit} className="form-grid" noValidate>
        <label htmlFor="fullName">
          Full Name
          <input
            id="fullName"
            name="fullName"
            value={formState.fullName}
            onChange={handleChange}
            placeholder="Enter your full name"
          />
        </label>

        <label htmlFor="age">
          Age
          <input
            id="age"
            name="age"
            value={formState.age}
            onChange={handleChange}
            inputMode="numeric"
            placeholder="Enter your age"
          />
        </label>

        <label htmlFor="contactNumber">
          Contact Number
          <input
            id="contactNumber"
            name="contactNumber"
            value={formState.contactNumber}
            onChange={handleChange}
            placeholder="+20 100 123 4567"
          />
        </label>

        <label htmlFor="campId">
          Camp Selection
          <select id="campId" name="campId" value={formState.campId} onChange={handleChange}>
            <option value="">Select a camp</option>
            {camps.map((camp) => (
              <option key={camp.id} value={camp.id}>
                {camp.name} - {new Date(camp.date).toLocaleDateString()}
              </option>
            ))}
          </select>
        </label>

        <button className="btn btn-primary" type="submit" disabled={isSubmitting || isLoadingCamps}>
          {isSubmitting ? "Submitting..." : "Submit Registration"}
        </button>
      </form>
    </section>
  );
};
