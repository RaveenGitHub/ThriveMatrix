"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

type DocumentEntry = {
  id: string;
  title: string;
  type: string;
  status: "Verified" | "Review" | "Active" | "Archived";
  owner: string;
  updated: string;
  notes: string;
};

const initialDocuments: DocumentEntry[] = [
  {
    id: "DOC-101",
    title: "Will and nominee update",
    type: "Legal",
    status: "Review",
    owner: "Uma Rajagopal",
    updated: "2 days ago",
    notes: "Nominee data still needs witness confirmation.",
  },
  {
    id: "DOC-204",
    title: "Health insurance policy copy",
    type: "Insurance",
    status: "Verified",
    owner: "Ravi Saba",
    updated: "5 days ago",
    notes: "Policy copies uploaded and checked against active coverage.",
  },
  {
    id: "DOC-318",
    title: "Emergency contact summary",
    type: "Life readiness",
    status: "Active",
    owner: "Family desk",
    updated: "1 week ago",
    notes: "Contact sheet is current and available in the emergency vault.",
  },
  {
    id: "DOC-421",
    title: "Annual investment summary",
    type: "Portfolio",
    status: "Archived",
    owner: "Wealth desk",
    updated: "3 weeks ago",
    notes: "Archived for year-end review and retention tracking.",
  },
];

const defaultForm = {
  title: "",
  type: "Legal",
  status: "Review" as DocumentEntry["status"],
  owner: "",
  notes: "",
};

export default function DocumentsPage() {
  const { isAdmin, logout } = useRavAuth();
  const [documents, setDocuments] = useState<DocumentEntry[]>(initialDocuments);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  const vaultSummary = useMemo(() => {
    const totals = {
      secure: documents.length,
      review: documents.filter((item) => item.status === "Review").length,
      active: documents.filter((item) => item.status === "Active").length,
      archived: documents.filter((item) => item.status === "Archived").length,
    };

    return [
      { label: "Secure files", value: String(totals.secure) },
      { label: "Needs review", value: String(totals.review) },
      { label: "Available", value: String(totals.active) },
      { label: "Archived", value: String(totals.archived) },
    ];
  }, [documents]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      setError("Document title is required.");
      return;
    }

    const nextDocument: DocumentEntry = {
      id: `DOC-${Math.floor(Date.now() / 1000) % 100000}`,
      title,
      type: form.type,
      status: form.status,
      owner: form.owner.trim() || "Personal vault",
      updated: "just now",
      notes: form.notes.trim() || "No additional notes recorded.",
    };

    setDocuments((current) => [nextDocument, ...current]);
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
            <p className="eyebrow accent">DOCUMENTS</p>
            <h2>
              Keep critical plans, policies, and evidence centrally protected.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Document summary">
            {vaultSummary.map((item) => (
              <div key={item.label}>
                <span className="meta-label">{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">VAULT</p>
                <h3>Secure record library</h3>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="goal-form">
              <div className="field-grid">
                <label className="field">
                  <span>Document title</span>
                  <input
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="e.g. Family trust letter"
                  />
                </label>

                <label className="field">
                  <span>Document type</span>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value,
                      }))
                    }
                  >
                    <option>Legal</option>
                    <option>Insurance</option>
                    <option>Portfolio</option>
                    <option>Life readiness</option>
                    <option>Tax</option>
                    <option>Estate</option>
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
                    placeholder="e.g. Priya Sharma"
                  />
                </label>

                <label className="field">
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as DocumentEntry["status"],
                      }))
                    }
                  >
                    <option value="Review">Review</option>
                    <option value="Verified">Verified</option>
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
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
                    placeholder="Add context around validation, retention, or matching details."
                  />
                </label>
              </div>

              {error ? <p style={{ color: "#b42318" }}>{error}</p> : null}

              <button type="submit" className="primary-btn">
                Save document
              </button>
            </form>

            <div className="goal-list compact-list" style={{ marginTop: 24 }}>
              {documents.map((document) => (
                <div className="goal-item" key={document.id}>
                  <div className="goal-topline">
                    <strong>{document.title}</strong>
                    <span
                      className={`pill ${
                        document.status === "Verified" ||
                        document.status === "Active"
                          ? "success"
                          : "neutral"
                      }`}
                    >
                      {document.status}
                    </span>
                  </div>
                  <div className="goal-details">
                    <span>{document.type}</span>
                    <span>{document.owner}</span>
                  </div>
                  <div className="goal-details" style={{ marginTop: 0 }}>
                    <span>{document.notes}</span>
                    <span>{document.updated}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">ACTIONS</p>
                <h3>Management queue</h3>
              </div>
            </div>

            <ul className="activity-list">
              <li>
                <span>
                  1. Upload final legal documents and match nominee references.
                </span>
              </li>
              <li>
                <span>
                  2. Verify policy records and renewal evidence against active
                  coverage.
                </span>
              </li>
              <li>
                <span>
                  3. Review archived documents before the end-of-quarter
                  retention pass.
                </span>
              </li>
              <li>
                <span>
                  4. Confirm emergency contacts remain reachable and current.
                </span>
              </li>
            </ul>
          </aside>
        </section>
      </main>
    </RavProtectedLayout>
  );
}
