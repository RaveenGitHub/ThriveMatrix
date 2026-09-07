"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

type CareerEntry = {
  id: string;
  title: string;
  company: string;
  status: "Active" | "Review" | "Stretch";
  notes: string;
  timeline: string;
};

const initialEntries: CareerEntry[] = [
  {
    id: "CAR-101",
    title: "Senior product lead",
    company: "Northstar Labs",
    status: "Active",
    notes: "Role fit is strong and compensation remains resilient.",
    timeline: "This quarter",
  },
  {
    id: "CAR-204",
    title: "Leadership development",
    company: "Internal growth plan",
    status: "Review",
    notes: "Learning goals are progressing, but a few skill gaps remain.",
    timeline: "Next 90 days",
  },
  {
    id: "CAR-318",
    title: "Market repositioning",
    company: "Career runway review",
    status: "Stretch",
    notes: "Transition readiness remains strong for the right opportunity.",
    timeline: "12 months",
  },
];

const defaultForm = {
  title: "",
  company: "",
  status: "Active" as CareerEntry["status"],
  notes: "",
};

export default function CareerPage() {
  const { isAdmin, logout } = useRavAuth();
  const [entries, setEntries] = useState<CareerEntry[]>(initialEntries);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  const careerMetrics = useMemo(() => {
    const activeCount = entries.filter(
      (item) => item.status === "Active",
    ).length;
    const reviewCount = entries.filter(
      (item) => item.status === "Review",
    ).length;

    return [
      {
        label: "Income stability",
        value: `${Math.max(80, 84 + activeCount - reviewCount)}%`,
        detail: "Role income remains diversified and resilient.",
      },
      {
        label: "Skill momentum",
        value: `${Math.max(70, 76 + activeCount)}%`,
        detail: "Learning plan is consistent and growing.",
      },
      {
        label: "Career runway",
        value: `${Math.max(4, 5 + Math.min(2, activeCount))} yrs`,
        detail: "Current trajectory supports near-term flexibility.",
      },
      {
        label: "Opportunity readiness",
        value: reviewCount > 0 ? "Monitor" : "High",
        detail: "Profile strength remains solid for transitions.",
      },
    ];
  }, [entries]);

  const milestones = [
    "Review role alignment and compensation stability for the next planning cycle.",
    "Reassess the learning roadmap against current capability gaps and goals.",
    "Track networking goals and momentum for the next 90-day window.",
    "Confirm whether transition readiness should remain active or be paused.",
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    if (!title || !form.company.trim()) {
      setError("Career title and company are required.");
      return;
    }

    const nextEntry: CareerEntry = {
      id: `CAR-${Math.floor(Date.now() / 1000) % 100000}`,
      title,
      company: form.company.trim(),
      status: form.status,
      notes: form.notes.trim() || "No additional notes recorded.",
      timeline: "Just now",
    };

    setEntries((current) => [nextEntry, ...current]);
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
            <p className="eyebrow accent">CAREER</p>
            <h2>
              Track professional momentum, role stability, and growth readiness.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Career summary">
            <div>
              <span className="meta-label">Stability</span>
              <strong>
                {entries.some((item) => item.status === "Review")
                  ? "Monitor"
                  : "Healthy"}
              </strong>
            </div>
            <div>
              <span className="meta-label">Learning</span>
              <strong>
                {entries.some((item) => item.status === "Active")
                  ? "Active"
                  : "Setup"}
              </strong>
            </div>
            <div>
              <span className="meta-label">Transitions</span>
              <strong>
                {entries.some((item) => item.status === "Stretch")
                  ? "Ready"
                  : "Balanced"}
              </strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">MOMENTUM</p>
                <h3>Career health</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {careerMetrics.map((metric) => (
                <div className="insight-box" key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                  <small>{metric.detail}</small>
                </div>
              ))}
            </div>
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">NEXT STEPS</p>
                <h3>Quarter focus</h3>
              </div>
            </div>

            <ul className="activity-list">
              {milestones.map((step) => (
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
              <p className="eyebrow">TRACKER</p>
              <h3>Role and goal notes</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="goal-form">
            <div className="field-grid">
              <label className="field">
                <span>Role title</span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="e.g. Senior product lead"
                />
              </label>

              <label className="field">
                <span>Company</span>
                <input
                  value={form.company}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      company: event.target.value,
                    }))
                  }
                  placeholder="e.g. Northstar Labs"
                />
              </label>

              <label className="field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as CareerEntry["status"],
                    }))
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Review">Review</option>
                  <option value="Stretch">Stretch</option>
                </select>
              </label>

              <label className="field field-wide">
                <span>Notes</span>
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Add context around progress, fit, or next action."
                />
              </label>
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="button-row">
              <button type="submit" className="primary-btn">
                Save update
              </button>
            </div>
          </form>

          <div className="goal-list compact-list">
            {entries.map((entry) => (
              <div className="goal-item" key={entry.id}>
                <div className="goal-topline">
                  <strong>{entry.title}</strong>
                  <span className="pill success">{entry.status}</span>
                </div>
                <div className="goal-details">
                  <span>{entry.company}</span>
                  <span>{entry.notes}</span>
                  <span>{entry.timeline}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </RavProtectedLayout>
  );
}
