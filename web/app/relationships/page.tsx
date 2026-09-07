"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

type RelationshipRecord = {
  id: string;
  name: string;
  type: string;
  status: "Strong" | "Review" | "Support";
  focus: string;
  note: string;
  updated: string;
};

const initialRelationships: RelationshipRecord[] = [
  {
    id: "REL-101",
    name: "Priya Sharma",
    type: "Partner",
    status: "Strong",
    focus: "Shared planning",
    note: "Regular check-ins and aligned goals continue to strengthen planning rhythm.",
    updated: "2 days ago",
  },
  {
    id: "REL-204",
    name: "Rohit Nair",
    type: "Sibling",
    status: "Support",
    focus: "Practical support",
    note: "Need a clearer cadence for day-to-day logistics and family coordination.",
    updated: "5 days ago",
  },
  {
    id: "REL-318",
    name: "Leah Morgan",
    type: "Mentor",
    status: "Review",
    focus: "Career perspective",
    note: "Good guidance remains valuable; a check-in would deepen alignment.",
    updated: "1 week ago",
  },
];

const defaultForm = {
  name: "",
  type: "Partner",
  status: "Support" as RelationshipRecord["status"],
  focus: "",
  note: "",
};

export default function RelationshipsPage() {
  const { isAdmin, logout } = useRavAuth();
  const [relationships, setRelationships] =
    useState<RelationshipRecord[]>(initialRelationships);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  const relationshipStats = useMemo(() => {
    const strongCount = relationships.filter(
      (item) => item.status === "Strong",
    ).length;
    const reviewCount = relationships.filter(
      (item) => item.status === "Review",
    ).length;
    const supportCount = relationships.filter(
      (item) => item.status === "Support",
    ).length;

    return [
      {
        title: "Connection health",
        value: `${Math.max(70, 78 + strongCount * 4 - reviewCount)}%`,
        detail:
          "Your key relationships remain supportive, consistent, and well-connected.",
      },
      {
        title: "Care network",
        value: `${relationships.length} links`,
        detail:
          "The support system covers core emotional, practical, and planning needs.",
      },
      {
        title: "Quality rhythm",
        value: reviewCount > 0 ? "Needs care" : "Strong",
        detail:
          "Communication and check-ins are happening with enough regularity to remain healthy.",
      },
      {
        title: "Alignment score",
        value: supportCount > 0 ? "Balanced" : "Healthy",
        detail:
          "Current relationship priorities are consistent with the broader life plan.",
      },
    ];
  }, [relationships]);

  const actions = [
    "Review whether the most important relationships still have clear communication and shared planning rhythms.",
    "Confirm that support roles are still aligned with recent life changes or growing responsibilities.",
    "Set a small recurring check-in for the people who matter most in high-impact life decisions.",
    "Keep a simple map of trusted relationships for emotional, practical, and emergency support.",
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      setError("Relationship name is required.");
      return;
    }

    const nextRelationship: RelationshipRecord = {
      id: `REL-${Math.floor(Date.now() / 1000) % 100000}`,
      name,
      type: form.type,
      status: form.status,
      focus: form.focus.trim() || "General support",
      note: form.note.trim() || "No additional relationship notes recorded.",
      updated: "just now",
    };

    setRelationships((current) => [nextRelationship, ...current]);
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
            <p className="eyebrow accent">RELATIONSHIPS</p>
            <h2>
              Keep the people and support ties that matter most aligned with
              your life, planning, and resilience goals.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Relationships summary">
            <div>
              <span className="meta-label">Support</span>
              <strong>
                {relationships.some((item) => item.status === "Strong")
                  ? "Active"
                  : "Growing"}
              </strong>
            </div>
            <div>
              <span className="meta-label">Health</span>
              <strong>
                {relationships.some((item) => item.status === "Review")
                  ? "Monitor"
                  : "Strong"}
              </strong>
            </div>
            <div>
              <span className="meta-label">Priority</span>
              <strong>{relationships.length > 2 ? "High" : "Normal"}</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">READINESS</p>
                <h3>Relationship health</h3>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="goal-form">
              <div className="field-grid">
                <label className="field">
                  <span>Name</span>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. Maya Singh"
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
                    <option>Partner</option>
                    <option>Family</option>
                    <option>Sibling</option>
                    <option>Friend</option>
                    <option>Mentor</option>
                    <option>Advisor</option>
                  </select>
                </label>

                <label className="field">
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target
                          .value as RelationshipRecord["status"],
                      }))
                    }
                  >
                    <option value="Strong">Strong</option>
                    <option value="Support">Support</option>
                    <option value="Review">Review</option>
                  </select>
                </label>

                <label className="field field-wide">
                  <span>Focus</span>
                  <input
                    value={form.focus}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        focus: event.target.value,
                      }))
                    }
                    placeholder="e.g. Shared planning"
                  />
                </label>

                <label className="field field-wide">
                  <span>Notes</span>
                  <textarea
                    value={form.note}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                    placeholder="Add context on communication rhythm, trust, or action needs."
                  />
                </label>
              </div>

              {error ? <p style={{ color: "#b42318" }}>{error}</p> : null}

              <button type="submit" className="primary-btn">
                Save relationship
              </button>
            </form>

            <div className="insight-grid three-up" style={{ marginTop: 24 }}>
              {relationshipStats.map((item) => (
                <div className="insight-box" key={item.title}>
                  <span>{item.title}</span>
                  <strong>{item.value}</strong>
                  <small>{item.detail}</small>
                </div>
              ))}
            </div>

            <div className="goal-list compact-list" style={{ marginTop: 24 }}>
              {relationships.map((relationship) => (
                <div className="goal-item" key={relationship.id}>
                  <div className="goal-topline">
                    <strong>{relationship.name}</strong>
                    <span
                      className={`pill ${
                        relationship.status === "Strong" ? "success" : "neutral"
                      }`}
                    >
                      {relationship.status}
                    </span>
                  </div>
                  <div className="goal-details">
                    <span>{relationship.type}</span>
                    <span>{relationship.focus}</span>
                  </div>
                  <div className="goal-details" style={{ marginTop: 0 }}>
                    <span>{relationship.note}</span>
                    <span>{relationship.updated}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">ACTIONS</p>
                <h3>Next priorities</h3>
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
