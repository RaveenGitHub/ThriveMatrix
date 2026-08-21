"use client";

import { ProtectedLayout } from "../protected-layout";

const documents = [
  {
    id: "DOC-101",
    title: "Will and nominee update",
    type: "Legal",
    status: "Review",
    updated: "2 days ago",
  },
  {
    id: "DOC-204",
    title: "Health insurance policy copy",
    type: "Insurance",
    status: "Verified",
    updated: "5 days ago",
  },
  {
    id: "DOC-318",
    title: "Emergency contact summary",
    type: "Life readiness",
    status: "Active",
    updated: "1 week ago",
  },
  {
    id: "DOC-421",
    title: "Annual investment summary",
    type: "Portfolio",
    status: "Archived",
    updated: "3 weeks ago",
  },
];

const vaultSummary = [
  { label: "Secure files", value: "24" },
  { label: "Needs review", value: "2" },
  { label: "Available", value: "18" },
  { label: "Archived", value: "4" },
];

export default function DocumentsPage() {
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
            <a href="/">Overview</a>
            <a href="/goals">Goals</a>
            <a href="/portfolio">Portfolio</a>
            <a href="/transactions">Transactions</a>
            <a href="/documents">Documents</a>
          </nav>
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

            <div className="goal-list compact-list">
              {documents.map((document) => (
                <div className="goal-item" key={document.id}>
                  <div className="goal-topline">
                    <strong>{document.title}</strong>
                    <span
                      className={`pill ${
                        document.status === "Verified" ||
                        document.status === "Active"
                          ? "success"
                          : document.status === "Review"
                            ? "neutral"
                            : "neutral"
                      }`}
                    >
                      {document.status}
                    </span>
                  </div>
                  <div className="goal-details">
                    <span>{document.type}</span>
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
    </ProtectedLayout>
  );
}
