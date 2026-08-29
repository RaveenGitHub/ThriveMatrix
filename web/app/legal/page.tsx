"use client";

import Link from "next/link";
import { useAuth } from "../auth-context";
import { ProtectedLayout } from "../protected-layout";

const legalStats = [
  {
    title: "Document coverage",
    value: "86%",
    detail: "The legal records set is mostly current and easy to retrieve.",
  },
  {
    title: "Nominee clarity",
    value: "Strong",
    detail:
      "Beneficiary and nominee information remains sufficiently clear for review.",
  },
  {
    title: "Emergency access",
    value: "Ready",
    detail:
      "Primary and backup contacts are identified for sensitive document access.",
  },
  {
    title: "Retention health",
    value: "Managed",
    detail:
      "Storage and review cadence remain aligned with the current control model.",
  },
];

const actions = [
  "Review current legal records and align them with the latest family or nominee changes.",
  "Confirm legal access permissions for trusted contacts and backup decision-makers.",
  "Check whether any policy or estate documents need a second review before renewal cycles.",
  "Set a recurring legal document review cadence to keep sensitive records current.",
];

export default function LegalPage() {
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
            <p className="eyebrow accent">LEGAL</p>
            <h2>
              Keep key records, nominee clarity, and emergency access aligned
              with your long-term protection plan.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Legal summary">
            <div>
              <span className="meta-label">Status</span>
              <strong>Prepared</strong>
            </div>
            <div>
              <span className="meta-label">Access</span>
              <strong>Controlled</strong>
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
                <h3>Legal health</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {legalStats.map((item) => (
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
                <h3>Next decisions</h3>
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
