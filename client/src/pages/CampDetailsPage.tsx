import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Camp } from "@medical-camp/shared";
import { api } from "../lib/api";

export const CampDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const [camp, setCamp] = useState<Camp | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const campId = Number(id);

      if (!Number.isInteger(campId) || campId <= 0) {
        setErrorMessage("Invalid camp id");
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await api.getCampById(campId);
        if (!cancelled) {
          setCamp(response.camp);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load camp");
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
  }, [id]);

  if (isLoading) {
    return <p>Loading camp details...</p>;
  }

  if (errorMessage) {
    return <p className="error-text">{errorMessage}</p>;
  }

  if (!camp) {
    return <p>Camp not found.</p>;
  }

  return (
    <section className="detail-panel">
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
        <strong>Confirmed:</strong> {camp.confirmedCount} | <strong>Waitlist:</strong>{" "}
        {camp.waitlistCount}
      </p>
      <p>
        <strong>Remaining Seats:</strong> {camp.remainingSeats}
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
