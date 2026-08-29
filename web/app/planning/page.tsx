"use client";

import Link from "next/link";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

const planningBlocks = [
  {
    title: "Quarter plan",
    value: "On track",
    detail: "Strategy and milestones remain aligned to the current lifecycle.",
  },
  {
    title: "Cash buffer",
    value: "₹4.8L",
    detail: "Emergency liquidity is healthy relative to runway demands.",
  },
  {
    title: "Milestone cadence",
    value: "8/10",
    detail: "Most key deadlines continue to stay in motion.",
  },
  {
    title: "Decision load",
    value: "Medium",
    detail: "Some actions need clearer prioritization to reduce friction.",
  },
];

const actions = [
  "Confirm next cash reserve target for the upcoming quarter.",
  "Finalize the milestone sequence for goal and investment actions.",
  "Review timelines for legal, insurance, and health follow-ups.",
  "Tighten the decision backlog to keep focus on the highest leverage items.",
];

export default function PlanningPage() {
  const { isAdmin, logout } = useRavAuth();

  return (
    <RavProtectedLayout>
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
            <p className="eyebrow accent">PLANNING</p>
            <h2>
              Coordinate cash, priorities, and delivery timing across life and
              wealth goals.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Planning summary">
            <div>
              <span className="meta-label">Focus</span>
              <strong>Clear</strong>
            </div>
            <div>
              <span className="meta-label">Timing</span>
              <strong>Stable</strong>
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
                <p className="eyebrow">ROADMAP</p>
                <h3>Current plan health</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {planningBlocks.map((item) => (
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
                <h3>Next planning moves</h3>
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
    </RavProtectedLayout>
  );
}
