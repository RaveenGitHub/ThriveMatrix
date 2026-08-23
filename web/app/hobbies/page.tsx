"use client";

import Link from "next/link";
import { useAuth } from "../auth-context";
import { ProtectedLayout } from "../protected-layout";

const hobbiesStats = [
  {
    title: "Engagement score",
    value: "80%",
    detail:
      "The current activity mix remains fulfilling and supportive of energy and identity.",
  },
  {
    title: "Balance mix",
    value: "Healthy",
    detail:
      "Recreation and personal interests are distributed in a sustainable way.",
  },
  {
    title: "Interest depth",
    value: "4 areas",
    detail:
      "The plan includes a meaningful range of mental, physical, and creative outlets.",
  },
  {
    title: "Consistency",
    value: "Stable",
    detail:
      "Ongoing participation is regular enough to create momentum rather than friction.",
  },
];

const actions = [
  "Review which hobbies still feel energizing versus routine or draining.",
  "Use the current mix to support creativity, stress management, and broader life satisfaction.",
  "Protect time for personal interests even in heavier work or planning periods.",
  "Add a simple seasonal refresh so the activity mix stays interesting and aligned with current energy.",
];

export default function HobbiesPage() {
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
            <p className="eyebrow accent">HOBBIES</p>
            <h2>
              Keep recreation, creativity, and personal identity aligned with a
              happy and sustainable life rhythm.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Hobbies summary">
            <div>
              <span className="meta-label">Energy</span>
              <strong>Positive</strong>
            </div>
            <div>
              <span className="meta-label">Balance</span>
              <strong>Healthy</strong>
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
                <h3>Hobby portfolio</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {hobbiesStats.map((item) => (
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
