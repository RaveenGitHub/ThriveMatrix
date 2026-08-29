"use client";

import Link from "next/link";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

const foundationStats = [
  {
    title: "Runtime baseline",
    value: "Ready",
    detail:
      "The local stack is documented and aligned to the approved Python and Node runtime constraints.",
  },
  {
    title: "Delivery controls",
    value: "Active",
    detail:
      "Build, lint, and validation paths are part of the working delivery process.",
  },
  {
    title: "Contract quality",
    value: "Versioned",
    detail:
      "API behavior and configuration rules remain explicit and testable across stages.",
  },
  {
    title: "Security baseline",
    value: "Approved",
    detail:
      "Core policy guardrails and redaction patterns are in place before deeper feature work proceeds.",
  },
];

const actions = [
  "Keep the local runtime documentation synchronized with the actual CI and workstation setup.",
  "Validate every new stage against the existing contract, configuration, and security guardrails.",
  "Treat environment drift as a release risk until the pinned toolchain is formally installed.",
  "Record every approval gate and evidence item before moving from one feature stage to the next.",
];

const controls = [
  { name: "Runtime contracts", status: "Stable" },
  { name: "CI validation", status: "Enabled" },
  { name: "Secrets handling", status: "Controlled" },
  { name: "Migrations", status: "Documented" },
  { name: "Operational readiness", status: "Tracked" },
];

export default function FoundationPage() {
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
            <p className="eyebrow accent">F-00</p>
            <h2>
              Platform foundation and delivery controls keep the product stable,
              testable, and ready for the next feature stage.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Foundation summary">
            <div>
              <span className="meta-label">State</span>
              <strong>Ready</strong>
            </div>
            <div>
              <span className="meta-label">Runtime</span>
              <strong>Local + CI</strong>
            </div>
            <div>
              <span className="meta-label">Gate</span>
              <strong>Approved</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">BASELINE</p>
                <h3>Foundation overview</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {foundationStats.map((item) => (
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
              <p className="eyebrow">CONTROLS</p>
              <h3>Delivery guardrails</h3>
            </div>
          </div>

          <div className="goal-list">
            {controls.map((control) => (
              <div className="goal-item" key={control.name}>
                <div className="goal-topline">
                  <strong>{control.name}</strong>
                  <span className="pill success">{control.status}</span>
                </div>
                <div className="goal-details">
                  <span>Control state</span>
                  <span>{control.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </RavProtectedLayout>
  );
}
