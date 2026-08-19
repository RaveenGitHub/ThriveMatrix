"use client";

const retirementStats = [
  {
    title: "Retirement readiness",
    value: "71%",
    detail: "Current trajectory remains constructive and steadily improving.",
  },
  {
    title: "Corpus target",
    value: "₹1.8Cr",
    detail:
      "Target is in line with the current planning horizon and lifestyle model.",
  },
  {
    title: "Monthly contributions",
    value: "₹38K",
    detail: "Savings rate supports continued contribution momentum.",
  },
  {
    title: "Drawdown health",
    value: "Stable",
    detail: "Distribution assumptions remain conservative and manageable.",
  },
];

const actions = [
  "Align future contributions with updated inflation and lifestyle assumptions.",
  "Re-check goal sequencing against home purchase, education, and family commitments.",
  "Confirm whether the retirement runway should expand or remain in the current pacing model.",
  "Review portfolio allocation to maintain a resilient long-term balance.",
];

export default function RetirementPage() {
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
          <a href="/retirement">Retirement</a>
        </nav>
      </header>

      <section className="feature-header panel">
        <div>
          <p className="eyebrow accent">RETIREMENT</p>
          <h2>
            Review long-term capital health, contribution pace, and plan
            resilience.
          </h2>
        </div>

        <div className="summary-strip" aria-label="Retirement summary">
          <div>
            <span className="meta-label">Trajectory</span>
            <strong>Positive</strong>
          </div>
          <div>
            <span className="meta-label">Inflation view</span>
            <strong>Moderate</strong>
          </div>
          <div>
            <span className="meta-label">Risk posture</span>
            <strong>Balanced</strong>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <article className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">READINESS</p>
              <h3>Retirement health</h3>
            </div>
          </div>

          <div className="insight-grid three-up">
            {retirementStats.map((item) => (
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
              <h3>Next planning moves</h3>
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
