"use client";

const purposeStats = [
  {
    title: "Purpose clarity",
    value: "Strong",
    detail:
      "Current goals and values are aligned enough to make choices with more confidence.",
  },
  {
    title: "Meaning score",
    value: "81%",
    detail:
      "Life direction remains meaningful and energizing without becoming overly rigid.",
  },
  {
    title: "Energy source",
    value: "Healthy",
    detail:
      "The portfolio of work, relationships, and personal activities is mostly sustaining.",
  },
  {
    title: "Focus drift",
    value: "Low",
    detail:
      "There is some room to simplify, but the system is not currently overloaded.",
  },
];

const actions = [
  "Clarify which outcomes matter most so future choices are guided by a stable sense of direction.",
  "Identify the few activities that create genuine meaning and protect time for them consistently.",
  "Review whether current commitments still reflect the life you want to build, not just the habits you inherited.",
  "Keep a simple annual purpose check-in to reset priorities before they drift into noise.",
];

const values = [
  { name: "Growth", strength: "High" },
  { name: "Security", strength: "High" },
  { name: "Connection", strength: "Strong" },
  { name: "Freedom", strength: "Moderate" },
  { name: "Contribution", strength: "High" },
];

export default function PurposePage() {
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
          <a href="/purpose">Purpose</a>
        </nav>
      </header>

      <section className="feature-header panel">
        <div>
          <p className="eyebrow accent">PURPOSE</p>
          <h2>
            Define what matters most so your plans, habits, and investments stay
            aligned with your long-term life direction.
          </h2>
        </div>

        <div className="summary-strip" aria-label="Purpose summary">
          <div>
            <span className="meta-label">Direction</span>
            <strong>Clear</strong>
          </div>
          <div>
            <span className="meta-label">Meaning</span>
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
              <p className="eyebrow">ALIGNMENT</p>
              <h3>Purpose overview</h3>
            </div>
          </div>

          <div className="insight-grid three-up">
            {purposeStats.map((item) => (
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

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">VALUES</p>
            <h3>Signal map</h3>
          </div>
        </div>

        <div className="goal-list">
          {values.map((value) => (
            <div className="goal-item" key={value.name}>
              <div className="goal-topline">
                <strong>{value.name}</strong>
                <span className="pill success">{value.strength}</span>
              </div>
              <div className="goal-details">
                <span>Value strength</span>
                <span>{value.strength}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
