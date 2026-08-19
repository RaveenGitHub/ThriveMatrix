const metrics = [
  {
    label: "Financial security",
    value: "Not configured",
    detail: "Connect goals and transactions to calculate this view.",
  },
  {
    label: "Investment portfolio",
    value: "No positions",
    detail: "Add an investment to begin tracking value and allocation.",
  },
  {
    label: "Life goals",
    value: "0 active",
    detail: "Create a goal with a target amount and date.",
  },
  {
    label: "Risk protection",
    value: "Not configured",
    detail: "Add policies to calculate coverage completeness.",
  },
];

export default function Home() {
  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">
          TM
        </div>
        <div>
          <p className="eyebrow">THIJO CORP / PRIVATE BETA</p>
          <h1>ThriveMatrix</h1>
        </div>
        <span className="environment">Stage 0 foundation</span>
      </header>

      <section className="intro" aria-labelledby="overview-title">
        <div>
          <p className="eyebrow">YOUR LIFE CAPITAL MAP</p>
          <h2 id="overview-title">
            A clear view of what is growing, protected, and still in motion.
          </h2>
        </div>
        <p className="intro-note">
          Tracking and planning insights only. This product does not provide
          financial advice.
        </p>
      </section>

      <section
        className="metric-grid"
        aria-label="ThriveMatrix overview metrics"
      >
        {metrics.map((metric) => (
          <article className="metric" key={metric.label}>
            <p className="metric-label">{metric.label}</p>
            <p className="metric-value">{metric.value}</p>
            <p className="metric-detail">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="readiness" aria-labelledby="readiness-title">
        <div>
          <p className="eyebrow">NEXT CONTROLLED STEP</p>
          <h2 id="readiness-title">Build your first trustworthy baseline.</h2>
          <p>
            Identity, data ownership, and calculation rules are established
            before personal financial records enter the system.
          </p>
        </div>
        <div
          className="progress-track"
          aria-label="Stage 0 progress: foundation in progress"
        >
          <span className="progress-fill" />
        </div>
      </section>
    </main>
  );
}
