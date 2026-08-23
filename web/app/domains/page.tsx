"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../auth-context";
import { ProtectedLayout } from "../protected-layout";

type DomainSummaryResponse = {
  status: string;
  domains: {
    health: { count: number; status: string };
    legal: { count: number; status: string };
    relationships: { count: number; status: string };
    readiness: { count: number; status: string };
  };
};

type DomainRecord = {
  id: string;
  category: string;
  title: string;
  status: string;
  notes: string;
};

export default function DomainsPage() {
  const { isAdmin, logout } = useAuth();
  const [summary, setSummary] = useState<DomainSummaryResponse | null>(null);
  const [healthRecords, setHealthRecords] = useState<DomainRecord[]>([]);
  const [legalContacts, setLegalContacts] = useState<DomainRecord[]>([]);
  const [relationshipRecords, setRelationshipRecords] = useState<
    DomainRecord[]
  >([]);
  const [readinessItems, setReadinessItems] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    category: "Health",
    title: "",
    status: "Ready",
    notes: "",
  });

  const loadDomains = async () => {
    try {
      setLoading(true);
      const [
        summaryResponse,
        healthResponse,
        legalResponse,
        relationshipsResponse,
        readinessResponse,
      ] = await Promise.all([
        apiFetch<DomainSummaryResponse>("/api/v1/domains/summary"),
        apiFetch<{ records: DomainRecord[] }>("/api/v1/health/records"),
        apiFetch<{
          contacts: Array<{
            id: string;
            name: string;
            relationship: string;
            phone: string;
            email: string;
          }>;
        }>("/api/v1/legal/emergency-contacts"),
        apiFetch<{ records: DomainRecord[] }>("/api/v1/relationships/records"),
        apiFetch<{ items: DomainRecord[] }>("/api/v1/readiness/items"),
      ]);

      setSummary(summaryResponse);
      setHealthRecords(healthResponse.records ?? []);
      setLegalContacts(
        (legalResponse.contacts ?? []).map((contact) => ({
          id: contact.id,
          category: "Legal",
          title: contact.name,
          status: "Ready",
          notes: `${contact.relationship} • ${contact.phone}`,
        })),
      );
      setRelationshipRecords(relationshipsResponse.records ?? []);
      setReadinessItems(readinessResponse.items ?? []);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load domain summary",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadDomains();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.title.trim() || !form.notes.trim()) {
      return;
    }

    try {
      const endpointMap: Record<string, string> = {
        Health: "/api/v1/health/records",
        Legal: "/api/v1/legal/emergency-contacts",
        Relationships: "/api/v1/relationships/records",
        Readiness: "/api/v1/readiness/items",
      };

      const payloadMap: Record<string, object> = {
        Health: {
          record_type: form.title,
          date: new Date().toISOString().slice(0, 10),
          value: form.status,
          notes: form.notes,
        },
        Legal: {
          name: form.title,
          relationship: "contact",
          phone: "0000000000",
          email: "contact@example.com",
        },
        Relationships: {
          category: form.title,
          name: form.title,
          status: form.status,
          notes: form.notes,
        },
        Readiness: {
          category: form.title,
          title: form.title,
          status: form.status,
          notes: form.notes,
        },
      };

      await apiFetch(endpointMap[form.category], {
        method: "POST",
        body: JSON.stringify(payloadMap[form.category]),
      });

      setForm({ category: "Health", title: "", status: "Ready", notes: "" });
      await loadDomains();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save domain item",
      );
    }
  };

  const counts = useMemo(
    () => ({
      Health: summary?.domains.health.count ?? healthRecords.length,
      Legal: summary?.domains.legal.count ?? legalContacts.length,
      Relationships:
        summary?.domains.relationships.count ?? relationshipRecords.length,
      Readiness: summary?.domains.readiness.count ?? readinessItems.length,
    }),
    [
      healthRecords.length,
      legalContacts.length,
      relationshipRecords.length,
      readinessItems.length,
      summary,
    ],
  );

  const recordList = [
    ...healthRecords.map((record) => ({ ...record, category: "Health" })),
    ...legalContacts,
    ...relationshipRecords.map((record) => ({
      ...record,
      category: "Relationships",
    })),
    ...readinessItems.map((item) => ({ ...item, category: "Readiness" })),
  ];

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

        {error ? (
          <section className="panel" style={{ marginBottom: 24 }}>
            <p style={{ color: "#b42318" }}>{error}</p>
          </section>
        ) : null}

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
                        category: event.target.value,
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
                        status: event.target.value,
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
                    value={form.notes}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        notes: event.target.value,
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
              {loading ? (
                <div className="goal-item">Loading domain records…</div>
              ) : recordList.length === 0 ? (
                <div className="goal-item">No domain records yet.</div>
              ) : (
                recordList.slice(0, 8).map((record, index) => (
                  <div
                    className="goal-item"
                    key={`${record.category}-${record.id ?? index}`}
                  >
                    <div className="goal-topline">
                      <strong>{record.title}</strong>
                      <span
                        className={`pill ${record.status === "Ready" ? "success" : "neutral"}`}
                      >
                        {record.status}
                      </span>
                    </div>
                    <div className="goal-details">
                      <span>{record.category}</span>
                      <span>{record.notes}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>
      </main>
    </ProtectedLayout>
  );
}
