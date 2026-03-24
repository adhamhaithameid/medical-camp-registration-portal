import { useEffect, useState } from "react";
import type { Patient, PatientInput } from "@medical-camp/shared";
import { ErrorCallout } from "../components/ErrorCallout";
import { FieldErrorText } from "../components/FieldErrorText";
import { useToast } from "../context/ToastContext";
import { api, getFieldError } from "../lib/api";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

const initialForm: PatientInput = {
  fullName: "",
  dateOfBirth: "",
  gender: "",
  contactNumber: "",
  email: "",
  address: "",
  medicalHistory: ""
};

export const PatientsPage = () => {
  const { pushToast } = useToast();
  const isOnline = useOnlineStatus();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [form, setForm] = useState<PatientInput>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async (query?: string) => {
    try {
      setIsLoading(true);
      const response = await api.getPatients(query);
      setPatients(response.patients);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const resetForm = () => {
    setForm(initialForm);
    setEditingId(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (!isOnline) {
      setError(new Error("You are offline. Reconnect before saving patient records."));
      return;
    }

    if (
      !form.fullName.trim() ||
      !form.dateOfBirth ||
      !form.gender.trim() ||
      !form.contactNumber.trim() ||
      !form.address.trim()
    ) {
      setError(new Error("Full name, DOB, gender, contact number, and address are required."));
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: PatientInput = {
        fullName: form.fullName.trim(),
        dateOfBirth: form.dateOfBirth,
        gender: form.gender.trim(),
        contactNumber: form.contactNumber.trim(),
        email: form.email?.trim() ? form.email.trim() : undefined,
        address: form.address.trim(),
        medicalHistory: form.medicalHistory?.trim() ? form.medicalHistory.trim() : undefined
      };

      if (editingId) {
        await api.updatePatient(editingId, payload);
        pushToast({
          variant: "success",
          title: "Patient Updated",
          message: "Patient record updated successfully."
        });
      } else {
        await api.createPatient(payload);
        pushToast({
          variant: "success",
          title: "Patient Created",
          message: "New patient record created."
        });
      }

      resetForm();
      await load(search || undefined);
    } catch (requestError) {
      setError(requestError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (patient: Patient) => {
    setEditingId(patient.id);
    setForm({
      fullName: patient.fullName,
      dateOfBirth: patient.dateOfBirth.slice(0, 10),
      gender: patient.gender,
      contactNumber: patient.contactNumber,
      email: patient.email ?? "",
      address: patient.address,
      medicalHistory: patient.medicalHistory ?? ""
    });
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete this patient record permanently?");
    if (!confirmed) {
      return;
    }

    try {
      if (!isOnline) {
        throw new Error("You are offline. Reconnect before deleting records.");
      }
      setError(null);
      await api.deletePatient(id);
      pushToast({
        variant: "warning",
        title: "Patient Deleted",
        message: "Patient record deleted."
      });
      await load(search || undefined);
    } catch (requestError) {
      setError(requestError);
    }
  };

  const handleSearch = async () => {
    await load(search || undefined);
  };

  return (
    <section className="workspace-page">
      <h2>Patients Management</h2>
      <p className="muted-text">
        Maintain complete patient records with fast search and structured updates.
      </p>

      {!isOnline && (
        <p className="warning-text">You are offline. Create/update/delete actions are disabled.</p>
      )}
      <ErrorCallout error={error} onRetry={() => load(search || undefined)} />

      <div className="toolbar">
        <input
          aria-label="Search Patients"
          placeholder="Search by name/contact/email"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button
          className="btn btn-ghost"
          type="button"
          onClick={() => {
            setSearch("");
            void load();
          }}
        >
          Clear
        </button>
        <button className="btn btn-secondary" type="button" onClick={handleSearch} disabled={!isOnline}>
          Search
        </button>
      </div>

      <p className="muted-text">Total patients: {patients.length}</p>

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <label htmlFor="patientName">
          Full Name
          <input
            id="patientName"
            value={form.fullName}
            onChange={(event) => setForm((previous) => ({ ...previous, fullName: event.target.value }))}
          />
          <FieldErrorText message={getFieldError(error, "fullName")} />
        </label>
        <label htmlFor="patientDob">
          Date of Birth
          <input
            id="patientDob"
            type="date"
            value={form.dateOfBirth}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, dateOfBirth: event.target.value }))
            }
          />
          <FieldErrorText message={getFieldError(error, "dateOfBirth")} />
        </label>
        <label htmlFor="patientGender">
          Gender
          <input
            id="patientGender"
            value={form.gender}
            onChange={(event) => setForm((previous) => ({ ...previous, gender: event.target.value }))}
          />
          <FieldErrorText message={getFieldError(error, "gender")} />
        </label>
        <label htmlFor="patientContact">
          Contact Number
          <input
            id="patientContact"
            value={form.contactNumber}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, contactNumber: event.target.value }))
            }
          />
          <FieldErrorText message={getFieldError(error, "contactNumber")} />
        </label>
        <label htmlFor="patientEmail">
          Email
          <input
            id="patientEmail"
            type="email"
            value={form.email ?? ""}
            onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
          />
          <FieldErrorText message={getFieldError(error, "email")} />
        </label>
        <label htmlFor="patientAddress">
          Address
          <input
            id="patientAddress"
            value={form.address}
            onChange={(event) => setForm((previous) => ({ ...previous, address: event.target.value }))}
          />
          <FieldErrorText message={getFieldError(error, "address")} />
        </label>
        <label htmlFor="patientHistory">
          Medical History
          <input
            id="patientHistory"
            value={form.medicalHistory ?? ""}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, medicalHistory: event.target.value }))
            }
          />
          <FieldErrorText message={getFieldError(error, "medicalHistory")} />
        </label>

        <div className="inline-actions">
          <button className="btn btn-primary" type="submit" disabled={isSubmitting || !isOnline}>
            {isSubmitting ? "Saving..." : editingId ? "Update Patient" : "Create Patient"}
          </button>
          {editingId && (
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
                <th>ID</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Email</th>
                <th>DOB</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id}>
                  <td>{patient.id}</td>
                  <td>{patient.fullName}</td>
                  <td>{patient.contactNumber}</td>
                  <td>{patient.email ?? "-"}</td>
                  <td>{new Date(patient.dateOfBirth).toLocaleDateString()}</td>
                  <td>
                    <div className="row-actions">
                      <button className="btn btn-secondary" type="button" onClick={() => startEdit(patient)}>
                        Edit
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => handleDelete(patient.id)}
                        disabled={!isOnline}
                      >
                        Delete
                      </button>
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
    </section>
  );
};
