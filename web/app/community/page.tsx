"use client";

import Link from "next/link";
import { useAuth } from "../auth-context";
import { ProtectedLayout } from "../protected-layout";

const communityStats = [
  {
    title: "Support network",
    value: "9 people",
    detail:
      "Your close relationships and dependable contacts provide a healthy safety net.",
  },
  {
    title: "Belonging score",
    value: "86%",
    detail:
      "A meaningful sense of connection is present across work, personal life, and family circles.",
  },
  {
    title: "Shared momentum",
    value: "Strong",
    detail:
      "You are likely to benefit from deliberate community-building habits and recurring contact.",
  },
  {
    title: "Connection load",
    value: "Balanced",
    detail:
      "Relationships are active without becoming emotionally draining or unsustainable.",
  },
];

const actions = [
  "Keep a recurring rhythm of contact with the people who genuinely add steadiness and trust to your life.",
  "Review whether your social and professional circles still match the kind of support you want and need.",
  "Protect time for reciprocal generosity instead of treating relationships as something that can be postponed.",
  "Notice where belonging is weak and turn that into a small, concrete action rather than a vague intention.",
];

const circles = [
  { name: "Family", strength: "High" },
  { name: "Friends", strength: "Strong" },
  { name: "Work peers", strength: "Moderate" },
  { name: "Mentors", strength: "High" },
  { name: "Community groups", strength: "Growing" },
];

export default function CommunityPage() {
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
            <p className="eyebrow accent">COMMUNITY</p>
            <h2>
              Build a support network that holds you up without adding
              unnecessary friction or distance.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Community summary">
            <div>
              <span className="meta-label">Support</span>
              <strong>Healthy</strong>
            </div>
            <div>
              <span className="meta-label">Belonging</span>
              <strong>Strong</strong>
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
                <p className="eyebrow">NETWORK</p>
                <h3>Community overview</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {communityStats.map((item) => (
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

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">CIRCLES</p>
              <h3>Connection map</h3>
            </div>
          </div>

          <div className="goal-list">
            {circles.map((circle) => (
              <div className="goal-item" key={circle.name}>
                <div className="goal-topline">
                  <strong>{circle.name}</strong>
                  <span className="pill success">{circle.strength}</span>
                </div>
                <div className="goal-details">
                  <span>Current strength</span>
                  <span>{circle.strength}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </ProtectedLayout>
  );
}
