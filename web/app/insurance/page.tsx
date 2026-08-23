"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../auth-context";
import { ProtectedLayout } from "../protected-layout";

type Policy = {
  id: string;
  name: string;
  provider?: string | null;
  policy_type: string;
  coverage_amount: number;
  coverage_goal?: number;
  premium_amount: number;
  premium_gap?: number;
  coverage_gap?: number;
  progress_pct?: number;
  renewal_date?: string | null;
  premium_frequency?: string | null;
  status?: string | null;
  goal_status?: string;
};

type DashboardSummary = {
  policy_count: number;
  total_coverage: number;
  total_premium: number;
  coverage_gap: number;
  premium_gap: number;
  readiness_score: number;
};

type GapItem = {
  type: string;
  policy_id?: string | null;
  policy_name?: string | null;
  amount?: number;
  severity?: string;
};

const indianCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const defaultForm = {
  name: "",
  provider: "",
  policy_type: "health",
  coverage_amount: "",
  coverage_goal: "",
  premium_amount: "",
  premium_frequency: "yearly",
  status: "active",
  start_date: new Date().toISOString().slice(0, 10),
  end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10),
  renewal_date: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10),
};

export default function InsurancePage() {
  const { isAdmin, logout } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [dashboard, setDashboard] = useState<DashboardSummary>({
    policy_count: 0,
    total_coverage: 0,
    total_premium: 0,
    coverage_gap: 0,
    premium_gap: 0,
    readiness_score: 0,
  });
  const [gaps, setGaps] = useState<GapItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState(defaultForm);

  const loadData = async () => {
    try {
      setLoading(true);
      const [policiesResponse, dashboardResponse, gapsResponse] =
        await Promise.all([
          apiFetch<{ policies: Policy[] }>("/api/v1/insurance/policies"),
          apiFetch<DashboardSummary>("/api/v1/insurance/dashboard"),
          apiFetch<{ gaps: GapItem[] }>("/api/v1/insurance/gaps"),
        ]);

      setPolicies(policiesResponse.policies ?? []);
      setDashboard(dashboardResponse);
      setGaps(gapsResponse.gaps ?? []);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load insurance data",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const totalGoal = useMemo(
    () =>
      policies.reduce(
        (sum, policy) => sum + Number(policy.coverage_goal || 0),
        0,
      ),
    [policies],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    const coverageAmount = Number(form.coverage_amount);
    const premiumAmount = Number(form.premium_amount);
    const coverageGoal = Number(form.coverage_goal || 0);

    if (
      !name ||
      Number.isNaN(coverageAmount) ||
      Number.isNaN(premiumAmount) ||
      coverageAmount <= 0 ||
      premiumAmount <= 0
    ) {
      return;
    }

    try {
      await apiFetch("/api/v1/insurance/policies", {
        method: "POST",
        body: JSON.stringify({
          name,
          provider: form.provider.trim() || undefined,
          policy_type: form.policy_type,
          premium_amount: premiumAmount,
          coverage_amount: coverageAmount,
          coverage_goal: coverageGoal > 0 ? coverageGoal : undefined,
          premium_frequency: form.premium_frequency,
          status: form.status,
          start_date: form.start_date,
          end_date: form.end_date,
          renewal_date: form.renewal_date,
        }),
      });

      setForm(defaultForm);
      await loadData();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save policy",
      );
    }
  };

  const activeGaps = gaps.filter((item) => item.type !== "coverage_healthy");

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
            <p className="eyebrow accent">INSURANCE</p>
            <h2>
              Protect your family and plan for the risk profile you carry.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Insurance summary">
            <div>
              <span className="meta-label">Coverage</span>
              <strong>
                {indianCurrency.format(dashboard.total_coverage || 0)}
              </strong>
            </div>
            <div>
              <span className="meta-label">Coverage gap</span>
              <strong>
                {indianCurrency.format(dashboard.coverage_gap || 0)}
              </strong>
            </div>
            <div>
              <span className="meta-label">Premium gap</span>
              <strong>
                {indianCurrency.format(dashboard.premium_gap || 0)}
              </strong>
            </div>
            <div>
              <span className="meta-label">Readiness</span>
              <strong>{dashboard.readiness_score || 0}%</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">ADD POLICY</p>
                <h3>Record coverage</h3>
              </div>
            </div>

            <form className="goal-form" onSubmit={handleSubmit}>
              <div className="field-grid">
                <label className="field">
                  <span>Policy name</span>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. Travel Flex"
                  />
                </label>

                <label className="field">
                  <span>Provider</span>
                  <input
                    value={form.provider}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        provider: event.target.value,
                      }))
                    }
                    placeholder="ICICI Lombard"
                  />
                </label>

                <label className="field">
                  <span>Plan type</span>
                  <select
                    value={form.policy_type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        policy_type: event.target.value,
                      }))
                    }
                  >
                    <option value="health">Health</option>
                    <option value="life">Life</option>
                    <option value="disability">Disability</option>
                    <option value="critical_illness">Critical illness</option>
                    <option value="auto">Auto</option>
                    <option value="home">Home</option>
                    <option value="liability">Liability</option>
                  </select>
                </label>

                <label className="field">
                  <span>Coverage</span>
                  <input
                    type="number"
                    min="0"
                    value={form.coverage_amount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        coverage_amount: event.target.value,
                      }))
                    }
                    placeholder="2500000"
                  />
                </label>

                <label className="field">
                  <span>Coverage goal</span>
                  <input
                    type="number"
                    min="0"
                    value={form.coverage_goal}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        coverage_goal: event.target.value,
                      }))
                    }
                    placeholder="3000000"
                  />
                </label>

                <label className="field">
                  <span>Annual premium</span>
                  <input
                    type="number"
                    min="0"
                    value={form.premium_amount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        premium_amount: event.target.value,
                      }))
                    }
                    placeholder="15000"
                  />
                </label>

                <label className="field">
                  <span>Premium frequency</span>
                  <select
                    value={form.premium_frequency}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        premium_frequency: event.target.value,
                      }))
                    }
                  >
                    <option value="yearly">Yearly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="one_time">One-time</option>
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
                    <option value="active">Active</option>
                    <option value="renewal_due">Renewal due</option>
                    <option value="pending">Pending</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>

                <label className="field field-wide">
                  <span>Start date</span>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        start_date: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="field">
                  <span>End date</span>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        end_date: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="field field-wide">
                  <span>Renewal date</span>
                  <input
                    type="date"
                    value={form.renewal_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        renewal_date: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              {error ? (
                <p style={{ color: "#b42318", marginBottom: 12 }}>{error}</p>
              ) : null}

              <button className="primary-btn" type="submit">
                Save policy
              </button>
            </form>
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">SUMMARY</p>
                <h3>Protection overview</h3>
              </div>
            </div>

            <div className="metric-grid" style={{ marginTop: 0 }}>
              <div className="metric-card">
                <span className="metric-label">Policies</span>
                <div className="metric-value">
                  {dashboard.policy_count || policies.length}
                </div>
                <div className="metric-detail">Active insurance records</div>
              </div>
              <div className="metric-card">
                <span className="metric-label">Goal coverage</span>
                <div className="metric-value">
                  {indianCurrency.format(totalGoal)}
                </div>
                <div className="metric-detail">Current target balance</div>
              </div>
              <div className="metric-card">
                <span className="metric-label">Gap alerts</span>
                <div className="metric-value">{activeGaps.length}</div>
                <div className="metric-detail">Coverage and premium risks</div>
              </div>
              <div className="metric-card">
                <span className="metric-label">Premium paid</span>
                <div className="metric-value">
                  {indianCurrency.format(dashboard.total_premium || 0)}
                </div>
                <div className="metric-detail">Annualized premium spend</div>
              </div>
            </div>

            <div className="goal-list compact-list" style={{ marginTop: 18 }}>
              {loading ? (
                <div className="goal-item">Loading policies…</div>
              ) : policies.length === 0 ? (
                <div className="goal-item">No insurance policies yet.</div>
              ) : (
                policies.map((policy) => (
                  <div className="goal-item" key={policy.id}>
                    <div className="goal-topline">
                      <strong>{policy.name}</strong>
                      <span className="pill success">
                        {policy.status || "active"}
                      </span>
                    </div>
                    <div className="goal-details">
                      <span>{policy.policy_type}</span>
                      <span>{policy.renewal_date || "No renewal date"}</span>
                    </div>
                    <div className="goal-details">
                      <span>
                        {indianCurrency.format(policy.coverage_amount)}
                      </span>
                      <span>
                        {indianCurrency.format(policy.premium_amount)}/yr
                      </span>
                    </div>
                    <div className="goal-details">
                      <span>
                        Goal: {indianCurrency.format(policy.coverage_goal || 0)}
                      </span>
                      <span>{policy.progress_pct ?? 0}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {activeGaps.length > 0 ? (
              <div style={{ marginTop: 16 }}>
                <p className="eyebrow">GAPS</p>
                <div className="goal-list compact-list">
                  {activeGaps.slice(0, 4).map((item, index) => (
                    <div className="goal-item" key={`${item.type}-${index}`}>
                      <div className="goal-topline">
                        <strong>{item.policy_name || "Coverage risk"}</strong>
                        <span className="pill warning">{item.type}</span>
                      </div>
                      <div className="goal-details">
                        <span>{item.severity || "medium"} severity</span>
                        <span>{indianCurrency.format(item.amount ?? 0)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </aside>
        </section>
      </main>
    </ProtectedLayout>
  );
}
