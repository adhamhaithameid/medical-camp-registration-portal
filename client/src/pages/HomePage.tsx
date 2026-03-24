import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Camp } from "@medical-camp/shared";
import { api } from "../lib/api";

export const HomePage = () => {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setIsLoading(true);
        const response = await api.getCamps();
        if (!cancelled) {
          setCamps(response.camps);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load camps");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalRemainingSeats = camps.reduce((sum, camp) => sum + camp.remainingSeats, 0);
  const campsWithWaitlist = camps.filter((camp) => camp.waitlistCount > 0).length;

  return (
    <section className="workspace-page">
      <section className="hero-section">
        <p className="eyebrow">Hospital Operations + Camp Operations</p>
        <h2>Complete Hospital Management System</h2>
        <p>
          Operate all core modules from one secure workspace with structured records, access
          control, and real-time camp capacity visibility.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/admin/patients">
            Manage Patients
          </Link>
          <Link className="btn btn-secondary" to="/admin/doctors">
            Manage Doctors
          </Link>
          <Link className="btn btn-secondary" to="/admin/users">
            Manage Admins
          </Link>
        </div>
      </section>

      {errorMessage && <p className="error-text">{errorMessage}</p>}

      <section className="kpi-grid" aria-label="Operations overview">
        <article className="kpi-item">
          <p className="kpi-label">Active Camps</p>
          <p className="kpi-value">{camps.length}</p>
        </article>
        <article className="kpi-item">
          <p className="kpi-label">Total Remaining Seats</p>
          <p className="kpi-value">{totalRemainingSeats}</p>
        </article>
        <article className="kpi-item">
          <p className="kpi-label">Camps With Waitlist</p>
          <p className="kpi-value">{campsWithWaitlist}</p>
        </article>
      </section>

      {isLoading ? (
        <p>Loading camps...</p>
      ) : (
        <section className="card-grid">
          {camps.map((camp) => (
            <article key={camp.id} className="camp-card">
              <h3>{camp.name}</h3>
              <p>{new Date(camp.date).toLocaleString()}</p>
              <p>{camp.location}</p>
              <p className="muted-text">{camp.description}</p>
              <p>
                Seats Left: <strong>{camp.remainingSeats}</strong> / {camp.capacity}
              </p>
              {camp.remainingSeats === 0 ? (
                <p className="waitlist-tag">Camp Full - New signups join waitlist</p>
              ) : (
                <p className="status-chip status-chip-green">Seats available</p>
              )}
              <div className="hero-actions">
                <Link className="btn btn-secondary" to={`/camps/${camp.id}`}>
                  View Details
                </Link>
                <Link className="btn btn-primary" to={`/register?campId=${camp.id}`}>
                  Register
                </Link>
              </div>
            </article>
          ))}
          {camps.length === 0 && <p>No active camps found.</p>}
        </section>
      )}
    </section>
  );
};
