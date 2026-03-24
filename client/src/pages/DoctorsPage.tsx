import { useEffect, useState } from "react";
import type { Doctor, DoctorInput } from "@medical-camp/shared";
import { api } from "../lib/api";

const initialFormState = {
  fullName: "",
  email: "",
  phone: "",
  specialization: "",
  schedule: ""
};

export const DoctorsPage = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [formState, setFormState] = useState(initialFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadDoctors = async () => {
    try {
      setIsLoading(true);
      const response = await api.getDoctors();
      setDoctors(response.doctors);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load doctors");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDoctors();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (
      !formState.fullName.trim() ||
      !formState.email.trim() ||
      !formState.phone.trim() ||
      !formState.specialization.trim() ||
      !formState.schedule.trim()
    ) {
      setErrorMessage("All doctor fields are required.");
      return;
    }

    const payload: DoctorInput = {
      fullName: formState.fullName.trim(),
      email: formState.email.trim(),
      phone: formState.phone.trim(),
      specialization: formState.specialization.trim(),
      schedule: formState.schedule.trim()
    };

    try {
      setIsSubmitting(true);
      await api.createDoctor(payload);
      setFormState(initialFormState);
      setSuccessMessage("Doctor added successfully.");
      await loadDoctors();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to add doctor");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSpecialization = async (doctor: Doctor) => {
    const specialization = window.prompt(
      "Enter updated specialization",
      doctor.specialization
    );

    if (!specialization) {
      return;
    }

    try {
      await api.updateDoctorSpecialization(doctor.id, specialization);
      setSuccessMessage("Specialization updated.");
      await loadDoctors();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update specialization");
    }
  };

  const handleUpdateSchedule = async (doctor: Doctor) => {
    const schedule = window.prompt("Enter updated schedule", doctor.schedule);

    if (!schedule) {
      return;
    }

    try {
      await api.updateDoctorSchedule(doctor.id, schedule);
      setSuccessMessage("Schedule updated.");
      await loadDoctors();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update schedule");
    }
  };

  const handleViewProfile = async (doctorId: number) => {
    try {
      setErrorMessage(null);
      const response = await api.getDoctorById(doctorId);
      setSelectedDoctor(response.doctor);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to view profile");
    }
  };

  return (
    <section>
      <h2>Doctor Management</h2>
      <p>Add doctors, view profiles, assign specialization, and review schedules.</p>

      {errorMessage && <p className="error-text">{errorMessage}</p>}
      {successMessage && <p className="success-text">{successMessage}</p>}

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <label htmlFor="doctorName">
          Full Name
          <input
            id="doctorName"
            value={formState.fullName}
            onChange={(event) =>
              setFormState((previous) => ({ ...previous, fullName: event.target.value }))
            }
          />
        </label>

        <label htmlFor="doctorEmail">
          Email
          <input
            id="doctorEmail"
            type="email"
            value={formState.email}
            onChange={(event) =>
              setFormState((previous) => ({ ...previous, email: event.target.value }))
            }
          />
        </label>

        <label htmlFor="doctorPhone">
          Phone
          <input
            id="doctorPhone"
            value={formState.phone}
            onChange={(event) =>
              setFormState((previous) => ({ ...previous, phone: event.target.value }))
            }
          />
        </label>

        <label htmlFor="doctorSpecialization">
          Specialization
          <input
            id="doctorSpecialization"
            value={formState.specialization}
            onChange={(event) =>
              setFormState((previous) => ({ ...previous, specialization: event.target.value }))
            }
          />
        </label>

        <label htmlFor="doctorSchedule">
          Schedule
          <input
            id="doctorSchedule"
            value={formState.schedule}
            onChange={(event) =>
              setFormState((previous) => ({ ...previous, schedule: event.target.value }))
            }
            placeholder="Mon-Thu 10:00-16:00"
          />
        </label>

        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Add Doctor"}
        </button>
      </form>

      {isLoading ? (
        <p>Loading doctors...</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Specialization</th>
                <th>Email</th>
                <th>Schedule</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {doctors.map((doctor) => (
                <tr key={doctor.id}>
                  <td>{doctor.fullName}</td>
                  <td>{doctor.specialization}</td>
                  <td>{doctor.email}</td>
                  <td>{doctor.schedule}</td>
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => handleViewProfile(doctor.id)}
                      >
                        View Profile
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => handleUpdateSpecialization(doctor)}
                      >
                        Assign Specialization
                      </button>
                      <button
                        className="btn btn-secondary"
                        type="button"
                        onClick={() => handleUpdateSchedule(doctor)}
                      >
                        Update Schedule
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {doctors.length === 0 && (
                <tr>
                  <td colSpan={5}>No doctors found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedDoctor && (
        <section className="detail-panel">
          <h3>Doctor Profile</h3>
          <p>
            <strong>Name:</strong> {selectedDoctor.fullName}
          </p>
          <p>
            <strong>Email:</strong> {selectedDoctor.email}
          </p>
          <p>
            <strong>Specialization:</strong> {selectedDoctor.specialization}
          </p>
          <p>
            <strong>Schedule:</strong> {selectedDoctor.schedule}
          </p>
        </section>
      )}
    </section>
  );
};
