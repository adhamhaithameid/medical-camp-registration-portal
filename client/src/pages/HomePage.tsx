import { Link } from "react-router-dom";

export const HomePage = () => {
  return (
    <section className="hero-section">
      <p className="eyebrow">Architecture. Modularity. Low coupling.</p>
      <h2>Hospital Management System</h2>
      <p>
        Manage patients, doctors, appointments, billing, and authentication workflows in one
        cohesive platform.
      </p>

      <ul className="module-list">
        <li>Patient Management: add, update, history, soft delete</li>
        <li>Doctor Management: profile, specialization, schedule</li>
        <li>Appointment System: book, cancel, reschedule, view</li>
        <li>Billing System: invoice, total cost, payment, history</li>
        <li>Authentication System: registration, login, logout</li>
      </ul>

      <div className="hero-actions">
        <Link className="btn btn-primary" to="/auth">
          Login / Register
        </Link>
        <Link className="btn btn-secondary" to="/patients">
          Open HMS Modules
        </Link>
      </div>
    </section>
  );
};
