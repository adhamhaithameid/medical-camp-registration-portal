import { useEffect, useState } from "react";
import type { Doctor, DoctorInput } from "@medical-camp/shared";
import { api } from "../lib/api";

const initialForm: DoctorInput = {
  fullName: "",
  email: "",
  contactNumber: "",
  specialization: "",
  department: "",
  isActive: true
};

export const DoctorsPage = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [form, setForm] = useState<DoctorInput>(initialForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async (query?: string) => {
    try {
      setIsLoading(true);
      const response = await api.getDoctors(query);
      setDoctors(response.doctors);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to load doctors");
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
    setErrorMessage(null);
    setSuccessMessage(null);

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.contactNumber.trim() ||
      !form.specialization.trim()
    ) {
      setErrorMessage("Full name, email, contact number, and specialization are required.");
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
        setSuccessMessage("Doctor updated successfully.");
      } else {
        await api.createDoctor(payload);
        setSuccessMessage("Doctor created successfully.");
      }

      resetForm();
      await load(search || undefined);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save doctor");
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
    try {
      setErrorMessage(null);
      setSuccessMessage(null);
      await api.deleteDoctor(id);
      setSuccessMessage("Doctor deleted successfully.");
      await load(search || undefined);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to delete doctor");
    }
  };

  const handleSearch = async () => {
    await load(search || undefined);
  };

  return (
    <section>
      <h2>Doctors Management</h2>
      <p>Create, read, update, and delete doctor records.</p>

      {errorMessage && <p className="error-text">{errorMessage}</p>}
      {successMessage && <p className="success-text">{successMessage}</p>}

      <div className="inline-actions">
        <input
          aria-label="Search Doctors"
          placeholder="Search by name/email/specialization"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button className="btn btn-secondary" type="button" onClick={handleSearch}>
          Search
        </button>
      </div>

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <label htmlFor="doctorName">
          Full Name
          <input
            id="doctorName"
            value={form.fullName}
            onChange={(event) => setForm((previous) => ({ ...previous, fullName: event.target.value }))}
          />
        </label>
        <label htmlFor="doctorEmail">
          Email
          <input
            id="doctorEmail"
            type="email"
            value={form.email}
            onChange={(event) => setForm((previous) => ({ ...previous, email: event.target.value }))}
          />
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
          <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
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
                      <button className="btn btn-secondary" type="button" onClick={() => handleDelete(doctor.id)}>
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
      )}
    </section>
  );
};
