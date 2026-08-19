const navItems = [
  "Overview",
  "Goals",
  "Portfolio",
  "Transactions",
  "Insurance",
  "Life domains",
  "Privacy",
  "Governance",
];

const metrics = [
  {
    label: "Financial security",
    value: "₹9.4L",
    detail: "Net balance across goals and assets",
  },
  {
    label: "Portfolio value",
    value: "₹24.2L",
    detail: "Investments tracked across 8 positions",
  },
  {
    label: "Goal progress",
    value: "71%",
    detail: "Three goals are on track this cycle",
  },
  {
    label: "Coverage score",
    value: "82/100",
    detail: "Risk protection is mostly covered",
  },
];

const goals = [
  {
    name: "Emergency Fund",
    target: "₹4,00,000",
    current: "₹3,12,000",
    progress: 78,
    status: "On track",
  },
  {
    name: "Home Purchase",
    target: "₹18,00,000",
    current: "₹9,60,000",
    progress: 53,
    status: "Active",
  },
  {
    name: "Child Education",
    target: "₹12,00,000",
    current: "₹8,40,000",
    progress: 70,
    status: "Watchlist",
  },
];

const investmentRows = [
  {
    name: "Nifty Index Fund",
    allocation: "32%",
    value: "₹7.8L",
    change: "+5.4%",
  },
  { name: "PPF", allocation: "22%", value: "₹5.3L", change: "+3.1%" },
  { name: "Gold ETF", allocation: "16%", value: "₹3.9L", change: "+2.7%" },
  { name: "Fixed Deposit", allocation: "18%", value: "₹4.4L", change: "+3.8%" },
];

const alerts = [
  {
    type: "goal_overdue",
    title: "Emergency Fund",
    detail: "Target date passed by 14 days — review plan",
  },
  {
    type: "policy_expiring",
    title: "Family Health Policy",
    detail: "Renews in 11 days — confirm coverage",
  },
  {
    type: "budget_alert",
    title: "Expense spike",
    detail: "Food and travel exceeded target by 12%",
  },
];

const domains = [
  { name: "Health", value: "4 records", status: "Ready" },
  { name: "Legal", value: "2 contacts", status: "Ready" },
  { name: "Relationships", value: "6 records", status: "Ready" },
  { name: "Readiness", value: "5 items", status: "Ready" },
];

const insights = [
  { label: "Savings rate", value: "31%", note: "Healthy monthly retention" },
  { label: "Expense trend", value: "-8%", note: "Lower than last quarter" },
  {
    label: "Cash runway",
    value: "9.4 mo",
    note: "Based on recurring monthly outflow",
  },
  {
    label: "Policy coverage",
    value: "82/100",
    note: "Strong but can improve on disability",
  },
];

const privacy = [
  { name: "Marketing consent", state: "Off" },
  { name: "Analytics consent", state: "On" },
  { name: "Data export", state: "Allowed" },
  { name: "Deletion review", state: "Required" },
];

const governance = [
  { id: "G1", label: "Architecture", state: "Approved" },
  { id: "G2", label: "Secure foundation", state: "Approved" },
  { id: "G3", label: "Domain correctness", state: "Approved" },
  { id: "G4", label: "Dashboard readiness", state: "Pending" },
  { id: "G5", label: "Release review", state: "Pending" },
];

export default function Home() {
  return (
    <main className="page-shell">
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
          {navItems.map((item) => (
            <a href="#" key={item}>
              {item}
            </a>
          ))}
        </nav>

        <button className="primary-btn" type="button">
          + Add record
        </button>
      </header>

      <section className="hero panel">
        <div>
          <p className="eyebrow accent">YOUR LIFE CAPITAL MAP</p>
          <h2>
            Build wealth, security, and life readiness with one clear view.
          </h2>
        </div>

        <div className="hero-meta">
          <div>
            <span className="meta-label">Current status</span>
            <strong>Ready for review</strong>
          </div>
          <div>
            <span className="meta-label">Auth model</span>
            <strong>Ownership enforced</strong>
          </div>
          <div>
            <span className="meta-label">Financial rule</span>
            <strong>INR / USD manual FX</strong>
          </div>
        </div>
      </section>

      <section className="metric-grid" aria-label="Snapshot metrics">
        {metrics.map((metric) => (
          <article className="metric-card" key={metric.label}>
            <p className="metric-label">{metric.label}</p>
            <p className="metric-value">{metric.value}</p>
            <p className="metric-detail">{metric.detail}</p>
          </article>
        ))}
      </section>

      <section className="content-grid">
        <article className="panel panel-span-2">
          <div className="section-head">
            <div>
              <p className="eyebrow">GOALS</p>
              <h3>Target progress</h3>
            </div>
            <button className="ghost-btn" type="button">
              Manage goals
            </button>
          </div>

          <div className="goal-list">
            {goals.map((goal) => (
              <div className="goal-item" key={goal.name}>
                <div className="goal-topline">
                  <strong>{goal.name}</strong>
                  <span className="pill success">{goal.status}</span>
                </div>
                <div className="goal-details">
                  <span>{goal.current}</span>
                  <span>of {goal.target}</span>
                </div>
                <div
                  className="progress-track"
                  aria-label={`${goal.name} progress`}
                >
                  <span style={{ width: `${goal.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </article>

        <aside className="panel">
          <div className="section-head compact">
            <div>
              <p className="eyebrow">ALERTS</p>
              <h3>Action queue</h3>
            </div>
          </div>

          <div className="alert-list">
            {alerts.map((alert) => (
              <div className="alert-item" key={`${alert.title}-${alert.type}`}>
                <span
                  className={`alert-dot ${alert.type}`}
                  aria-hidden="true"
                />
                <div>
                  <strong>{alert.title}</strong>
                  <p>{alert.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">PORTFOLIO</p>
              <h3>Portfolio allocation</h3>
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Allocation</th>
                  <th>Value</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {investmentRows.map((row) => (
                  <tr key={row.name}>
                    <td>{row.name}</td>
                    <td>{row.allocation}</td>
                    <td>{row.value}</td>
                    <td className="positive">{row.change}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <article className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">INSURANCE</p>
              <h3>Coverage overview</h3>
            </div>
          </div>

          <div className="insurance-card">
            <div className="ring" aria-label="Coverage score 82 percent">
              <span>82%</span>
            </div>
            <ul>
              <li>
                <strong>Health</strong>
                <span>₹22L cover</span>
              </li>
              <li>
                <strong>Life</strong>
                <span>₹1Cr cover</span>
              </li>
              <li>
                <strong>Critical illness</strong>
                <span>₹50L cover</span>
              </li>
            </ul>
          </div>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">ANALYTICS</p>
              <h3>Non-advisory insights</h3>
            </div>
          </div>

          <div className="insight-grid">
            {insights.map((insight) => (
              <div className="insight-box" key={insight.label}>
                <span>{insight.label}</span>
                <strong>{insight.value}</strong>
                <small>{insight.note}</small>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">PRIVACY</p>
              <h3>Consent & controls</h3>
            </div>
          </div>

          <div className="privacy-list">
            {privacy.map((item) => (
              <div className="privacy-row" key={item.name}>
                <span>{item.name}</span>
                <span className="pill neutral">{item.state}</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="panel">
        <div className="section-head">
          <div>
            <p className="eyebrow">LIFE DOMAINS</p>
            <h3>Health, legal, relationships, and readiness</h3>
          </div>
        </div>

        <div className="domain-grid">
          {domains.map((domain) => (
            <div className="domain-card" key={domain.name}>
              <span className="domain-name">{domain.name}</span>
              <strong>{domain.value}</strong>
              <span className="pill neutral">{domain.status}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="content-grid bottom-grid">
        <article className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">OPERATIONS</p>
              <h3>Launch readiness</h3>
            </div>
          </div>

          <div className="governance-list">
            {governance.map((item) => (
              <div className="governance-item" key={item.id}>
                <span>{item.id}</span>
                <strong>{item.label}</strong>
                <span
                  className={`pill ${item.state === "Approved" ? "success" : "neutral"}`}
                >
                  {item.state}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">TRANSACTIONS</p>
              <h3>Recent activity</h3>
            </div>
          </div>

          <ul className="activity-list">
            <li>
              <span>Salary credit</span>
              <strong>₹72,000</strong>
            </li>
            <li>
              <span>Rent payment</span>
              <strong>-₹28,000</strong>
            </li>
            <li>
              <span>Investment top-up</span>
              <strong>-₹12,500</strong>
            </li>
            <li>
              <span>Insurance premium</span>
              <strong>-₹6,200</strong>
            </li>
          </ul>
        </article>
      </section>
    </main>
  );
}
