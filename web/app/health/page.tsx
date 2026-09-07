"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

type HealthRecord = {
  id: string;
  title: string;
  type: string;
  status: "Active" | "Monitoring" | "Review";
  detail: string;
  date: string;
};

const initialRecords: HealthRecord[] = [
  {
    id: "HL-101",
    title: "Annual preventive care",
    type: "Checkup",
    status: "Active",
    detail: "Primary care review scheduled for the next month.",
    date: "14 Aug 2026",
  },
  {
    id: "HL-204",
    title: "Sleep and recovery review",
    type: "Lifestyle",
    status: "Monitoring",
    detail: "Sleep quality has improved but still needs consistent tracking.",
    date: "06 Aug 2026",
  },
  {
    id: "HL-318",
    title: "Medication routine check",
    type: "Medication",
    status: "Review",
    detail:
      "Routine check in progress to confirm the current plan remains appropriate.",
    date: "27 Jul 2026",
  },
];

const defaultForm = {
  title: "",
  type: "Checkup",
  status: "Monitoring" as HealthRecord["status"],
  detail: "",
};

export default function HealthPage() {
  const { isAdmin, logout } = useRavAuth();
  const [records, setRecords] = useState<HealthRecord[]>(initialRecords);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  const healthStats = useMemo(() => {
    const activeCount = records.filter(
      (item) => item.status === "Active",
    ).length;
    const reviewCount = records.filter(
      (item) => item.status === "Review",
    ).length;
    const monitoringCount = records.filter(
      (item) => item.status === "Monitoring",
    ).length;

    return [
      {
        title: "Vital readiness",
        value: `${Math.max(65, 80 + activeCount - reviewCount)}%`,
        detail:
          "Core health markers remain stable, with a manageable care plan in place.",
      },
      {
        title: "Checkup cadence",
        value: activeCount > 0 ? "On track" : "Review",
        detail:
          "Upcoming reviews remain aligned with the current personal health plan.",
      },
      {
        title: "Risk posture",
        value: reviewCount > 0 ? "Moderate" : "Stable",
        detail:
          "There are no major issues, but a steady review cadence still matters.",
      },
      {
        title: "Recovery buffer",
        value: monitoringCount > 0 ? "Monitoring" : "Healthy",
        detail:
          "Recovery capacity and flexibility are strong enough for incremental changes.",
      },
    ];
  }, [records]);

  const actions = [
    "Review the next medical checkup and confirm the timing, provider, and follow-up plan.",
    "Check whether the current medication or routine needs any recent adjustments or documentation.",
    "Align the health plan with sleep, activity, and stress levels that have changed over time.",
    "Keep a simple emergency and insurance summary handy for quicker decisions in a health event.",
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      setError("Health item title is required.");
      return;
    }

    const nextRecord: HealthRecord = {
      id: `HL-${Math.floor(Date.now() / 1000) % 100000}`,
      title,
      type: form.type,
      status: form.status,
      detail: form.detail.trim() || "No additional notes recorded.",
      date: "Just now",
    };

    setRecords((current) => [nextRecord, ...current]);
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
            <p className="eyebrow accent">HEALTH</p>
            <h2>
              Keep personal health planning realistic, reviewed, and aligned
              with your broader life readiness model.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Health summary">
            <div>
              <span className="meta-label">Status</span>
              <strong>
                {records.some((item) => item.status === "Review")
                  ? "Monitor"
                  : "Stable"}
              </strong>
            </div>
            <div>
              <span className="meta-label">Care plan</span>
              <strong>
                {records.some((item) => item.status === "Active")
                  ? "Active"
                  : "Setup"}
              </strong>
            </div>
            <div>
              <span className="meta-label">Priority</span>
              <strong>{records.length > 2 ? "High" : "Normal"}</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">READINESS</p>
                <h3>Health management</h3>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="goal-form">
              <div className="field-grid">
                <label className="field">
                  <span>Health item</span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="e.g. Annual preventive visit"
                  />
                </label>

                <label className="field">
                  <span>Type</span>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value,
                      }))
                    }
                  >
                    <option>Checkup</option>
                    <option>Lifestyle</option>
                    <option>Medication</option>
                    <option>Recovery</option>
                    <option>Nutrition</option>
                  </select>
                </label>

                <label className="field">
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as HealthRecord["status"],
                      }))
                    }
                  >
                    <option value="Active">Active</option>
                    <option value="Monitoring">Monitoring</option>
                    <option value="Review">Review</option>
                  </select>
                </label>

                <label className="field field-wide">
                  <span>Notes</span>
                  <textarea
                    value={form.detail}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        detail: event.target.value,
                      }))
                    }
                    placeholder="Add important health notes, care reminders, or follow-ups."
                  />
                </label>
              </div>

              {error ? <p style={{ color: "#b42318" }}>{error}</p> : null}

              <button type="submit" className="primary-btn">
                Save health note
              </button>
            </form>

            <div className="insight-grid three-up" style={{ marginTop: 24 }}>
              {healthStats.map((item) => (
                <div className="insight-box" key={item.title}>
                  <span>{item.title}</span>
                  <strong>{item.value}</strong>
                  <small>{item.detail}</small>
                </div>
              ))}
            </div>

            <div className="goal-list compact-list" style={{ marginTop: 24 }}>
              {records.map((record) => (
                <div className="goal-item" key={record.id}>
                  <div className="goal-topline">
                    <strong>{record.title}</strong>
                    <span
                      className={`pill ${
                        record.status === "Active" ? "success" : "neutral"
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>
                  <div className="goal-details">
                    <span>{record.type}</span>
                    <span>{record.date}</span>
                  </div>
                  <div className="goal-details" style={{ marginTop: 0 }}>
                    <span>{record.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">ACTIONS</p>
                <h3>Next checks</h3>
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
    </RavProtectedLayout>
  );
}
