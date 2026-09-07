"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

type SecurityEvent = {
  id: string;
  title: string;
  status: "Approved" | "Review" | "Healthy";
  detail: string;
};

const initialEvents: SecurityEvent[] = [
  {
    id: "SEC-204",
    title: "Password reset review",
    status: "Approved",
    detail: "Recovery flow verified for account safety.",
  },
  {
    id: "SEC-312",
    title: "Consent export check",
    status: "Review",
    detail: "Retention and export review is underway.",
  },
  {
    id: "SEC-421",
    title: "Audit replay test",
    status: "Healthy",
    detail: "Recent mutation log is replay-safe and complete.",
  },
];

const defaultForm = {
  title: "",
  status: "Healthy" as SecurityEvent["status"],
  detail: "",
};

export default function SecurityPage() {
  const { isAdmin, logout } = useRavAuth();
  const [events, setEvents] = useState<SecurityEvent[]>(initialEvents);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  const securityScores = useMemo(() => {
    const reviewCount = events.filter(
      (item) => item.status === "Review",
    ).length;
    const healthyCount = events.filter(
      (item) => item.status === "Healthy",
    ).length;

    return [
      {
        label: "Authentication",
        value: `${98 - reviewCount}%`,
        note: "Token refresh and expiry controls are active.",
      },
      {
        label: "Data isolation",
        value: `${96 - reviewCount}%`,
        note: "Owner-scoped access is enforced on all records.",
      },
      {
        label: "Audit logs",
        value: `${94 + healthyCount}%`,
        note: "Sensitive writes remain traceable and reviewable.",
      },
      {
        label: "Redaction",
        value: "99%",
        note: "Private fields remain masked in logs and exports.",
      },
    ];
  }, [events]);

  const controls = [
    "Access tokens are short-lived and revocable.",
    "Cross-user mutations are blocked by ownership checks.",
    "Audit events capture actor, timestamp, target, and reason.",
    "Sensitive values remain masked in telemetry and exports.",
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      setError("Audit event title is required.");
      return;
    }

    const nextEvent: SecurityEvent = {
      id: `SEC-${Math.floor(Date.now() / 1000) % 100000}`,
      title,
      status: form.status,
      detail:
        form.detail.trim() || "Review details recorded for audit follow-up.",
    };

    setEvents((current) => [nextEvent, ...current]);
    setForm(defaultForm);
    setError("");
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
            <p className="eyebrow accent">SECURITY</p>
            <h2>
              Protect user identity, private records, and change integrity.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Security summary">
            <div>
              <span className="meta-label">Risk posture</span>
              <strong>
                {events.some((item) => item.status === "Review")
                  ? "Monitor"
                  : "Controlled"}
              </strong>
            </div>
            <div>
              <span className="meta-label">Audit health</span>
              <strong>
                {events.some((item) => item.status === "Healthy")
                  ? "Stable"
                  : "Review"}
              </strong>
            </div>
            <div>
              <span className="meta-label">Policy mode</span>
              <strong>Owner-scoped</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">CONTROL STACK</p>
                <h3>Security coverage</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {securityScores.map((metric) => (
                <div className="insight-box" key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <small>{metric.note}</small>
                </div>
              ))}
            </div>
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">PROTECTION</p>
                <h3>Core controls</h3>
              </div>
            </div>

            <ul className="activity-list">
              {controls.map((step) => (
                <li key={step}>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="panel bottom-grid">
          <div className="section-head">
            <div>
              <p className="eyebrow">AUDIT</p>
              <h3>Recent review events</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="goal-form">
            <div className="field-grid">
              <label className="field">
                <span>Event title</span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="e.g. Password reset review"
                />
              </label>

              <label className="field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as SecurityEvent["status"],
                    }))
                  }
                >
                  <option value="Approved">Approved</option>
                  <option value="Review">Review</option>
                  <option value="Healthy">Healthy</option>
                </select>
              </label>

              <label className="field field-wide">
                <span>Detail</span>
                <textarea
                  value={form.detail}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      detail: event.target.value,
                    }))
                  }
                  placeholder="Add context around follow-up, review findings, or audit note."
                />
              </label>
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="button-row">
              <button type="submit" className="primary-btn">
                Save event
              </button>
            </div>
          </form>

          <div className="goal-list compact-list">
            {events.map((event) => (
              <div className="goal-item" key={event.id}>
                <div className="goal-topline">
                  <strong>{event.title}</strong>
                  <span className="pill success">{event.status}</span>
                </div>
                <div className="goal-details">
                  <span>{event.id}</span>
                  <span>{event.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </RavProtectedLayout>
  );
}
