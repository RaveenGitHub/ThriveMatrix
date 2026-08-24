"use client";

import Link from "next/link";
import { useAuth } from "../auth-context";
import { ProtectedLayout } from "../protected-layout";

const emergencyStats = [
  {
    title: "Preparedness score",
    value: "79%",
    detail: "The current emergency plan is mostly complete and actionable.",
  },
  {
    title: "Primary contacts",
    value: "5 people",
    detail: "The most important support network is mapped and reachable.",
  },
  {
    title: "Care access",
    value: "Secure",
    detail: "Key contacts can be reached quickly without delay or confusion.",
  },
  {
    title: "Fallback plan",
    value: "Ready",
    detail: "There is a sensible backup path for disruption or urgent events.",
  },
];

const actions = [
  "Confirm the emergency contact hierarchy and check whether access remains up to date.",
  "Review the medical and legal information that would matter most in an urgent scenario.",
  "Validate the availability of funds, documents, and communication channels in a crisis.",
  "Set a periodic check-in so emergency readiness remains current and usable.",
];

export default function EmergencyPage() {
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
            <p className="eyebrow accent">EMERGENCY</p>
            <h2>
              Prepare your network, access points, and fallback steps for the
              moments that matter most.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Emergency summary">
            <div>
              <span className="meta-label">Status</span>
              <strong>Prepared</strong>
            </div>
            <div>
              <span className="meta-label">Contact chain</span>
              <strong>Valid</strong>
            </div>
            <div>
              <span className="meta-label">Priority</span>
              <strong>Critical</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">READINESS</p>
                <h3>Emergency health</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {emergencyStats.map((item) => (
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
                <h3>Next steps</h3>
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
