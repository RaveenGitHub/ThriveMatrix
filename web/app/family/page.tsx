"use client";

const familyStats = [
  {
    title: "Relationship readiness",
    value: "82%",
    detail:
      "The current family and support network remains stable and well-aligned.",
  },
  {
    title: "Care load",
    value: "Balanced",
    detail: "Current responsibilities are manageable without excessive strain.",
  },
  {
    title: "Emergency support",
    value: "7 people",
    detail: "The plan includes clear fallback coverage for urgent situations.",
  },
  {
    title: "Communication rhythm",
    value: "Healthy",
    detail: "Family check-ins and decision loops are timely and consistent.",
  },
];

const actions = [
  "Review the household support map and confirm who is accountable for urgent decisions.",
  "Clarify next-level care, financial, and logistics responsibilities across key family members.",
  "Validate whether emergency contacts and document access are still current and secure.",
  "Set a shared cadence for family planning, communication, and milestone updates.",
];

export default function FamilyPage() {
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
          <a href="/family">Family</a>
        </nav>
      </header>

      <section className="feature-header panel">
        <div>
          <p className="eyebrow accent">FAMILY</p>
          <h2>
            Keep relationships, care responsibilities, and support plans aligned
            with your life decisions.
          </h2>
        </div>

        <div className="summary-strip" aria-label="Family summary">
          <div>
            <span className="meta-label">Support</span>
            <strong>Active</strong>
          </div>
          <div>
            <span className="meta-label">Balance</span>
            <strong>Healthy</strong>
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
              <h3>Family health</h3>
            </div>
          </div>

          <div className="insight-grid three-up">
            {familyStats.map((item) => (
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
              <h3>Next decisions</h3>
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
