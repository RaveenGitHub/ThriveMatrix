"use client";

const alerts = [
  {
    id: "A-101",
    title: "Emergency Fund",
    category: "Goal overdue",
    severity: "High",
    detail: "Target date was missed by 14 days; review funding and timeline.",
    owner: "Goals team",
  },
  {
    id: "A-204",
    title: "Family Health Policy",
    category: "Policy renewal",
    severity: "Medium",
    detail: "Renewal is due in 11 days; confirm coverage and premium budget.",
    owner: "Risk review",
  },
  {
    id: "A-318",
    title: "Travel spend spike",
    category: "Budget variance",
    severity: "Medium",
    detail: "Food and travel are 12% above the target this cycle.",
    owner: "Finance ops",
  },
  {
    id: "A-417",
    title: "Will and nominee review",
    category: "Legal readiness",
    severity: "Low",
    detail: "Nominee details require a final confirmation before audit close.",
    owner: "Life domains",
  },
];

const summary = [
  { label: "Open alerts", value: "4" },
  { label: "High priority", value: "1" },
  { label: "Due this week", value: "2" },
  { label: "Resolved", value: "8" },
];

export default function AlertsPage() {
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
          <a href="/alerts">Alerts</a>
        </nav>
      </header>

      <section className="feature-header panel">
        <div>
          <p className="eyebrow accent">ALERTS</p>
          <h2>
            Monitor the issues that need attention across goals and life plans.
          </h2>
        </div>

        <div className="summary-strip" aria-label="Alert summary">
          {summary.map((item) => (
            <div key={item.label}>
              <span className="meta-label">{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="feature-grid">
        <article className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">QUEUE</p>
              <h3>Action list</h3>
            </div>
          </div>

          <div className="goal-list compact-list">
            {alerts.map((alert) => (
              <div className="goal-item" key={alert.id}>
                <div className="goal-topline">
                  <strong>{alert.title}</strong>
                  <span
                    className={`pill ${
                      alert.severity === "High"
                        ? "neutral"
                        : alert.severity === "Medium"
                          ? "success"
                          : "neutral"
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <div className="goal-details">
                  <span>{alert.category}</span>
                  <span>{alert.owner}</span>
                </div>
                <p className="alert-description">{alert.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <aside className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">PRIORITY</p>
              <h3>Focus order</h3>
            </div>
          </div>

          <ul className="activity-list">
            <li>
              <span>1. Resolve overdue funding gap in emergency fund.</span>
            </li>
            <li>
              <span>
                2. Confirm family health renewal and premium approval.
              </span>
            </li>
            <li>
              <span>3. Review spending variance before next close cycle.</span>
            </li>
            <li>
              <span>
                4. Finalize legal nominee validation and archive evidence.
              </span>
            </li>
          </ul>
        </aside>
      </section>
    </main>
  );
}
