export const ContactPage = () => {
  return (
    <section className="workspace-page">
      <section className="detail-panel">
        <h2>Contact</h2>
        <p className="muted-text">Need support with patient, doctor, or camp operations?</p>
      </section>

      <section className="quick-link-grid">
        <article className="quick-link-card">
          <p className="kpi-label">Email</p>
          <h3>support@medicalcamp.local</h3>
          <p className="muted-text">Use for confirmation code and registration issues.</p>
        </article>
        <article className="quick-link-card">
          <p className="kpi-label">Phone</p>
          <h3>+20 100 000 0000</h3>
          <p className="muted-text">For urgent patient and camp registration support.</p>
        </article>
        <article className="quick-link-card">
          <p className="kpi-label">Support Hours</p>
          <h3>Sunday - Thursday</h3>
          <p className="muted-text">9:00 AM - 5:00 PM</p>
        </article>
      </section>

      <div className="contact-grid detail-panel">
        <p>
          <strong>For patients:</strong> Include your full name and confirmation code.
        </p>
        <p>
          <strong>For admin teams:</strong> Include request ID and affected module for faster triage.
        </p>
      </div>
    </section>
  );
};
