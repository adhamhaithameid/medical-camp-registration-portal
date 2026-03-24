import { useEffect, useState } from "react";
import type { AdminRegistrationRecord } from "@medical-camp/shared";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const formatDateTime = (dateValue: string) =>
  new Date(dateValue).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

export const AdminRegistrationsPage = () => {
  const navigate = useNavigate();
  const [registrations, setRegistrations] = useState<AdminRegistrationRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadRegistrations = async () => {
      try {
        const response = await api.getAdminRegistrations();
        if (!ignore) {
          setRegistrations(response.registrations);
        }
      } catch (error) {
        if (!ignore) {
          const message = error instanceof Error ? error.message : "Unable to load registrations";

          if (message.toLowerCase().includes("authentication") || message.toLowerCase().includes("invalid")) {
            navigate("/admin/login", { replace: true });
            return;
          }

          setErrorMessage(message);
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadRegistrations();

    return () => {
      ignore = true;
    };
  }, [navigate]);

  const handleLogout = async () => {
    await api.logout();
    navigate("/admin/login", { replace: true });
  };

  return (
    <section>
      <div className="section-header-inline">
        <h2>Registered Participants</h2>
        <button className="btn btn-secondary" onClick={handleLogout} type="button">
          Logout
        </button>
      </div>

      {isLoading && <p>Loading registration records...</p>}
      {errorMessage && <p className="error-text">{errorMessage}</p>}

      {!isLoading && !errorMessage && registrations.length === 0 && (
        <p>No registrations have been submitted yet.</p>
      )}

      {!isLoading && registrations.length > 0 && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Participant</th>
                <th>Age</th>
                <th>Contact</th>
                <th>Camp</th>
                <th>Camp Date</th>
                <th>Submitted At</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((registration) => (
                <tr key={registration.id}>
                  <td>{registration.fullName}</td>
                  <td>{registration.age}</td>
                  <td>{registration.contactNumber}</td>
                  <td>{registration.campName}</td>
                  <td>{new Date(registration.campDate).toLocaleDateString()}</td>
                  <td>{formatDateTime(registration.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
