"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../auth-context";
import { ProtectedLayout } from "../protected-layout";

type Investment = {
  id: string;
  name: string;
  asset_class: string;
  currency: string;
  amount_invested: number;
  units: number;
  unit_value: number;
  current_asset_value: number;
  gain_loss: number;
  goal_id?: string | null;
};

type GoalOption = {
  id: string;
  name: string;
  status: string;
  is_default_goal?: boolean;
};

type InvestmentSummary = {
  total_invested: number;
  current_value: number;
  gain_loss: number;
};

const indianCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function PortfolioPage() {
  const { isAdmin, logout } = useAuth();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [goals, setGoals] = useState<GoalOption[]>([]);
  const [summary, setSummary] = useState<InvestmentSummary>({
    total_invested: 0,
    current_value: 0,
    gain_loss: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    asset_class: "equity",
    currency: "INR",
    amount_invested: "",
    units: "",
    unit_value: "",
    goal_id: "",
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [listResponse, summaryResponse, goalsResponse] = await Promise.all([
        apiFetch<{ investments: Investment[] }>("/api/v1/investments"),
        apiFetch<InvestmentSummary>("/api/v1/investments/summary"),
        apiFetch<{ goals: GoalOption[] }>("/api/v1/goals"),
      ]);
      setInvestments(listResponse.investments ?? []);
      setSummary(summaryResponse);
      setGoals(goalsResponse.goals ?? []);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load portfolio",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const totalAllocation = useMemo(() => {
    if (!investments.length) return 0;
    return investments.reduce(
      (sum, item) =>
        sum +
        Math.min(
          100,
          Math.round(
            (item.current_asset_value / Math.max(summary.current_value, 1)) *
              100,
          ),
        ),
      0,
    );
  }, [investments, summary.current_value]);

  const addSampleHolding = async () => {
    try {
      const payload = {
        name: form.name.trim() || "Sovereign Gold Bond",
        asset_class: form.asset_class,
        currency: "INR",
        amount_invested: Number(form.amount_invested || 290000),
        units: Number(form.units || 12),
        unit_value: Number(form.unit_value || 24000),
        valuation_source: "manual",
        valuation_timestamp: new Date().toISOString(),
        goal_id: form.goal_id || undefined,
      };

      await apiFetch<Investment>("/api/v1/investments", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setForm({
        name: "",
        asset_class: "equity",
        currency: "INR",
        amount_invested: "",
        units: "",
        unit_value: "",
        goal_id: "",
      });
      await loadData();
    } catch (addError) {
      setError(
        addError instanceof Error ? addError.message : "Unable to add holding",
      );
    }
  };

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
            <p className="eyebrow accent">PORTFOLIO</p>
            <h2>Monitor allocation, gains, and balance by asset class.</h2>
          </div>

          <div className="summary-strip" aria-label="Portfolio summary">
            <div>
              <span className="meta-label">Total value</span>
              <strong>{indianCurrency.format(summary.current_value)}</strong>
            </div>
            <div>
              <span className="meta-label">Allocation mix</span>
              <strong>{totalAllocation}%</strong>
            </div>
            <div>
              <span className="meta-label">Weighted gain</span>
              <strong>{indianCurrency.format(summary.gain_loss)}</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">ASSET MIX</p>
                <h3>Allocation snapshot</h3>
              </div>
              <button
                className="ghost-btn"
                type="button"
                onClick={addSampleHolding}
              >
                + Add holding
              </button>
            </div>

            <div className="field-grid" style={{ marginBottom: 16 }}>
              <label className="field">
                <span>Holding name</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="e.g. Nifty Index"
                />
              </label>

              <label className="field">
                <span>Asset class</span>
                <select
                  value={form.asset_class}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      asset_class: event.target.value,
                    }))
                  }
                >
                  <option value="equity">Equity</option>
                  <option value="debt">Debt</option>
                  <option value="commodity">Commodity</option>
                  <option value="cash">Cash</option>
                </select>
              </label>

              <label className="field">
                <span>Amount invested</span>
                <input
                  type="number"
                  value={form.amount_invested}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      amount_invested: event.target.value,
                    }))
                  }
                  placeholder="250000"
                />
              </label>

              <label className="field">
                <span>Units</span>
                <input
                  type="number"
                  value={form.units}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      units: event.target.value,
                    }))
                  }
                  placeholder="10"
                />
              </label>

              <label className="field">
                <span>Unit value</span>
                <input
                  type="number"
                  value={form.unit_value}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      unit_value: event.target.value,
                    }))
                  }
                  placeholder="25000"
                />
              </label>

              <label className="field">
                <span>Linked goal</span>
                <select
                  value={form.goal_id}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      goal_id: event.target.value,
                    }))
                  }
                >
                  <option value="">NoGoalAssigned</option>
                  {goals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {error ? (
              <p style={{ color: "#b42318", marginBottom: 12 }}>{error}</p>
            ) : null}

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Category</th>
                    <th>Value</th>
                    <th>Gain/Loss</th>
                    <th>Invested</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5}>Loading investments…</td>
                    </tr>
                  ) : investments.length === 0 ? (
                    <tr>
                      <td colSpan={5}>No investments yet.</td>
                    </tr>
                  ) : (
                    investments.map((investment) => (
                      <tr key={investment.id}>
                        <td>{investment.name}</td>
                        <td>{investment.asset_class}</td>
                        <td>
                          {indianCurrency.format(
                            investment.current_asset_value,
                          )}
                        </td>
                        <td
                          className={
                            investment.gain_loss >= 0 ? "positive" : ""
                          }
                        >
                          {investment.gain_loss >= 0 ? "+" : "-"}
                          {indianCurrency.format(
                            Math.abs(investment.gain_loss),
                          )}
                        </td>
                        <td>
                          {indianCurrency.format(investment.amount_invested)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">PROFILE</p>
                <h3>Portfolio posture</h3>
              </div>
            </div>

            <div className="insight-grid single-column">
              <div className="insight-box">
                <span>Risk balance</span>
                <strong>Moderate</strong>
                <small>
                  Mix remains steady with a slight tilt to core wealth holdings.
                </small>
              </div>
              <div className="insight-box">
                <span>Liquidity</span>
                <strong>Healthy</strong>
                <small>
                  Cash and short-term debt align with planned near-term
                  commitments.
                </small>
              </div>
              <div className="insight-box">
                <span>Performance belt</span>
                <strong>
                  {summary.gain_loss >= 0 ? "Up" : "Down"}{" "}
                  {indianCurrency.format(Math.abs(summary.gain_loss))}
                </strong>
                <small>
                  YTD trend benchmarked against the current tracked holdings.
                </small>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </ProtectedLayout>
  );
}
