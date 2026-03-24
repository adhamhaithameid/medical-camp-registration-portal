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

  return (
    <div>
      <section className="hero-section">
        <p className="eyebrow">Hospital Operations + Camp Operations</p>
        <h2>Complete Hospital Management System</h2>
        <p>
          Manage patients, doctors, and admin users with full CRUD capabilities while keeping the
          medical camp registration workflows active in the same platform.
        </p>
        <div className="hero-actions">
          <Link className="btn btn-primary" to="/admin/patients">
            Open Patients Module
          </Link>
          <Link className="btn btn-secondary" to="/admin/doctors">
            Open Doctors Module
          </Link>
          <Link className="btn btn-secondary" to="/admin/users">
            Open Admins Module
          </Link>
        </div>
      </section>

      {errorMessage && <p className="error-text">{errorMessage}</p>}

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
                <p className="success-text">Seats available</p>
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
    </div>
  );
};
