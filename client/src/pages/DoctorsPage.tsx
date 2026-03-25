import { useEffect, useState } from "react";
import type { Doctor, DoctorInput } from "@medical-camp/shared";
import { ErrorCallout } from "../components/ErrorCallout";
import { FieldErrorText } from "../components/FieldErrorText";
import { useToast } from "../context/ToastContext";
import { api, getFieldError } from "../lib/api";
import { useOnlineStatus } from "../hooks/useOnlineStatus";

const initialForm: DoctorInput = {
  fullName: "",
  email: "",
  contactNumber: "",
  specialization: "",
  department: "",
  isActive: true
};

export const DoctorsPage = () => {
  const { pushToast } = useToast();
  const isOnline = useOnlineStatus();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState<DoctorInput>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<unknown>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async (query?: string) => {
    try {
      setIsLoading(true);
      const response = await api.getDoctors(query);
      setDoctors(response.doctors);
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
      setError(new Error("You are offline. Reconnect before saving doctor records."));
      return;
    }

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.contactNumber.trim() ||
      !form.specialization.trim()
    ) {
      setError(new Error("Full name, email, contact number, and specialization are required."));
      return;
    }

    try {
      setIsSubmitting(true);

      const payload: DoctorInput = {
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        contactNumber: form.contactNumber.trim(),
        specialization: form.specialization.trim(),
        department: form.department?.trim() || undefined,
        isActive: form.isActive
      };

      if (editingId) {
        await api.updateDoctor(editingId, payload);
        pushToast({
          variant: "success",
          title: "Doctor Updated",
          message: "Doctor profile updated successfully."
        });
      } else {
        await api.createDoctor(payload);
        pushToast({
          variant: "success",
          title: "Doctor Created",
          message: "New doctor profile created."
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

  const startEdit = (doctor: Doctor) => {
    setEditingId(doctor.id);
    setForm({
      fullName: doctor.fullName,
      email: doctor.email,
      contactNumber: doctor.contactNumber,
      specialization: doctor.specialization,
      department: doctor.department ?? "",
      isActive: doctor.isActive
    });
  };

  const handleDelete = async (id: number) => {
    const confirmed = window.confirm("Delete this doctor record permanently?");
    if (!confirmed) {
      return;
    }

    try {
      if (!isOnline) {
        throw new Error("You are offline. Reconnect before deleting records.");
      }
      setError(null);
      await api.deleteDoctor(id);
      pushToast({
        variant: "warning",
        title: "Doctor Deleted",
        message: "Doctor record deleted."
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
      <section className="detail-panel">
        <h2>Doctors Management</h2>
        <p className="muted-text">
          Manage doctor master data, specialization details, and active status.
        </p>
      </section>

      {!isOnline && (
        <p className="warning-text">You are offline. Create/update/delete actions are disabled.</p>
      )}
      <ErrorCallout error={error} onRetry={() => load(search || undefined)} />

      <section className="detail-panel">
        <div className="toolbar">
          <input
            aria-label="Search Doctors"
            placeholder="Search by name/email/specialization"
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

        <p className="muted-text">Total doctors: {doctors.length}</p>
      </section>

      <form className="form-grid detail-panel" onSubmit={handleSubmit} noValidate>
        <label htmlFor="doctorName">
          Full Name
          <input
            id="doctorName"
            value={form.fullName}
            onChange={(event) => setForm((previous) => ({ ...previous, fullName: event.target.value }))}
          />
          <FieldErrorText message={getFieldError(error, "fullName")} />
        </label>
        <label htmlFor="doctorEmail">
          Email
          <input
            id="doctorEmail"
            type="email"
            value={form.email}
            onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
          />
          <FieldErrorText message={getFieldError(error, "email")} />
        </label>
        <label htmlFor="doctorContact">
          Contact Number
          <input
            id="doctorContact"
            value={form.contactNumber}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, contactNumber: event.target.value }))
            }
          />
          <FieldErrorText message={getFieldError(error, "contactNumber")} />
        </label>
        <label htmlFor="doctorSpecialization">
          Specialization
          <input
            id="doctorSpecialization"
            value={form.specialization}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, specialization: event.target.value }))
            }
          />
          <FieldErrorText message={getFieldError(error, "specialization")} />
        </label>
        <label htmlFor="doctorDepartment">
          Department
          <input
            id="doctorDepartment"
            value={form.department ?? ""}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, department: event.target.value }))
            }
          />
          <FieldErrorText message={getFieldError(error, "department")} />
        </label>
        <label className="checkbox-inline" htmlFor="doctorActive">
          <input
            id="doctorActive"
            type="checkbox"
            checked={Boolean(form.isActive)}
            onChange={(event) =>
              setForm((previous) => ({ ...previous, isActive: event.target.checked }))
            }
          />
          Active
        </label>

        <div className="inline-actions">
          <button className="btn btn-primary" type="submit" disabled={isSubmitting || !isOnline}>
            {isSubmitting ? "Saving..." : editingId ? "Update Doctor" : "Create Doctor"}
          </button>
          {editingId && (
            <button className="btn btn-secondary" type="button" onClick={resetForm}>
              Cancel Edit
            </button>
          )}
        </div>
      </form>

      {isLoading ? (
        <p>Loading doctors...</p>
      ) : (
        <section className="detail-panel">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Contact</th>
                  <th>Specialization</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {doctors.map((doctor) => (
                  <tr key={doctor.id}>
                    <td>{doctor.id}</td>
                    <td>{doctor.fullName}</td>
                    <td>{doctor.email}</td>
                    <td>{doctor.contactNumber}</td>
                    <td>{doctor.specialization}</td>
                    <td>{doctor.isActive ? "Active" : "Inactive"}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn btn-secondary" type="button" onClick={() => startEdit(doctor)}>
                          Edit
                        </button>
                        <button
                          className="btn btn-secondary"
                          type="button"
                          onClick={() => handleDelete(doctor.id)}
                          disabled={!isOnline}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {doctors.length === 0 && (
                  <tr>
                    <td colSpan={7}>No doctors found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </section>
  );
};
