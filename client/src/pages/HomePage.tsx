import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { Camp } from "@medical-camp/shared";
import { api } from "../lib/api";
import { ErrorCallout } from "../components/ErrorCallout";

export const HomePage = () => {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

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
          setError(error);
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

      <section className="quick-link-grid" aria-label="Patient shortcuts">
        <Link className="quick-link-card" to="/register">
          <p className="kpi-label">Quick Action</p>
          <h3>Register For Camp</h3>
          <p className="muted-text">Submit your camp registration in less than a minute.</p>
        </Link>
        <Link className="quick-link-card" to="/registration/manage">
          <p className="kpi-label">Self Service</p>
          <h3>Manage Registration</h3>
          <p className="muted-text">Update details or cancel using your confirmation code.</p>
        </Link>
        <Link className="quick-link-card" to="/contact">
          <p className="kpi-label">Need Help</p>
          <h3>Contact Support</h3>
          <p className="muted-text">Reach the operations desk for urgent camp support.</p>
        </Link>
      </section>

      <ErrorCallout error={error} onRetry={() => api.getCamps().then((response) => setCamps(response.camps))} />

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

      <div className="section-title-row">
        <h3>Available Camps</h3>
        <p className="muted-text">Browse schedules, capacity, and registration status.</p>
      </div>

      {isLoading ? (
        <p>Loading camps...</p>
      ) : (
        <section className="card-grid">
          {camps.map((camp) => (
            <article key={camp.id} className="camp-card">
              <h3>{camp.name}</h3>
              <p className="camp-meta">{new Date(camp.date).toLocaleString()}</p>
              <p className="camp-meta">{camp.location}</p>
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
