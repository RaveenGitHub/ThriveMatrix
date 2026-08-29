"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ravApiFetch } from "../../lib/api";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

type AlertRecord = {
  type: string;
  title: string;
  message: string;
  severity: string;
};

export default function AlertsPage() {
  const { isAdmin, logout } = useRavAuth();
  const [alerts, setAlerts] = useState<AlertRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAlerts = async () => {
      try {
        setLoading(true);
        const response = await ravApiFetch<{ alerts: AlertRecord[] }>(
          "/api/v1/alerts",
        );
        setAlerts(response.alerts ?? []);
        setError("");
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load alerts",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadAlerts();
  }, []);

  const summary = useMemo(() => {
    const open = alerts.length;
    const high = alerts.filter((alert) => alert.severity === "high").length;
    const medium = alerts.filter((alert) => alert.severity === "medium").length;

    return [
      { label: "Open alerts", value: String(open) },
      { label: "High priority", value: String(high) },
      { label: "Medium priority", value: String(medium) },
      { label: "Resolved", value: "0" },
    ];
  }, [alerts]);

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
            <p className="eyebrow accent">ALERTS</p>
            <h2>
              Monitor the issues that need attention across goals and life
              plans.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Alert summary">
            {summary.map((item) => (
              <div key={item.label}>
                <span className="meta-label">{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        {error ? (
          <section className="panel" style={{ marginBottom: 24 }}>
            <p style={{ color: "#b42318" }}>{error}</p>
          </section>
        ) : null}

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">QUEUE</p>
                <h3>Action list</h3>
              </div>
            </div>

            <div className="goal-list compact-list">
              {loading ? (
                <div className="goal-item">Loading alerts…</div>
              ) : alerts.length === 0 ? (
                <div className="goal-item">No active alerts right now.</div>
              ) : (
                alerts.map((alert, index) => (
                  <div className="goal-item" key={`${alert.title}-${index}`}>
                    <div className="goal-topline">
                      <strong>{alert.title}</strong>
                      <span
                        className={`pill ${alert.severity === "high" ? "neutral" : "success"}`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <div className="goal-details">
                      <span>{alert.type}</span>
                      <span>{alert.message}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">PRIORITY</p>
                <h3>Focus order</h3>
              </div>
            </div>

            <ul className="activity-list">
              {alerts.length === 0 ? (
                <li>
                  <span>No high-priority tasks are currently open.</span>
                </li>
              ) : (
                alerts.slice(0, 4).map((alert, index) => (
                  <li key={`${alert.title}-focus-${index}`}>
                    <span>
                      {index + 1}. {alert.message}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </aside>
        </section>
      </main>
    </RavProtectedLayout>
  );
}
