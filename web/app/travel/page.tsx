"use client";

const tripStats = [
  {
    title: "Travel readiness",
    value: "74%",
    detail: "Trip planning remains comfortably ahead of the target date.",
  },
  {
    title: "Budget envelope",
    value: "₹1.6L",
    detail: "Current budget supports a balanced travel plan without strain.",
  },
  {
    title: "Savings cadence",
    value: "₹12K",
    detail: "Contribution pace remains consistent and resilient.",
  },
  {
    title: "Flex buffer",
    value: "Healthy",
    detail: "There is enough slack to absorb medium changes in trip costs.",
  },
];

const actions = [
  "Align the trip budget with current airfare and stay assumptions.",
  "Review the itinerary against the planned travel timeline and slack.",
  "Check whether this should remain a self-funded or partially shared trip plan.",
  "Finalize a backup plan for weather, schedule, or transit disruptions.",
];

export default function TravelPage() {
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
          <a href="/travel">Travel</a>
        </nav>
      </header>

      <section className="feature-header panel">
        <div>
          <p className="eyebrow accent">TRAVEL</p>
          <h2>
            Track vacation plans, financial buffer, and trip readiness without
            overcommitting.
          </h2>
        </div>

        <div className="summary-strip" aria-label="Travel summary">
          <div>
            <span className="meta-label">Timing</span>
            <strong>Planned</strong>
          </div>
          <div>
            <span className="meta-label">Budget</span>
            <strong>Balanced</strong>
          </div>
          <div>
            <span className="meta-label">Flex</span>
            <strong>Ready</strong>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <article className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">READINESS</p>
              <h3>Trip health</h3>
            </div>
          </div>

          <div className="insight-grid three-up">
            {tripStats.map((item) => (
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
