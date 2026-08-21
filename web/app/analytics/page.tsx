"use client";

import { ProtectedLayout } from "../protected-layout";

const trendData = [
  { month: "Jan", value: 38 },
  { month: "Feb", value: 42 },
  { month: "Mar", value: 47 },
  { month: "Apr", value: 51 },
  { month: "May", value: 58 },
  { month: "Jun", value: 63 },
  { month: "Jul", value: 61 },
];

const observations = [
  {
    label: "Savings rate",
    value: "31%",
    note: "Healthy retention for the last 90 days.",
  },
  {
    label: "Expense trend",
    value: "-8%",
    note: "Spending is lower than the previous quarter.",
  },
  {
    label: "Cash runway",
    value: "9.4 mo",
    note: "Operational cushion remains adequate.",
  },
  {
    label: "Goal confidence",
    value: "High",
    note: "Most priorities remain on track or near target.",
  },
];

const insights = [
  {
    title: "Portfolio resilience",
    text: "Your diversified mix limits volatility while keeping long-term growth exposure intact.",
  },
  {
    title: "Non-advisory observation",
    text: "The data supports stronger cash reserves, not a direct buy or sell recommendation.",
  },
  {
    title: "Risk posture",
    text: "Emergency liquidity remains stable and insurance coverage is adequate for the current plan.",
  },
];

export default function AnalyticsPage() {
  const maxValue = Math.max(...trendData.map((point) => point.value));

  return (
    <ProtectedLayout>
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
            <a href="/analytics">Analytics</a>
          </nav>
        </header>

        <section className="feature-header panel">
          <div>
            <p className="eyebrow accent">ANALYTICS</p>
            <h2>
              Track patterns, portfolio health, and transparent planning
              signals.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Analytics summary">
            <div>
              <span className="meta-label">Quarter trend</span>
              <strong>+21%</strong>
            </div>
            <div>
              <span className="meta-label">Confidence</span>
              <strong>High</strong>
            </div>
            <div>
              <span className="meta-label">Advisory mode</span>
              <strong>Informational</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">TREND</p>
                <h3>Performance pattern</h3>
              </div>
            </div>

            <div className="bar-chart" aria-label="Savings trend chart">
              {trendData.map((point) => (
                <div className="bar-column" key={point.month}>
                  <span
                    className="bar-fill"
                    style={{ height: `${(point.value / maxValue) * 100}%` }}
                    title={`${point.month}: ${point.value}%`}
                  />
                  <small>{point.month}</small>
                </div>
              ))}
            </div>
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">OBSERVATIONS</p>
                <h3>Current signals</h3>
              </div>
            </div>

            <div className="insight-grid single-column">
              {observations.map((item) => (
                <div className="insight-box" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                  <small>{item.note}</small>
                </div>
              ))}
            </div>
          </aside>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">INSIGHTS</p>
              <h3>Explainable summaries</h3>
            </div>
          </div>

          <div className="insight-grid three-up">
            {insights.map((item) => (
              <div className="insight-box" key={item.title}>
                <span>{item.title}</span>
                <small>{item.text}</small>
              </div>
            ))}
          </div>
        </section>
      </main>
    </ProtectedLayout>
  );
}
