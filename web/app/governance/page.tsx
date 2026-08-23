"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../auth-context";
import { ProtectedLayout } from "../protected-layout";

type GovernanceUser = {
  email: string;
  role: string;
  status: string;
};

type GovernanceSummary = {
  status: string;
  users: GovernanceUser[];
  modules: Array<{ id: string; name: string; status: string }>;
};

export default function GovernancePage() {
  const { isAdmin, logout } = useAuth();
  const [summary, setSummary] = useState<GovernanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadGovernance = async () => {
      try {
        setLoading(true);
        const response = await apiFetch<GovernanceSummary>(
          "/api/v1/admin/governance",
        );
        setSummary(response);
        setError("");
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load governance",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadGovernance();
  }, []);

  const adminUsers = useMemo(
    () => summary?.users.filter((user) => user.role === "admin") ?? [],
    [summary],
  );

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
            <p className="eyebrow accent">GOVERNANCE</p>
            <h2>Review access, module status, and ownership posture.</h2>
          </div>

          <div className="summary-strip" aria-label="Governance summary">
            <div>
              <span className="meta-label">System</span>
              <strong>
                {loading ? "Loading" : (summary?.status ?? "unknown")}
              </strong>
            </div>
            <div>
              <span className="meta-label">Admins</span>
              <strong>{adminUsers.length}</strong>
            </div>
            <div>
              <span className="meta-label">Modules</span>
              <strong>{summary?.modules.length ?? 0}</strong>
            </div>
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
                <p className="eyebrow">MODULES</p>
                <h3>Access scope</h3>
              </div>
            </div>

            {loading ? (
              <div className="governance-list">Loading module health…</div>
            ) : (
              <div className="governance-list">
                {(summary?.modules ?? []).map((module) => (
                  <div className="governance-item" key={module.id}>
                    <span>{module.id}</span>
                    <strong>{module.name}</strong>
                    <span
                      className={`pill ${module.status === "enabled" ? "success" : "neutral"}`}
                    >
                      {module.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">ADMINS</p>
                <h3>Role owners</h3>
              </div>
            </div>

            <ul className="activity-list">
              {(summary?.users ?? []).map((user) => (
                <li key={user.email}>
                  <span>
                    <strong>{user.email}</strong>
                    <small>
                      {user.role} • {user.status}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </main>
    </ProtectedLayout>
  );
}
