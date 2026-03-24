import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { Camp } from "@medical-camp/shared";
import { api } from "../lib/api";

const formatDate = (dateValue: string) =>
  new Date(dateValue).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

export const CampDetailsPage = () => {
  const { campId } = useParams();
  const [camp, setCamp] = useState<Camp | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campId) {
      setError("Camp id is missing");
      setIsLoading(false);
      return;
    }

    let ignore = false;

    const loadCamp = async () => {
      try {
        const response = await api.getCampById(Number(campId));
        if (!ignore) {
          setCamp(response.camp);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load camp details");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadCamp();

    return () => {
      ignore = true;
    };
  }, [campId]);

  if (isLoading) {
    return <p>Loading camp details...</p>;
  }

  if (error || !camp) {
    return (
      <section>
        <p className="error-text">{error ?? "Camp not found"}</p>
        <Link className="inline-link" to="/camps">
          Back to camps
        </Link>
      </section>
    );
  }

  return (
    <section className="detail-panel">
      <h2>{camp.name}</h2>
      <p>
        <strong>Date:</strong> {formatDate(camp.date)}
      </p>
      <p>
        <strong>Location:</strong> {camp.location}
      </p>
      <p>
        <strong>Description:</strong> {camp.description}
      </p>
      <p>
        <strong>Capacity:</strong> {camp.capacity}
      </p>
      <Link className="btn btn-primary" to="/register">
        Register for this Camp
      </Link>
    </section>
  );
};
