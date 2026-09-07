"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

type LegalRecord = {
  id: string;
  title: string;
  category: string;
  owner: string;
  status: "Prepared" | "Review" | "Needs attention";
  notes: string;
  updated: string;
};

const initialLegalRecords: LegalRecord[] = [
  {
    id: "LEG-101",
    title: "Will and nominee update",
    category: "Estate",
    owner: "Uma Rajagopal",
    status: "Review",
    notes: "Witness confirmation still pending before submission.",
    updated: "2 days ago",
  },
  {
    id: "LEG-204",
    title: "Health power of attorney",
    category: "Planning",
    owner: "Family desk",
    status: "Prepared",
    notes: "Current and ready for emergency access if needed.",
    updated: "6 days ago",
  },
  {
    id: "LEG-318",
    title: "Insurance nomination summary",
    category: "Coverage",
    owner: "Wealth desk",
    status: "Needs attention",
    notes: "Nominee and designation fields need the latest confirmation.",
    updated: "1 week ago",
  },
];

const defaultForm = {
  title: "",
  category: "Estate",
  owner: "",
  status: "Prepared" as LegalRecord["status"],
  notes: "",
};

export default function LegalPage() {
  const { isAdmin, logout } = useRavAuth();
  const [records, setRecords] = useState<LegalRecord[]>(initialLegalRecords);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  const legalStats = useMemo(() => {
    const prepared = records.filter(
      (item) => item.status === "Prepared",
    ).length;
    const review = records.filter((item) => item.status === "Review").length;
    const needsAttention = records.filter(
      (item) => item.status === "Needs attention",
    ).length;

    return [
      {
        title: "Document coverage",
        value: `${Math.max(80, 70 + prepared * 6 - needsAttention * 4)}%`,
        detail: "The legal records set is mostly current and easy to retrieve.",
      },
      {
        title: "Nominee clarity",
        value: review > 0 ? "Monitor" : "Strong",
        detail:
          "Beneficiary and nominee information remains sufficiently clear for review.",
      },
      {
        title: "Emergency access",
        value: prepared > 0 ? "Ready" : "Setup",
        detail:
          "Primary and backup contacts are identified for sensitive document access.",
      },
      {
        title: "Retention health",
        value: needsAttention > 0 ? "Attention" : "Managed",
        detail:
          "Storage and review cadence remain aligned with the current control model.",
      },
    ];
  }, [records]);

  const actions = [
    "Review current legal records and align them with the latest family or nominee changes.",
    "Confirm legal access permissions for trusted contacts and backup decision-makers.",
    "Check whether any policy or estate documents need a second review before renewal cycles.",
    "Set a recurring legal document review cadence to keep sensitive records current.",
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      setError("Legal record title is required.");
      return;
    }

    const nextRecord: LegalRecord = {
      id: `LEG-${Math.floor(Date.now() / 1000) % 100000}`,
      title,
      category: form.category,
      owner: form.owner.trim() || "Personal vault",
      status: form.status,
      notes: form.notes.trim() || "No additional notes recorded.",
      updated: "just now",
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
            <p className="eyebrow accent">LEGAL</p>
            <h2>
              Keep key records, nominee clarity, and emergency access aligned
              with your long-term protection plan.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Legal summary">
            <div>
              <span className="meta-label">Status</span>
              <strong>
                {records.some((item) => item.status === "Needs attention")
                  ? "Monitor"
                  : "Prepared"}
              </strong>
            </div>
            <div>
              <span className="meta-label">Access</span>
              <strong>
                {records.some((item) => item.status === "Prepared")
                  ? "Controlled"
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
                <h3>Legal health</h3>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="goal-form">
              <div className="field-grid">
                <label className="field">
                  <span>Record title</span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="e.g. Living will update"
                  />
                </label>

                <label className="field">
                  <span>Category</span>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                  >
                    <option>Estate</option>
                    <option>Planning</option>
                    <option>Coverage</option>
                    <option>Nomination</option>
                    <option>Compliance</option>
                  </select>
                </label>

                <label className="field">
                  <span>Owner</span>
                  <input
                    value={form.owner}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        owner: event.target.value,
                      }))
                    }
                    placeholder="e.g. Family desk"
                  />
                </label>

                <label className="field">
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as LegalRecord["status"],
                      }))
                    }
                  >
                    <option value="Prepared">Prepared</option>
                    <option value="Review">Review</option>
                    <option value="Needs attention">Needs attention</option>
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
                    placeholder="Add important legal notes, validation requirements, or review details."
                  />
                </label>
              </div>

              {error ? <p style={{ color: "#b42318" }}>{error}</p> : null}

              <button type="submit" className="primary-btn">
                Save legal record
              </button>
            </form>

            <div className="insight-grid three-up" style={{ marginTop: 24 }}>
              {legalStats.map((item) => (
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
                        record.status === "Prepared" ? "success" : "neutral"
                      }`}
                    >
                      {record.status}
                    </span>
                  </div>
                  <div className="goal-details">
                    <span>{record.category}</span>
                    <span>{record.owner}</span>
                  </div>
                  <div className="goal-details" style={{ marginTop: 0 }}>
                    <span>{record.notes}</span>
                    <span>{record.updated}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">ACTIONS</p>
                <h3>Next decisions</h3>
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
