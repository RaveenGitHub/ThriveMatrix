"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

type EmergencyContact = {
  id: string;
  name: string;
  role: string;
  phone: string;
  status: "Primary" | "Backup" | "Review";
  detail: string;
};

const initialContacts: EmergencyContact[] = [
  {
    id: "EM-101",
    name: "Aanya Sharma",
    role: "Primary decision-maker",
    phone: "+91 98765 43210",
    status: "Primary",
    detail: "Handles urgent household and care coordination.",
  },
  {
    id: "EM-204",
    name: "Rita Nair",
    role: "Medical support",
    phone: "+91 99887 66554",
    status: "Backup",
    detail: "Available for medical questions and hospital coordination.",
  },
  {
    id: "EM-318",
    name: "Sameer Kulkarni",
    role: "Logistics support",
    phone: "+91 97654 32109",
    status: "Review",
    detail: "Needs a quick update on responsibilities and emergency route.",
  },
];

const defaultForm = {
  name: "",
  role: "Backup contact",
  phone: "",
  status: "Backup" as EmergencyContact["status"],
  detail: "",
};

export default function EmergencyPage() {
  const { isAdmin, logout } = useRavAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>(initialContacts);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  const emergencyStats = useMemo(() => {
    const primaryCount = contacts.filter(
      (item) => item.status === "Primary",
    ).length;
    const backupCount = contacts.filter(
      (item) => item.status === "Backup",
    ).length;
    const reviewCount = contacts.filter(
      (item) => item.status === "Review",
    ).length;

    return [
      {
        title: "Preparedness score",
        value: `${Math.max(75, 79 + primaryCount - reviewCount)}%`,
        detail: "The current emergency plan is mostly complete and actionable.",
      },
      {
        title: "Primary contacts",
        value: `${primaryCount || 1} people`,
        detail: "The most important support network is mapped and reachable.",
      },
      {
        title: "Care access",
        value: backupCount > 0 ? "Secure" : "Setup",
        detail:
          "Key contacts can be reached quickly without delay or confusion.",
      },
      {
        title: "Fallback plan",
        value: reviewCount > 0 ? "Monitor" : "Ready",
        detail:
          "There is a sensible backup path for disruption or urgent events.",
      },
    ];
  }, [contacts]);

  const actions = [
    "Confirm the emergency contact hierarchy and check whether access remains up to date.",
    "Review the medical and legal information that would matter most in an urgent scenario.",
    "Validate the availability of funds, documents, and communication channels in a crisis.",
    "Set a periodic check-in so emergency readiness remains current and usable.",
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    if (!name || !form.phone.trim()) {
      setError(
        "Name and phone number are required for emergency contact setup.",
      );
      return;
    }

    const nextContact: EmergencyContact = {
      id: `EM-${Math.floor(Date.now() / 1000) % 100000}`,
      name,
      role: form.role,
      phone: form.phone.trim(),
      status: form.status,
      detail:
        form.detail.trim() ||
        "Contact details updated and ready for rapid access.",
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
            <p className="eyebrow accent">EMERGENCY</p>
            <h2>
              Prepare your network, access points, and fallback steps for the
              moments that matter most.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Emergency summary">
            <div>
              <span className="meta-label">Status</span>
              <strong>
                {contacts.some((item) => item.status === "Review")
                  ? "Monitor"
                  : "Prepared"}
              </strong>
            </div>
            <div>
              <span className="meta-label">Contact chain</span>
              <strong>
                {contacts.some((item) => item.status === "Primary")
                  ? "Valid"
                  : "Setup"}
              </strong>
            </div>
            <div>
              <span className="meta-label">Priority</span>
              <strong>{contacts.length > 2 ? "Critical" : "Normal"}</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">READINESS</p>
                <h3>Emergency health</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {emergencyStats.map((item) => (
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
                <h3>Next steps</h3>
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
              <p className="eyebrow">CONTACTS</p>
              <h3>Emergency response team</h3>
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
                <span>Role</span>
                <input
                  value={form.role}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      role: event.target.value,
                    }))
                  }
                  placeholder="Backup contact"
                />
              </label>

              <label className="field">
                <span>Phone</span>
                <input
                  value={form.phone}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="+91 98XXXXXXX"
                />
              </label>

              <label className="field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as EmergencyContact["status"],
                    }))
                  }
                >
                  <option value="Primary">Primary</option>
                  <option value="Backup">Backup</option>
                  <option value="Review">Review</option>
                </select>
              </label>

              <label className="field field-wide">
                <span>Context</span>
                <textarea
                  value={form.detail}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      detail: event.target.value,
                    }))
                  }
                  placeholder="Add context around response timing, relationship, or specific needs."
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
                  <span>{contact.role}</span>
                  <span>{contact.phone}</span>
                  <span>{contact.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </RavProtectedLayout>
  );
}
