"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

type FamilyContact = {
  id: string;
  name: string;
  relationship: string;
  status: "Active" | "Monitoring" | "Review";
  notes: string;
  lastCheckIn: string;
};

const initialContacts: FamilyContact[] = [
  {
    id: "FAM-101",
    name: "Aanya Sharma",
    relationship: "Partner",
    status: "Active",
    notes: "Weekly planning and long-term goals are on track.",
    lastCheckIn: "Today",
  },
  {
    id: "FAM-204",
    name: "Rita Nair",
    relationship: "Mother",
    status: "Monitoring",
    notes: "Health and care planning review is scheduled next week.",
    lastCheckIn: "3 days ago",
  },
  {
    id: "FAM-318",
    name: "Sameer Kulkarni",
    relationship: "Brother",
    status: "Review",
    notes: "Support coordination and shared logistics need a brief follow-up.",
    lastCheckIn: "1 week ago",
  },
];

const defaultForm = {
  name: "",
  relationship: "Partner",
  status: "Active" as FamilyContact["status"],
  notes: "",
};

export default function FamilyPage() {
  const { isAdmin, logout } = useRavAuth();
  const [contacts, setContacts] = useState<FamilyContact[]>(initialContacts);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  const familyStats = useMemo(() => {
    const activeCount = contacts.filter(
      (item) => item.status === "Active",
    ).length;
    const monitoringCount = contacts.filter(
      (item) => item.status === "Monitoring",
    ).length;
    const reviewCount = contacts.filter(
      (item) => item.status === "Review",
    ).length;

    return [
      {
        title: "Relationship readiness",
        value: `${Math.max(70, 82 + activeCount - reviewCount)}%`,
        detail:
          "The current family and support network remains stable and well-aligned.",
      },
      {
        title: "Care load",
        value: monitoringCount > 0 ? "Balanced" : "Healthy",
        detail:
          "Current responsibilities are manageable without excessive strain.",
      },
      {
        title: "Emergency support",
        value: `${contacts.length + 4} people`,
        detail:
          "The plan includes clear fallback coverage for urgent situations.",
      },
      {
        title: "Communication rhythm",
        value: reviewCount > 0 ? "Review" : "Healthy",
        detail:
          "Family check-ins and decision loops are timely and consistent.",
      },
    ];
  }, [contacts]);

  const actions = [
    "Review the household support map and confirm who is accountable for urgent decisions.",
    "Clarify next-level care, financial, and logistics responsibilities across key family members.",
    "Validate whether emergency contacts and document access are still current and secure.",
    "Set a shared cadence for family planning, communication, and milestone updates.",
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      setError("Family member name is required.");
      return;
    }

    const nextContact: FamilyContact = {
      id: `FAM-${Math.floor(Date.now() / 1000) % 100000}`,
      name,
      relationship: form.relationship,
      status: form.status,
      notes: form.notes.trim() || "No additional notes recorded.",
      lastCheckIn: "Just now",
    };

    setContacts((current) => [nextContact, ...current]);
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
            <p className="eyebrow accent">FAMILY</p>
            <h2>
              Keep relationships, care responsibilities, and support plans
              aligned with your life decisions.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Family summary">
            <div>
              <span className="meta-label">Support</span>
              <strong>
                {contacts.some((item) => item.status === "Active")
                  ? "Active"
                  : "Setup"}
              </strong>
            </div>
            <div>
              <span className="meta-label">Balance</span>
              <strong>
                {contacts.some((item) => item.status === "Review")
                  ? "Monitor"
                  : "Healthy"}
              </strong>
            </div>
            <div>
              <span className="meta-label">Priority</span>
              <strong>{contacts.length > 2 ? "High" : "Normal"}</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">READINESS</p>
                <h3>Family health</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {familyStats.map((item) => (
                <div className="insight-box" key={item.title}>
                  <span>{item.title}</span>
                  <strong>{item.value}</strong>
                  <small>{item.detail}</small>
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

        <section className="panel bottom-grid">
          <div className="section-head">
            <div>
              <p className="eyebrow">NETWORK</p>
              <h3>Support contacts</h3>
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
                <span>Relationship</span>
                <select
                  value={form.relationship}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      relationship: event.target.value,
                    }))
                  }
                >
                  <option>Partner</option>
                  <option>Parent</option>
                  <option>Sibling</option>
                  <option>Child</option>
                  <option>Relative</option>
                  <option>Friend</option>
                </select>
              </label>

              <label className="field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as FamilyContact["status"],
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
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Add context on communication rhythm, trust, or action needs."
                />
              </label>
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="button-row">
              <button type="submit" className="primary-btn">
                Save contact
              </button>
            </div>
          </form>

          <div className="goal-list compact-list">
            {contacts.map((contact) => (
              <div className="goal-item" key={contact.id}>
                <div className="goal-topline">
                  <strong>{contact.name}</strong>
                  <span className="pill success">{contact.status}</span>
                </div>
                <div className="goal-details">
                  <span>{contact.relationship}</span>
                  <span>{contact.notes}</span>
                  <span>Last check-in: {contact.lastCheckIn}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </RavProtectedLayout>
  );
}
