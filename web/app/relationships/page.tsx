"use client";

const relationshipStats = [
  {
    title: "Connection health",
    value: "84%",
    detail:
      "Your key relationships remain supportive, consistent, and well-connected.",
  },
  {
    title: "Care network",
    value: "6 links",
    detail:
      "The support system covers core emotional, practical, and planning needs.",
  },
  {
    title: "Quality rhythm",
    value: "Strong",
    detail:
      "Communication and check-ins are happening with enough regularity to remain healthy.",
  },
  {
    title: "Alignment score",
    value: "Healthy",
    detail:
      "Current relationship priorities are consistent with the broader life plan.",
  },
];

const actions = [
  "Review whether the most important relationships still have clear communication and shared planning rhythms.",
  "Confirm that support roles are still aligned with recent life changes or growing responsibilities.",
  "Set a small recurring check-in for the people who matter most in high-impact life decisions.",
  "Keep a simple map of trusted relationships for emotional, practical, and emergency support.",
];

export default function RelationshipsPage() {
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
          <a href="/relationships">Relationships</a>
        </nav>
      </header>

      <section className="feature-header panel">
        <div>
          <p className="eyebrow accent">RELATIONSHIPS</p>
          <h2>
            Keep the people and support ties that matter most aligned with your
            life, planning, and resilience goals.
          </h2>
        </div>

        <div className="summary-strip" aria-label="Relationships summary">
          <div>
            <span className="meta-label">Support</span>
            <strong>Active</strong>
          </div>
          <div>
            <span className="meta-label">Health</span>
            <strong>Strong</strong>
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
              <h3>Relationship health</h3>
            </div>
          </div>

          <div className="insight-grid three-up">
            {relationshipStats.map((item) => (
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
              <h3>Next priorities</h3>
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
