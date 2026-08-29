"use client";

import Link from "next/link";
import { useState } from "react";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

const preferencesDefaults = {
  reminders: true,
  biometric: true,
  reportDigest: false,
  marketAlerts: true,
};

const profileStats = [
  { label: "Member since", value: "2024" },
  { label: "Active plans", value: "8" },
  { label: "Risk profile", value: "Moderate" },
  { label: "Next review", value: "Sep 2026" },
];

const accountTiles = [
  "Personal data privacy controls are active.",
  "Access tokens are limited to owner-scoped sessions.",
  "Primary review window is aligned to the ThriveMatrix planning cycle.",
  "Two-step verification remains available for sensitive actions.",
];

export default function ProfilePage() {
  const { isAdmin, logout } = useRavAuth();
  const [preferences, setPreferences] = useState(preferencesDefaults);

  const toggle = (key: keyof typeof preferencesDefaults) => {
    setPreferences((current) => ({ ...current, [key]: !current[key] }));
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
            <p className="eyebrow accent">PROFILE</p>
            <h2>
              Manage account details, preferences, and personal planning
              controls.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Profile summary">
            <div>
              <span className="meta-label">Access</span>
              <strong>Verified</strong>
            </div>
            <div>
              <span className="meta-label">Security</span>
              <strong>Strong</strong>
            </div>
            <div>
              <span className="meta-label">Status</span>
              <strong>Active</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">ACCOUNT</p>
                <h3>Identity snapshot</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {profileStats.map((item) => (
                <div className="insight-box" key={item.label}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="goal-list compact-list" style={{ marginTop: 18 }}>
              <div className="goal-item">
                <div className="goal-topline">
                  <strong>Primary email</strong>
                  <span className="pill success">Verified</span>
                </div>
                <div className="goal-details">
                  <span>raveen@example.com</span>
                  <span>Primary account contact</span>
                </div>
              </div>
              <div className="goal-item">
                <div className="goal-topline">
                  <strong>Preferred timezone</strong>
                  <span className="pill neutral">Asia/Kolkata</span>
                </div>
                <div className="goal-details">
                  <span>Local fiscal and reminder settings</span>
                  <span>UTC stored, display local</span>
                </div>
              </div>
            </div>
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">PREFERENCES</p>
                <h3>Alerts and access</h3>
              </div>
            </div>

            <div className="goal-list">
              <div className="goal-item">
                <div className="goal-topline">
                  <strong>Reminders</strong>
                  <span
                    className={`pill ${preferences.reminders ? "success" : "neutral"}`}
                  >
                    {preferences.reminders ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => toggle("reminders")}
                >
                  {preferences.reminders ? "Pause" : "Enable"}
                </button>
              </div>

              <div className="goal-item">
                <div className="goal-topline">
                  <strong>Biometric sign-in</strong>
                  <span
                    className={`pill ${preferences.biometric ? "success" : "neutral"}`}
                  >
                    {preferences.biometric ? "On" : "Off"}
                  </span>
                </div>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => toggle("biometric")}
                >
                  {preferences.biometric ? "Disable" : "Enable"}
                </button>
              </div>

              <div className="goal-item">
                <div className="goal-topline">
                  <strong>Weekly report digest</strong>
                  <span
                    className={`pill ${preferences.reportDigest ? "success" : "neutral"}`}
                  >
                    {preferences.reportDigest ? "On" : "Off"}
                  </span>
                </div>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => toggle("reportDigest")}
                >
                  {preferences.reportDigest ? "Mute" : "Enable"}
                </button>
              </div>

              <div className="goal-item">
                <div className="goal-topline">
                  <strong>Market alerts</strong>
                  <span
                    className={`pill ${preferences.marketAlerts ? "success" : "neutral"}`}
                  >
                    {preferences.marketAlerts ? "On" : "Off"}
                  </span>
                </div>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => toggle("marketAlerts")}
                >
                  {preferences.marketAlerts ? "Turn off" : "Turn on"}
                </button>
              </div>
            </div>
          </aside>
        </section>

        <section className="panel bottom-grid">
          <div className="section-head">
            <div>
              <p className="eyebrow">ACCOUNT HEALTH</p>
              <h3>Operational notes</h3>
            </div>
          </div>

          <ul className="activity-list">
            {accountTiles.map((item) => (
              <li key={item}>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </RavProtectedLayout>
  );
}
