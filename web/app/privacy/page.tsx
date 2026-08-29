"use client";

import Link from "next/link";
import { useState } from "react";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

const consentDefaults = {
  analytics: true,
  marketing: false,
  export: true,
  deletionReview: true,
};

const privacyActions = [
  "Export personal data package for review.",
  "Confirm data retention and deletion review window.",
  "Review consent history and access log entries.",
  "Check third-party data sharing and edge-case handling.",
];

export default function PrivacyPage() {
  const { isAdmin, logout } = useRavAuth();
  const [consent, setConsent] = useState(consentDefaults);

  const toggle = (key: keyof typeof consentDefaults) => {
    setConsent((current) => ({ ...current, [key]: !current[key] }));
  };

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
            <p className="eyebrow accent">PRIVACY</p>
            <h2>
              Protect sensitive life and financial records with clear controls.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Privacy summary">
            <div>
              <span className="meta-label">Consent state</span>
              <strong>Updated</strong>
            </div>
            <div>
              <span className="meta-label">Retention</span>
              <strong>Review</strong>
            </div>
            <div>
              <span className="meta-label">Data access</span>
              <strong>Owner scoped</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">CONSENT</p>
                <h3>Preferences</h3>
              </div>
            </div>

            <div className="goal-list">
              <div className="goal-item">
                <div className="goal-topline">
                  <strong>Analytics consent</strong>
                  <span
                    className={`pill ${consent.analytics ? "success" : "neutral"}`}
                  >
                    {consent.analytics ? "On" : "Off"}
                  </span>
                </div>
                <div className="goal-details">
                  <span>Usage signals for product improvement.</span>
                </div>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => toggle("analytics")}
                >
                  {consent.analytics ? "Disable" : "Enable"}
                </button>
              </div>

              <div className="goal-item">
                <div className="goal-topline">
                  <strong>Marketing consent</strong>
                  <span
                    className={`pill ${consent.marketing ? "success" : "neutral"}`}
                  >
                    {consent.marketing ? "On" : "Off"}
                  </span>
                </div>
                <div className="goal-details">
                  <span>Promotional updates and lifecycle notifications.</span>
                </div>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => toggle("marketing")}
                >
                  {consent.marketing ? "Disable" : "Enable"}
                </button>
              </div>

              <div className="goal-item">
                <div className="goal-topline">
                  <strong>Data export</strong>
                  <span
                    className={`pill ${consent.export ? "success" : "neutral"}`}
                  >
                    {consent.export ? "Allowed" : "Blocked"}
                  </span>
                </div>
                <div className="goal-details">
                  <span>
                    Allow exporting a copy of your personal data package.
                  </span>
                </div>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => toggle("export")}
                >
                  {consent.export ? "Turn off" : "Turn on"}
                </button>
              </div>

              <div className="goal-item">
                <div className="goal-topline">
                  <strong>Deletion review</strong>
                  <span
                    className={`pill ${consent.deletionReview ? "success" : "neutral"}`}
                  >
                    {consent.deletionReview ? "Required" : "Skipped"}
                  </span>
                </div>
                <div className="goal-details">
                  <span>
                    Confirm a review step before permanent account deletion.
                  </span>
                </div>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => toggle("deletionReview")}
                >
                  {consent.deletionReview ? "Adjust" : "Enable review"}
                </button>
              </div>
            </div>
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">CONTROL CENTER</p>
                <h3>Data actions</h3>
              </div>
            </div>

            <ul className="activity-list">
              {privacyActions.map((step) => (
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
