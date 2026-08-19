"use client";

const securityScores = [
  {
    label: "Authentication",
    value: "98%",
    note: "Token refresh and expiry controls are active.",
  },
  {
    label: "Data isolation",
    value: "96%",
    note: "Owner-scoped access is enforced on all records.",
  },
  {
    label: "Audit logs",
    value: "94%",
    note: "Sensitive writes remain traceable and reviewable.",
  },
  {
    label: "Redaction",
    value: "99%",
    note: "Private fields remain masked in logs and exports.",
  },
];

const controls = [
  "Access tokens are short-lived and revocable.",
  "Cross-user mutations are blocked by ownership checks.",
  "Audit events capture actor, timestamp, target, and reason.",
  "Sensitive values remain masked in telemetry and exports.",
];

const events = [
  {
    id: "SEC-204",
    title: "Password reset review",
    status: "Approved",
    detail: "Recovery flow verified for account safety.",
  },
  {
    id: "SEC-312",
    title: "Consent export check",
    status: "Review",
    detail: "Retention and export review is underway.",
  },
  {
    id: "SEC-421",
    title: "Audit replay test",
    status: "Healthy",
    detail: "Recent mutation log is replay-safe and complete.",
  },
];

export default function SecurityPage() {
  return (
    <main className="page-shell feature-page">
      <header className="topbar">
        <div className="brand-wrap">
          <div className="brand-mark" aria-hidden="true">
            TM
          </div>
          <div>
            <p className="eyebrow">PRIVATE BETA / INDIA-FIRST</p>
            <h1>ThriveMatrix</h1>
          </div>
        </div>

        <nav className="main-nav" aria-label="Main navigation">
          <a href="/">Overview</a>
          <a href="/goals">Goals</a>
          <a href="/portfolio">Portfolio</a>
          <a href="/transactions">Transactions</a>
          <a href="/security">Security</a>
        </nav>
      </header>

      <section className="feature-header panel">
        <div>
          <p className="eyebrow accent">SECURITY</p>
          <h2>Protect user identity, private records, and change integrity.</h2>
        </div>

        <div className="summary-strip" aria-label="Security summary">
          <div>
            <span className="meta-label">Risk posture</span>
            <strong>Controlled</strong>
          </div>
          <div>
            <span className="meta-label">Audit health</span>
            <strong>Stable</strong>
          </div>
          <div>
            <span className="meta-label">Policy mode</span>
            <strong>Owner-scoped</strong>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <article className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">CONTROL STACK</p>
              <h3>Security coverage</h3>
            </div>
          </div>

          <div className="insight-grid three-up">
            {securityScores.map((metric) => (
              <div className="insight-box" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.note}</small>
              </div>
            ))}
          </div>
        </article>

        <aside className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">PROTECTION</p>
              <h3>Core controls</h3>
            </div>
          </div>

          <ul className="activity-list">
            {controls.map((step) => (
              <li key={step}>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>

      <section className="panel bottom-grid">
        <div className="section-head">
          <div>
            <p className="eyebrow">AUDIT</p>
            <h3>Recent review events</h3>
          </div>
        </div>

        <div className="goal-list compact-list">
          {events.map((event) => (
            <div className="goal-item" key={event.id}>
              <div className="goal-topline">
                <strong>{event.title}</strong>
                <span className="pill success">{event.status}</span>
              </div>
              <div className="goal-details">
                <span>{event.id}</span>
                <span>{event.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
