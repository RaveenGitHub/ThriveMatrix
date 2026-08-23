"use client";

import Link from "next/link";
import { useAuth } from "../auth-context";
import { ProtectedLayout } from "../protected-layout";

const educationStats = [
  {
    title: "Education readiness",
    value: "72%",
    detail: "The current funding path remains on a stable upward curve.",
  },
  {
    title: "Target corpus",
    value: "₹24L",
    detail:
      "The plan remains aligned to expected academic horizon and cost assumptions.",
  },
  {
    title: "Monthly allocation",
    value: "₹16K",
    detail:
      "Contribution pace remains strong and consistent with the current path.",
  },
  {
    title: "Risk buffer",
    value: "Healthy",
    detail:
      "Funding resilience remains adequate for strategy shifts or delays.",
  },
];

const actions = [
  "Validate education cost assumptions against inflation and location changes.",
  "Review whether the funding schedule still reflects the target priority level.",
  "Check if there are any deferrals or alternative study paths that should be tracked.",
  "Adjust the contribution pattern if external commitments are likely to shift.",
];

export default function EducationPage() {
  const { isAdmin, logout } = useAuth();

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
            <Link href="/home">Overview</Link>
            <Link href="/goals">Goals</Link>
            <Link href="/portfolio">Portfolio</Link>
            <Link href="/transactions">Transactions</Link>
            <Link href="/insurance">Insurance</Link>
            <Link href="/domains">Life domains</Link>
            <Link href="/privacy">Privacy</Link>
            {isAdmin ? <Link href="/governance">Governance</Link> : null}
          </nav>

          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button className="primary-btn" type="button">
              + Add record
            </button>
            <button
              type="button"
              className="ghost-btn"
              onClick={() => void logout()}
            >
              Log out
            </button>
          </div>
        </header>

        <section className="feature-header panel">
          <div>
            <p className="eyebrow accent">EDUCATION</p>
            <h2>
              Track funding momentum, cost readiness, and future-study
              flexibility.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Education summary">
            <div>
              <span className="meta-label">Momentum</span>
              <strong>Steady</strong>
            </div>
            <div>
              <span className="meta-label">Funding</span>
              <strong>Planned</strong>
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
                <h3>Education fuel</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {educationStats.map((item) => (
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
                <h3>Focus queue</h3>
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
