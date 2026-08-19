"use client";

const careerMetrics = [
  {
    label: "Income stability",
    value: "84%",
    detail: "Role income remains diversified and resilient.",
  },
  {
    label: "Skill momentum",
    value: "76%",
    detail: "Learning plan is consistent and growing.",
  },
  {
    label: "Career runway",
    value: "5.2 yrs",
    detail: "Current trajectory supports near-term flexibility.",
  },
  {
    label: "Opportunity readiness",
    value: "High",
    detail: "Profile strength remains solid for transitions.",
  },
];

const milestones = [
  "Review role alignment and compensation stability for the next planning cycle.",
  "Reassess the learning roadmap against current capability gaps and goals.",
  "Track networking goals and momentum for the next 90-day window.",
  "Confirm whether transition readiness should remain active or be paused.",
];

export default function CareerPage() {
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
          <a href="/career">Career</a>
        </nav>
      </header>

      <section className="feature-header panel">
        <div>
          <p className="eyebrow accent">CAREER</p>
          <h2>
            Track professional momentum, role stability, and growth readiness.
          </h2>
        </div>

        <div className="summary-strip" aria-label="Career summary">
          <div>
            <span className="meta-label">Stability</span>
            <strong>Healthy</strong>
          </div>
          <div>
            <span className="meta-label">Learning</span>
            <strong>Active</strong>
          </div>
          <div>
            <span className="meta-label">Transitions</span>
            <strong>Ready</strong>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <article className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">MOMENTUM</p>
              <h3>Career health</h3>
            </div>
          </div>

          <div className="insight-grid three-up">
            {careerMetrics.map((metric) => (
              <div className="insight-box" key={metric.label}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
                <small>{metric.detail}</small>
              </div>
            ))}
          </div>
        </article>

        <aside className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">NEXT STEPS</p>
              <h3>Quarter focus</h3>
            </div>
          </div>

          <ul className="activity-list">
            {milestones.map((step) => (
              <li key={step}>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}
