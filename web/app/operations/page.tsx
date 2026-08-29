"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../auth-context";
import { ProtectedLayout } from "../protected-layout";

type OperationsSummary = {
  status: string;
  dependencies: Record<string, string>;
  metrics: {
    audit_event_count: number;
    user_count: number;
    goal_count: number;
    investment_count: number;
    policy_count: number;
  };
};

type RecoveryStatus = {
  status: string;
  rto_minutes: number;
  rpo_minutes: number;
  failover: {
    status: string;
    strategy: string;
    trigger: string;
  };
  dlq: {
    status: string;
    pending_count: number;
    retry_policy: string;
  };
  graceful_degradation: {
    status: string;
    mode: string;
  };
  runbook: Array<{ step: string; owner: string }>;
};

type SecurityReview = {
  status: string;
  checks: Array<{ name: string; status: string; owner: string }>;
  findings: Array<{ severity: string; title: string; status: string }>;
  release_gate: { blocking: boolean; policy: string };
};

type LaunchGovernance = {
  status: string;
  checklist: Array<{ id: string; name: string; status: string }>;
  signoffs: Record<string, string>;
};

type ReleaseRunbook = {
  status: string;
  rollback: Array<{ step: string; owner: string }>;
  support: { escalation: string; runbook: string };
};

type ReleaseDecision = {
  status: string;
  decision: string;
  known_limitations: Array<{
    id: string;
    area: string;
    risk: string;
    mitigation: string;
  }>;
  pending_decisions: Array<{
    id: string;
    title: string;
    owner: string;
    required_before: string;
    status: string;
    notes: string;
  }>;
  signoff_status: Record<string, string>;
};

export default function OperationsPage() {
  const { isAdmin, logout } = useAuth();
  const [summary, setSummary] = useState<OperationsSummary | null>(null);
  const [recovery, setRecovery] = useState<RecoveryStatus | null>(null);
  const [securityReview, setSecurityReview] = useState<SecurityReview | null>(
    null,
  );
  const [launchGovernance, setLaunchGovernance] =
    useState<LaunchGovernance | null>(null);
  const [releaseRunbook, setReleaseRunbook] = useState<ReleaseRunbook | null>(
    null,
  );
  const [releaseDecision, setReleaseDecision] =
    useState<ReleaseDecision | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadOperations = async () => {
      try {
        setLoading(true);
        const [
          summaryResponse,
          recoveryResponse,
          securityResponse,
          launchResponse,
          runbookResponse,
          releaseDecisionResponse,
        ] = await Promise.all([
          apiFetch<OperationsSummary>("/api/v1/operations/summary"),
          apiFetch<RecoveryStatus>("/api/v1/operations/recovery"),
          apiFetch<SecurityReview>("/api/v1/operations/security-review"),
          apiFetch<LaunchGovernance>("/api/v1/launch/governance"),
          apiFetch<ReleaseRunbook>("/api/v1/release/runbook"),
          apiFetch<ReleaseDecision>("/api/v1/release/decision"),
        ]);

        setSummary(summaryResponse);
        setRecovery(recoveryResponse);
        setSecurityReview(securityResponse);
        setLaunchGovernance(launchResponse);
        setReleaseRunbook(runbookResponse);
        setReleaseDecision(releaseDecisionResponse);
        setError("");
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load operations status",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadOperations();
  }, []);

  const readinessChecks = useMemo(
    () =>
      launchGovernance?.checklist ?? [
        { id: "G1", name: "Architecture", status: "pending" },
        { id: "G2", name: "Security foundation", status: "pending" },
      ],
    [launchGovernance],
  );

  const runbookSteps = useMemo(
    () =>
      releaseRunbook?.rollback ?? [
        { step: "No rollback steps available.", owner: "ops" },
      ],
    [releaseRunbook],
  );

  const pendingDecisions = useMemo(
    () => releaseDecision?.pending_decisions ?? [],
    [releaseDecision],
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
            <p className="eyebrow accent">OPERATIONS</p>
            <h2>
              Track platform health, release readiness, and owner action loops.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Operations summary">
            <div>
              <span className="meta-label">System status</span>
              <strong>
                {loading ? "Loading" : (summary?.status ?? "unknown")}
              </strong>
            </div>
            <div>
              <span className="meta-label">Recovery</span>
              <strong>{recovery?.status ?? "unknown"}</strong>
            </div>
            <div>
              <span className="meta-label">Release gate</span>
              <strong>{securityReview?.status ?? "unknown"}</strong>
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
                <p className="eyebrow">GOVERNANCE</p>
                <h3>Launch checklist</h3>
              </div>
            </div>

            {loading ? (
              <div className="governance-list">Loading launch status…</div>
            ) : (
              <div className="governance-list">
                {readinessChecks.map((item) => (
                  <div className="governance-item" key={item.id}>
                    <span>{item.id}</span>
                    <strong>{item.name}</strong>
                    <span
                      className={`pill ${item.status === "approved" ? "success" : "neutral"}`}
                    >
                      {item.status}
                    </span>
                  </div>
                ))}
                {pendingDecisions.length > 0 ? (
                  <div
                    className="governance-item"
                    style={{
                      borderTop: "1px solid rgba(148,163,184,0.25)",
                      paddingTop: 14,
                    }}
                  >
                    <span>DECISIONS</span>
                    <strong>Pending approvals</strong>
                    <span className="pill neutral">
                      {pendingDecisions.length}
                    </span>
                  </div>
                ) : null}
              </div>
            )}
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">RUNBOOK</p>
                <h3>Release actions</h3>
              </div>
            </div>

            {loading ? (
              <ul className="activity-list">
                <li>
                  <span>Loading runbook…</span>
                </li>
              </ul>
            ) : (
              <>
                <ul className="activity-list">
                  {runbookSteps.map((step) => (
                    <li key={`${step.owner}-${step.step}`}>
                      <span>{step.step}</span>
                    </li>
                  ))}
                </ul>
                {pendingDecisions.length > 0 ? (
                  <div style={{ marginTop: 20 }}>
                    <p className="eyebrow">PENDING DECISIONS</p>
                    <ul className="activity-list">
                      {pendingDecisions.map((item) => (
                        <li key={item.id}>
                          <span>
                            <strong>{item.id}:</strong> {item.title} (
                            {item.owner})
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            )}
          </aside>
        </section>

        <section className="content-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">RECOVERY</p>
                <h3>Business continuity</h3>
              </div>
            </div>

            {loading || !recovery ? (
              <div className="insight-box">Loading recovery plan…</div>
            ) : (
              <div className="insight-grid single-column">
                <div className="insight-box">
                  <span>Recovery status</span>
                  <strong>{recovery.status}</strong>
                  <small>{recovery.failover.strategy}</small>
                </div>
                <div className="insight-box">
                  <span>RTO / RPO</span>
                  <strong>
                    {recovery.rto_minutes} / {recovery.rpo_minutes} mins
                  </strong>
                  <small>{recovery.failover.trigger}</small>
                </div>
                <div className="insight-box">
                  <span>DLQ</span>
                  <strong>{recovery.dlq.status}</strong>
                  <small>{recovery.dlq.pending_count} pending items</small>
                </div>
              </div>
            )}
          </article>

          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">SECURITY</p>
                <h3>Release gate</h3>
              </div>
            </div>

            {loading || !securityReview ? (
              <div className="insight-box">Loading security review…</div>
            ) : (
              <div className="insight-grid single-column">
                {securityReview.checks.slice(0, 3).map((check) => (
                  <div className="insight-box" key={check.name}>
                    <span>{check.name}</span>
                    <strong>{check.status}</strong>
                    <small>{check.owner}</small>
                  </div>
                ))}
              </div>
            )}
          </article>
        </section>
      </main>
    </ProtectedLayout>
  );
}
