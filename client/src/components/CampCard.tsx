import { Link } from "react-router-dom";
import type { Camp } from "@medical-camp/shared";

interface CampCardProps {
  camp: Camp;
}

const formatDate = (dateValue: string) =>
  new Date(dateValue).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });

export const CampCard = ({ camp }: CampCardProps) => {
  return (
    <article className="camp-card">
      <div className="camp-card-meta">
        <p>{formatDate(camp.date)}</p>
        <p>{camp.location}</p>
      </div>
      <h3>{camp.name}</h3>
      <p>{camp.description}</p>
      <p>
        Capacity: <strong>{camp.capacity}</strong>
      </p>
      <Link className="inline-link" to={`/camps/${camp.id}`}>
        View full details
      </Link>
    </article>
  );
};
