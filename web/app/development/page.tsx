"use client";

import Link from "next/link";
import { useAuth } from "../auth-context";
import { ProtectedLayout } from "../protected-layout";

const developmentStats = [
  {
    title: "Skill momentum",
    value: "79%",
    detail:
      "Current learning effort is steady and aligned with long-term growth goals.",
  },
  {
    title: "Focus stack",
    value: "3 tracks",
    detail:
      "The active development plan has a manageable set of high-value priorities.",
  },
  {
    title: "Consistency",
    value: "Strong",
    detail:
      "Learning time and practice cadence remain regular enough to sustain momentum.",
  },
  {
    title: "Direction fit",
    value: "Healthy",
    detail:
      "Current skill-building efforts remain aligned with role, income, and life goals.",
  },
];

const actions = [
  "Review the current learning track and decide which skill is most important for the next planning cycle.",
  "Confirm whether effort is balanced across strategic growth, daily capability, and practical application.",
  "Set a recurring review to reflect on learning quality, time spent, and visible outcomes.",
  "Keep a lightweight knowledge backlog so new ideas can be captured without crowding the plan.",
];

export default function DevelopmentPage() {
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
              <p className="eyebrow">PRIVATE BETA / THRIVEMATRIX</p>
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
            <p className="eyebrow accent">DEVELOPMENT</p>
            <h2>
              Keep learning, capability growth, and personal skill-building
              aligned with the life and career plan you want to sustain.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Development summary">
            <div>
              <span className="meta-label">Growth</span>
              <strong>Active</strong>
            </div>
            <div>
              <span className="meta-label">Momentum</span>
              <strong>Positive</strong>
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
                <h3>Development health</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {developmentStats.map((item) => (
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
      </main>
    </ProtectedLayout>
  );
}
