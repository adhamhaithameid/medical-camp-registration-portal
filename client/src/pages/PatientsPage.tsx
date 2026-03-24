import { useEffect, useState } from "react";
import type { Patient, PatientHistoryResponse, PatientInput } from "@medical-camp/shared";
import { api } from "../lib/api";

const initialFormState = {
  fullName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
  address: "",
  medicalHistory: ""
};

export const PatientsPage = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [formState, setFormState] = useState(initialFormState);
  const [editingPatientId, setEditingPatientId] = useState<number | null>(null);
  const [history, setHistory] = useState<PatientHistoryResponse | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadPatients = async () => {
    try {
      setIsLoading(true);
      const response = await api.getPatients(showDeleted);
      setPatients(response.patients);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load patients");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, [showDeleted]);

  const resetForm = () => {
    setFormState(initialFormState);
    setEditingPatientId(null);
  };

  const getValidationError = () => {
    if (
      !formState.fullName.trim() ||
      !formState.dateOfBirth ||
      !formState.gender.trim() ||
      !formState.phone.trim() ||
      !formState.address.trim()
    ) {
      return "Full name, date of birth, gender, phone, and address are required.";
    }

    return null;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const validationError = getValidationError();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const payload: PatientInput = {
      fullName: formState.fullName.trim(),
      dateOfBirth: formState.dateOfBirth,
      gender: formState.gender.trim(),
      phone: formState.phone.trim(),
      address: formState.address.trim(),
      medicalHistory: formState.medicalHistory.trim()
    };

    try {
      setIsSubmitting(true);

      if (editingPatientId) {
        await api.updatePatient(editingPatientId, payload);
        setSuccessMessage("Patient updated successfully.");
      } else {
        await api.createPatient(payload);
        setSuccessMessage("Patient added successfully.");
      }

      resetForm();
      await loadPatients();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to save patient");
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEditing = (patient: Patient) => {
    setEditingPatientId(patient.id);
    setFormState({
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth.slice(0, 10),
      gender: patient.gender,
      phone: patient.phone,
      address: patient.address,
      medicalHistory: patient.medicalHistory ?? ""
    });
  };

  const handleDelete = async (patientId: number) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await api.deletePatient(patientId);
      setSuccessMessage("Patient soft-deleted successfully.");
      await loadPatients();

      if (history?.patient.id === patientId) {
        setHistory(null);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to delete patient");
    }
  };

  const handleViewHistory = async (patientId: number) => {
    try {
      setErrorMessage(null);
      const response = await api.getPatientHistory(patientId);
      setHistory(response);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load patient history");
    }
  };

  return (
    <section>
      <h2>Patient Management</h2>
      <p>Add, update, review history, and soft-delete patients.</p>

      {errorMessage && <p className="error-text">{errorMessage}</p>}
      {successMessage && <p className="success-text">{successMessage}</p>}

      <div className="section-actions">
        <label className="checkbox-inline">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(event) => setShowDeleted(event.target.checked)}
          />
          Include soft-deleted records
        </label>
      </div>

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <label htmlFor="patientFullName">
          Full Name
          <input
            id="patientFullName"
            value={formState.fullName}
            onChange={(event) =>
              setFormState((previous) => ({ ...previous, fullName: event.target.value }))
            }
          />
        </label>

        <label htmlFor="patientDob">
          Date of Birth
          <input
            id="patientDob"
            type="date"
            value={formState.dateOfBirth}
            onChange={(event) =>
              setFormState((previous) => ({ ...previous, dateOfBirth: event.target.value }))
            }
          />
        </label>

        <label htmlFor="patientGender">
          Gender
          <input
            id="patientGender"
            value={formState.gender}
            onChange={(event) =>
              setFormState((previous) => ({ ...previous, gender: event.target.value }))
            }
            placeholder="Female / Male / Other"
          />
        </label>

        <label htmlFor="patientPhone">
          Phone
          <input
            id="patientPhone"
            value={formState.phone}
            onChange={(event) =>
              setFormState((previous) => ({ ...previous, phone: event.target.value }))
            }
          />
        </label>

        <label htmlFor="patientAddress">
          Address
          <input
            id="patientAddress"
            value={formState.address}
            onChange={(event) =>
              setFormState((previous) => ({ ...previous, address: event.target.value }))
            }
          />
        </label>

        <label htmlFor="patientHistory">
          Medical History
          <input
            id="patientHistory"
            value={formState.medicalHistory}
            onChange={(event) =>
              setFormState((previous) => ({ ...previous, medicalHistory: event.target.value }))
            }
          />
        </label>

        <div className="inline-actions">
          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Saving..." : editingPatientId ? "Update Patient" : "Add Patient"}
          </button>
          {editingPatientId && (
            <button className="btn btn-secondary" type="button" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <p>Loading patients...</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>DOB</th>
                <th>Gender</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.fullName}</td>
                  <td>{new Date(patient.dateOfBirth).toLocaleDateString()}</td>
                  <td>{patient.gender}</td>
                  <td>{patient.phone}</td>
                  <td>{patient.isDeleted ? "Deleted" : "Active"}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => startEditing(patient)}
                        disabled={patient.isDeleted}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => handleViewHistory(patient.id)}
                      >
                        View History
                      </button>
                      {!patient.isDeleted && (
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => handleDelete(patient.id)}
                        >
                          Soft Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {patients.length === 0 && (
                <tr>
                  <td colSpan={6}>No patients found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {history && (
        <section className="detail-panel">
          <h3>{history.patient.fullName} - History</h3>
          <p>
            Appointments: <strong>{history.appointments.length}</strong>
          </p>
          <p>
            Invoices: <strong>{history.invoices.length}</strong>
          </p>
        </section>
      )}
    </section>
  );
};
