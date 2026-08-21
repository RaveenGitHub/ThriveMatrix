"use client";

import { ProtectedLayout } from "../protected-layout";

const readinessChecks = [
  { id: "G1", label: "Architecture", state: "Approved" },
  { id: "G2", label: "Security foundation", state: "Approved" },
  { id: "G3", label: "Domain validation", state: "Approved" },
  { id: "G4", label: "Dashboard readiness", state: "Review" },
  { id: "G5", label: "Release governance", state: "Review" },
];

const runbook = [
  "Verify backup health and restore checkpoints.",
  "Check data export accessibility and account-deletion review path.",
  "Review pending alerts and trigger-specific mitigation workflows.",
  "Confirm security and privacy review sign-offs are recorded.",
];

export default function OperationsPage() {
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
            <a href="/operations">Operations</a>
          </nav>
        </header>

        <section className="feature-header panel">
          <div>
            <p className="eyebrow accent">OPERATIONS</p>
            <h2>
              Track platform health, release readiness, and owner action loops.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Operations summary">
            <div>
              <span className="meta-label">System status</span>
              <strong>Stable</strong>
            </div>
            <div>
              <span className="meta-label">Open reviews</span>
              <strong>2</strong>
            </div>
            <div>
              <span className="meta-label">Runbook</span>
              <strong>Ready</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">GOVERNANCE</p>
                <h3>Launch checklist</h3>
              </div>
            </div>

            <div className="governance-list">
              {readinessChecks.map((item) => (
                <div className="governance-item" key={item.id}>
                  <span>{item.id}</span>
                  <strong>{item.label}</strong>
                  <span
                    className={`pill ${item.state === "Approved" ? "success" : "neutral"}`}
                  >
                    {item.state}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">RUNBOOK</p>
                <h3>Release actions</h3>
              </div>
            </div>

            <ul className="activity-list">
              {runbook.map((step) => (
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
