"use client";

import { FormEvent, useState } from "react";

type DomainRecord = {
  id: number;
  category: "Health" | "Legal" | "Relationships" | "Readiness";
  title: string;
  status: "Ready" | "Review" | "Needs action";
  detail: string;
};

const defaultRecords: DomainRecord[] = [
  {
    id: 1,
    category: "Health",
    title: "Annual check-up",
    status: "Ready",
    detail: "Routine review scheduled for next quarter.",
  },
  {
    id: 2,
    category: "Legal",
    title: "Will and nominee update",
    status: "Review",
    detail: "Nominee details need to be revalidated.",
  },
  {
    id: 3,
    category: "Relationships",
    title: "Family circle sync",
    status: "Ready",
    detail: "Important contacts are current and reachable.",
  },
  {
    id: 4,
    category: "Readiness",
    title: "Emergency pack list",
    status: "Needs action",
    detail: "A few contingencies still require confirmation.",
  },
];

export default function DomainsPage() {
  const [records, setRecords] = useState<DomainRecord[]>(defaultRecords);

  const [form, setForm] = useState({
    category: "Health" as DomainRecord["category"],
    title: "",
    status: "Ready" as DomainRecord["status"],
    detail: "",
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    const detail = form.detail.trim();

    if (!title || !detail) {
      return;
    }

    setRecords((current) => [
      {
        id: Date.now(),
        category: form.category,
        title,
        status: form.status,
        detail,
      },
      ...current,
    ]);

    setForm({
      category: "Health",
      title: "",
      status: "Ready",
      detail: "",
    });
  };

  const counts = {
    Health: records.filter((record) => record.category === "Health").length,
    Legal: records.filter((record) => record.category === "Legal").length,
    Relationships: records.filter(
      (record) => record.category === "Relationships",
    ).length,
    Readiness: records.filter((record) => record.category === "Readiness")
      .length,
  };

  return (
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
          <a href="/domains">Domains</a>
        </nav>
      </header>

      <section className="feature-header panel">
        <div>
          <p className="eyebrow accent">LIFE DOMAINS</p>
          <h2>Keep health, legal, relationships, and readiness in sync.</h2>
        </div>

        <div className="summary-strip" aria-label="Life domain summary">
          <div>
            <span className="meta-label">Health</span>
            <strong>{counts.Health}</strong>
          </div>
          <div>
            <span className="meta-label">Legal</span>
            <strong>{counts.Legal}</strong>
          </div>
          <div>
            <span className="meta-label">Readiness</span>
            <strong>{counts.Readiness}</strong>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <article className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">ADD ITEM</p>
              <h3>Domain checklist</h3>
            </div>
          </div>

          <form className="goal-form" onSubmit={handleSubmit}>
            <div className="field-grid">
              <label className="field">
                <span>Domain</span>
                <select
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value as DomainRecord["category"],
                    }))
                  }
                >
                  <option value="Health">Health</option>
                  <option value="Legal">Legal</option>
                  <option value="Relationships">Relationships</option>
                  <option value="Readiness">Readiness</option>
                </select>
              </label>

              <label className="field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as DomainRecord["status"],
                    }))
                  }
                >
                  <option value="Ready">Ready</option>
                  <option value="Review">Review</option>
                  <option value="Needs action">Needs action</option>
                </select>
              </label>

              <label className="field field-wide">
                <span>Title</span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
                    }))
                  }
                  placeholder="Annual documentation review"
                />
              </label>

              <label className="field field-wide">
                <span>Details</span>
                <textarea
                  value={form.detail}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      detail: event.target.value,
                    }))
                  }
                  placeholder="Brief note on the action or current standing"
                  rows={4}
                />
              </label>
            </div>

            <button className="primary-btn" type="submit">
              Save domain item
            </button>
          </form>
        </article>

        <aside className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">RECORDS</p>
              <h3>Latest checklist</h3>
            </div>
          </div>

          <div className="goal-list compact-list">
            {records.map((record) => (
              <div className="goal-item" key={record.id}>
                <div className="goal-topline">
                  <strong>{record.title}</strong>
                  <span
                    className={`pill ${record.status === "Ready" ? "success" : record.status === "Review" ? "neutral" : "neutral"}`}
                  >
                    {record.status}
                  </span>
                </div>
                <div className="goal-details">
                  <span>{record.category}</span>
                  <span>{record.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
