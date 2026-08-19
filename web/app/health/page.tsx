"use client";

const healthStats = [
  {
    title: "Vital readiness",
    value: "81%",
    detail:
      "Core health markers remain stable, with a manageable care plan in place.",
  },
  {
    title: "Checkup cadence",
    value: "On track",
    detail:
      "Upcoming reviews remain aligned with the current personal health plan.",
  },
  {
    title: "Risk posture",
    value: "Moderate",
    detail:
      "There are no major issues, but a steady review cadence still matters.",
  },
  {
    title: "Recovery buffer",
    value: "Healthy",
    detail:
      "Recovery capacity and flexibility are strong enough for incremental changes.",
  },
];

const actions = [
  "Review the next medical checkup and confirm the timing, provider, and follow-up plan.",
  "Check whether the current medication or routine needs any recent adjustments or documentation.",
  "Align the health plan with sleep, activity, and stress levels that have changed over time.",
  "Keep a simple emergency and insurance summary handy for quicker decisions in a health event.",
];

export default function HealthPage() {
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
          <a href="/health">Health</a>
        </nav>
      </header>

      <section className="feature-header panel">
        <div>
          <p className="eyebrow accent">HEALTH</p>
          <h2>
            Keep personal health planning realistic, reviewed, and aligned with
            your broader life readiness model.
          </h2>
        </div>

        <div className="summary-strip" aria-label="Health summary">
          <div>
            <span className="meta-label">Status</span>
            <strong>Stable</strong>
          </div>
          <div>
            <span className="meta-label">Care plan</span>
            <strong>Active</strong>
          </div>
          <div>
            <span className="meta-label">Priority</span>
            <strong>High</strong>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <article className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">READINESS</p>
              <h3>Health management</h3>
            </div>
          </div>

          <div className="insight-grid three-up">
            {healthStats.map((item) => (
              <div className="insight-box" key={item.title}>
                <span>{item.title}</span>
                <strong>{item.value}</strong>
                <small>{item.detail}</small>
              </div>
            ))}
          </div>
        </article>

        <aside className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">ACTIONS</p>
              <h3>Next checks</h3>
            </div>
          </div>

          <ul className="activity-list">
            {actions.map((step) => (
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
