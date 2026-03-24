import { Link } from "react-router-dom";

export const HomePage = () => {
  return (
    <section className="hero-section">
      <p className="eyebrow">Community health, simplified coordination</p>
      <h2>Find nearby medical camps and reserve your participation in minutes.</h2>
      <p>
        This portal helps participants discover upcoming camps, submit registration forms,
        and receive confirmation in one clear journey.
      </p>
      <div className="hero-actions">
        <Link className="btn btn-primary" to="/camps">
          Explore Camps
        </Link>
        <Link className="btn btn-secondary" to="/register">
          Register Now
        </Link>
      </div>
    </section>
  );
};
