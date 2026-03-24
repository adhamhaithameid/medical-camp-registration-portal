import { useEffect, useState } from "react";
import type { Camp } from "@medical-camp/shared";
import { api } from "../lib/api";
import { CampCard } from "../components/CampCard";

export const CampsPage = () => {
  const [camps, setCamps] = useState<Camp[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    const loadCamps = async () => {
      try {
        const response = await api.getCamps();
        if (!ignore) {
          setCamps(response.camps);
        }
      } catch (loadError) {
        if (!ignore) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load camps");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    loadCamps();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section>
      <h2>Camp Details</h2>
      <p>Browse current medical camp opportunities, schedule, and location details.</p>

      {isLoading && <p>Loading camps...</p>}
      {error && <p className="error-text">{error}</p>}

      <div className="camp-grid">
        {camps.map((camp) => (
          <CampCard key={camp.id} camp={camp} />
        ))}
      </div>
    </section>
  );
};
