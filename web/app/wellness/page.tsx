"use client";

const wellnessChecks = [
  {
    title: "Sleep quality",
    score: "78%",
    detail: "Sleep routine is stable across the last 30 days.",
  },
  {
    title: "Activity level",
    score: "82%",
    detail: "Movement targets are being met on most weeks.",
  },
  {
    title: "Stress resilience",
    score: "69%",
    detail: "Breathing and recovery habits need a small uplift.",
  },
  {
    title: "Nutrition rhythm",
    score: "74%",
    detail: "Meal consistency remains mostly healthy and sustainable.",
  },
];

const plans = [
  "Review sleep and recovery routine before next week begins.",
  "Increase movement frequency on low-energy days for better consistency.",
  "Schedule a lighter rhythm review for stress management and hydration.",
  "Track nutrition patterns to reduce reactive eating triggers.",
];

export default function WellnessPage() {
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
          <a href="/wellness">Wellness</a>
        </nav>
      </header>

      <section className="feature-header panel">
        <div>
          <p className="eyebrow accent">WELLNESS</p>
          <h2>
            Track wellbeing signals that support long-term personal resilience.
          </h2>
        </div>

        <div className="summary-strip" aria-label="Wellness summary">
          <div>
            <span className="meta-label">Recovery</span>
            <strong>Healthy</strong>
          </div>
          <div>
            <span className="meta-label">Energy</span>
            <strong>Stable</strong>
          </div>
          <div>
            <span className="meta-label">Focus</span>
            <strong>Active</strong>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <article className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">HEALTH</p>
              <h3>Wellbeing indicators</h3>
            </div>
          </div>

          <div className="insight-grid two-col">
            {wellnessChecks.map((item) => (
              <div className="insight-box" key={item.title}>
                <span>{item.title}</span>
                <strong>{item.score}</strong>
                <small>{item.detail}</small>
              </div>
            ))}
          </div>
        </article>

        <aside className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">PLAN</p>
              <h3>Next focus actions</h3>
            </div>
          </div>

          <ul className="activity-list">
            {plans.map((step) => (
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
