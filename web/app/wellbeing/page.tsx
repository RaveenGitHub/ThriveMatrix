"use client";

import Link from "next/link";
import { useAuth } from "../auth-context";
import { ProtectedLayout } from "../protected-layout";

const wellbeingStats = [
  {
    title: "Resilience score",
    value: "82%",
    detail:
      "Your current resilience is strong enough to absorb moderate stress without disruption.",
  },
  {
    title: "Recovery rhythm",
    value: "Healthy",
    detail:
      "Recovery patterns remain supportive and consistent with daily demands.",
  },
  {
    title: "Stress load",
    value: "Moderate",
    detail:
      "Stress is manageable, but a steady review still matters for sustainability.",
  },
  {
    title: "Balance posture",
    value: "Stable",
    detail:
      "Work, rest, and personal responsibilities are mostly aligned with your capacity.",
  },
];

const actions = [
  "Review the balance between work output, recover time, and personal obligations over the next cycle.",
  "Check whether stress triggers are recurring and whether small changes could reduce friction.",
  "Set a simple ritual for rest, recovery, and reflection so resilience stays sustainable.",
  "Keep one small support mechanism in place for difficult weeks or unexpected changes.",
];

export default function WellbeingPage() {
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
            <p className="eyebrow accent">WELLBEING</p>
            <h2>
              Track resilience, recovery, and sustainable energy so life
              planning remains realistic and supportive.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Wellbeing summary">
            <div>
              <span className="meta-label">Status</span>
              <strong>Stable</strong>
            </div>
            <div>
              <span className="meta-label">Resilience</span>
              <strong>Strong</strong>
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
                <h3>Wellbeing health</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {wellbeingStats.map((item) => (
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
