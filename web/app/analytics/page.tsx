"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../auth-context";
import { ProtectedLayout } from "../protected-layout";

const trendData = [
  { month: "Jan", value: 38 },
  { month: "Feb", value: 42 },
  { month: "Mar", value: 47 },
  { month: "Apr", value: 51 },
  { month: "May", value: 58 },
  { month: "Jun", value: 63 },
  { month: "Jul", value: 61 },
];

type InsightItem = {
  type: string;
  label: string;
  rationale: string;
  source: string;
  advice: boolean;
};

export default function AnalyticsPage() {
  const { isAdmin, logout } = useAuth();
  const [insights, setInsights] = useState<InsightItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadInsights = async () => {
      try {
        setLoading(true);
        const response = await apiFetch<{ insights: InsightItem[] }>(
          "/api/v1/analytics/insights",
        );
        setInsights(response.insights ?? []);
        setError("");
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load analytics",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadInsights();
  }, []);

  const maxValue = Math.max(...trendData.map((point) => point.value));

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
            <p className="eyebrow accent">ANALYTICS</p>
            <h2>
              Track patterns, portfolio health, and transparent planning
              signals.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Analytics summary">
            <div>
              <span className="meta-label">Quarter trend</span>
              <strong>+21%</strong>
            </div>
            <div>
              <span className="meta-label">Confidence</span>
              <strong>High</strong>
            </div>
            <div>
              <span className="meta-label">Advisory mode</span>
              <strong>Informational</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">TREND</p>
                <h3>Performance pattern</h3>
              </div>
            </div>

            <div className="bar-chart" aria-label="Savings trend chart">
              {trendData.map((point) => (
                <div className="bar-column" key={point.month}>
                  <span
                    className="bar-fill"
                    style={{ height: `${(point.value / maxValue) * 100}%` }}
                    title={`${point.month}: ${point.value}%`}
                  />
                  <small>{point.month}</small>
                </div>
              ))}
            </div>
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">OBSERVATIONS</p>
                <h3>Current signals</h3>
              </div>
            </div>

            {error ? (
              <p style={{ color: "#b42318", marginBottom: 12 }}>{error}</p>
            ) : null}

            <div className="insight-grid single-column">
              {loading ? (
                <div className="insight-box">Loading insights…</div>
              ) : insights.length === 0 ? (
                <div className="insight-box">No analytics insights yet.</div>
              ) : (
                insights.map((item) => (
                  <div className="insight-box" key={item.type + item.label}>
                    <span>{item.label}</span>
                    <strong>{item.source}</strong>
                    <small>{item.rationale}</small>
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>

        <section className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">INSIGHTS</p>
              <h3>Explainable summaries</h3>
            </div>
          </div>

          <div className="insight-grid three-up">
            {insights.length === 0 ? (
              <div className="insight-box">No insight data available.</div>
            ) : (
              insights.map((item) => (
                <div className="insight-box" key={item.type + item.label}>
                  <span>{item.label}</span>
                  <small>{item.rationale}</small>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </ProtectedLayout>
  );
}
