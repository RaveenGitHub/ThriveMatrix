"use client";

import Link from "next/link";
import { useAuth } from "../auth-context";
import { ProtectedLayout } from "../protected-layout";

const legacyStats = [
  {
    title: "Legacy clarity",
    value: "76%",
    detail:
      "The current structure for values, wishes, and decision support is mostly clear.",
  },
  {
    title: "Decision map",
    value: "Defined",
    detail: "Core decision-makers and support roles are already identified.",
  },
  {
    title: "Transfer readiness",
    value: "Stable",
    detail:
      "The foundation is in place without any urgent gaps in the current plan.",
  },
  {
    title: "Review cadence",
    value: "Quarterly",
    detail:
      "A recurring check-in is enough to keep the plan crisp and aligned.",
  },
];

const actions = [
  "Review who should make decisions during a major life event or long-term planning scenario.",
  "Check whether the current asset and document naming structure still matches your intentions.",
  "Confirm any family values or stewardship preferences that should guide future planning.",
  "Set a light quarterly review cycle to keep the legacy plan current and usable.",
];

export default function LegacyPage() {
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
            <p className="eyebrow accent">LEGACY</p>
            <h2>
              Keep your long-term intent, decision path, and stewardship
              framework clear and actionable.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Legacy summary">
            <div>
              <span className="meta-label">Intent</span>
              <strong>Clear</strong>
            </div>
            <div>
              <span className="meta-label">Decision flow</span>
              <strong>Mapped</strong>
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
                <h3>Legacy management</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {legacyStats.map((item) => (
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
