import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Camp } from "@medical-camp/shared";
import { ErrorCallout } from "../components/ErrorCallout";
import { api } from "../lib/api";

export const CampDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [camp, setCamp] = useState<Camp | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const loadCamp = async (campId: number, cancelled = false) => {
    try {
      setIsLoading(true);
      const response = await api.getCampById(campId);
      if (!cancelled) {
        setCamp(response.camp);
      }
    } catch (requestError) {
      if (!cancelled) {
        setError(requestError);
      }
    } finally {
      if (!cancelled) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const campId = Number(id);

      if (!Number.isInteger(campId) || campId <= 0) {
        setError(new Error("Invalid camp id"));
        setIsLoading(false);
        return;
      }

      await loadCamp(campId, cancelled);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return <p>Loading camp details...</p>;
  }

  if (error) {
    return (
      <section className="workspace-page">
        <ErrorCallout
          error={error}
          onRetry={() => {
            const campId = Number(id);
            if (Number.isInteger(campId) && campId > 0) {
              return loadCamp(campId);
            }
            return undefined;
          }}
        />
      </section>
    );
  }

  if (!camp) {
    return <p>Camp not found.</p>;
  }

  return (
    <section className="workspace-page detail-panel">
      <h2>{camp.name}</h2>
      <p>
        <strong>Date:</strong> {new Date(camp.date).toLocaleString()}
      </p>
      <p>
        <strong>Location:</strong> {camp.location}
      </p>
      <p>{camp.description}</p>
      <p>
        <strong>Capacity:</strong> {camp.capacity}
      </p>
      <p>
        <strong>Confirmed:</strong> {camp.confirmedCount} | <strong>Waitlist:</strong> {camp.waitlistCount}
      </p>
      <p>
        <strong>Remaining Seats:</strong>{" "}
        <span
          className={
            camp.remainingSeats > 0 ? "status-chip status-chip-green" : "status-chip status-chip-amber"
          }
        >
          {camp.remainingSeats}
        </span>
      </p>

      <div className="hero-actions">
        <Link className="btn btn-primary" to={`/register?campId=${camp.id}`}>
          Register For This Camp
        </Link>
        <Link className="btn btn-secondary" to="/">
          Back To Camps
        </Link>
      </div>
    </section>
  );
};
