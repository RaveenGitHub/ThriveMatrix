"use client";

import { ProtectedLayout } from "../protected-layout";

const homeStats = [
  {
    title: "Home readiness",
    value: "67%",
    detail:
      "The current plan is progressing with manageable near-term trade-offs.",
  },
  {
    title: "Target value",
    value: "₹42L",
    detail:
      "The purchase target remains in line with the current financing view.",
  },
  {
    title: "Savings pace",
    value: "₹22K",
    detail: "The deposit pace remains consistent and supportable.",
  },
  {
    title: "Risk buffer",
    value: "Moderate",
    detail:
      "The cushion is acceptable, but extra flexibility would improve confidence.",
  },
];

const actions = [
  "Review the down-payment timeline against the current savings cadence.",
  "Check financing assumptions and loan terms before moving to a purchase decision.",
  "Reassess renovation and moving costs to avoid underestimating hidden expenses.",
  "Keep contingency reserve available for a more resilient purchase plan.",
];

export default function HomePage() {
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
            <a href="/home">Home</a>
          </nav>
        </header>

        <section className="feature-header panel">
          <div>
            <p className="eyebrow accent">HOME</p>
            <h2>
              Keep housing plans aligned with affordability, timing, and risk
              tolerance.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Home summary">
            <div>
              <span className="meta-label">Purchase pace</span>
              <strong>Healthy</strong>
            </div>
            <div>
              <span className="meta-label">Affordability</span>
              <strong>Managed</strong>
            </div>
            <div>
              <span className="meta-label">Priority</span>
              <strong>Medium</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">READINESS</p>
                <h3>Home purchase status</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {homeStats.map((item) => (
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
                <h3>Next moves</h3>
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
    </ProtectedLayout>
  );
}
