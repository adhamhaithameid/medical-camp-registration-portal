import { useEffect, useState } from "react";
import type { Appointment, AppointmentInput, Doctor, Patient } from "@medical-camp/shared";
import { api } from "../lib/api";

const initialFormState = {
  patientId: "",
  doctorId: "",
  scheduledAt: "",
  reason: ""
};

const toLocalDateTimeInput = (isoDate: string) => {
  const date = new Date(isoDate);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const AppointmentsPage = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [formState, setFormState] = useState(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadDependencies = async () => {
    try {
      const [patientsResponse, doctorsResponse, appointmentsResponse] = await Promise.all([
        api.getPatients(false),
        api.getDoctors(),
        api.getAppointments()
      ]);

      setPatients(patientsResponse.patients);
      setDoctors(doctorsResponse.doctors);
      setAppointments(appointmentsResponse.appointments);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to load appointment data");
    }
  };

  useEffect(() => {
    loadDependencies();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!formState.patientId || !formState.doctorId || !formState.scheduledAt) {
      setErrorMessage("Patient, doctor, and schedule are required.");
      return;
    }

    const payload: AppointmentInput = {
      patientId: Number(formState.patientId),
      doctorId: Number(formState.doctorId),
      scheduledAt: new Date(formState.scheduledAt).toISOString(),
      reason: formState.reason.trim()
    };

    try {
      setIsSubmitting(true);
      await api.bookAppointment(payload);
      setFormState(initialFormState);
      setSuccessMessage("Appointment booked successfully.");
      await loadDependencies();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to book appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async (appointment: Appointment) => {
    const reason = window.prompt("Cancellation reason", appointment.cancelReason ?? "");

    try {
      await api.cancelAppointment(appointment.id, {
        reason: reason ?? "Cancelled from UI"
      });
      setSuccessMessage("Appointment cancelled.");
      await loadDependencies();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to cancel appointment");
    }
  };

  const handleReschedule = async (appointment: Appointment) => {
    const suggested = toLocalDateTimeInput(appointment.scheduledAt);
    const scheduledAt = window.prompt("New schedule (YYYY-MM-DDTHH:mm)", suggested);

    if (!scheduledAt) {
      return;
    }

    const reason = window.prompt("Reschedule reason", appointment.rescheduleReason ?? "");

    try {
      await api.rescheduleAppointment(appointment.id, {
        scheduledAt: new Date(scheduledAt).toISOString(),
        reason: reason ?? "Rescheduled from UI"
      });
      setSuccessMessage("Appointment rescheduled.");
      await loadDependencies();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to reschedule appointment");
    }
  };

  return (
    <section>
      <h2>Appointment System</h2>
      <p>Book, cancel, reschedule, and track appointments.</p>

      {errorMessage && <p className="error-text">{errorMessage}</p>}
      {successMessage && <p className="success-text">{successMessage}</p>}

      <form className="form-grid" onSubmit={handleSubmit} noValidate>
        <label htmlFor="appointmentPatient">
          Patient
          <select
            id="appointmentPatient"
            value={formState.patientId}
            onChange={(event) =>
              setFormState((previous) => ({ ...previous, patientId: event.target.value }))
            }
          >
            <option value="">Select patient</option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.fullName}
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="appointmentDoctor">
          Doctor
          <select
            id="appointmentDoctor"
            value={formState.doctorId}
            onChange={(event) =>
              setFormState((previous) => ({ ...previous, doctorId: event.target.value }))
            }
          >
            <option value="">Select doctor</option>
            {doctors.map((doctor) => (
              <option key={doctor.id} value={doctor.id}>
                {doctor.fullName} ({doctor.specialization})
              </option>
            ))}
          </select>
        </label>

        <label htmlFor="appointmentScheduledAt">
          Schedule
          <input
            id="appointmentScheduledAt"
            type="datetime-local"
            value={formState.scheduledAt}
            onChange={(event) =>
              setFormState((previous) => ({ ...previous, scheduledAt: event.target.value }))
            }
          />
        </label>

        <label htmlFor="appointmentReason">
          Reason
          <input
            id="appointmentReason"
            value={formState.reason}
            onChange={(event) =>
              setFormState((previous) => ({ ...previous, reason: event.target.value }))
            }
          />
        </label>

        <button className="btn btn-primary" type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Booking..." : "Book Appointment"}
        </button>
      </form>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Doctor</th>
              <th>Schedule</th>
              <th>Status</th>
              <th>Reason</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.map((appointment) => (
              <tr key={appointment.id}>
                <td>{appointment.patientName ?? appointment.patientId}</td>
                <td>{appointment.doctorName ?? appointment.doctorId}</td>
                <td>{new Date(appointment.scheduledAt).toLocaleString()}</td>
                <td>{appointment.status}</td>
                <td>{appointment.reason ?? "-"}</td>
                <td>
                  <div className="row-actions">
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => handleCancel(appointment)}
                      disabled={appointment.status === "CANCELLED"}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={() => handleReschedule(appointment)}
                      disabled={appointment.status === "CANCELLED"}
                    >
                      Reschedule
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {appointments.length === 0 && (
              <tr>
                <td colSpan={6}>No appointments found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
};
