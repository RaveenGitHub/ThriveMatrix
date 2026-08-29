"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ravApiFetch } from "../../lib/api";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

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

const investmentCategories = [
  { value: "equity_stocks", label: "Equity (Stocks)" },
  { value: "mutual_funds", label: "Mutual Funds" },
  { value: "fixed_deposits_fd", label: "Fixed Deposits (FD)" },
  { value: "recurring_deposits_rd", label: "Recurring Deposits (RD)" },
  { value: "public_provident_fund_ppf", label: "Public Provident Fund (PPF)" },
  {
    value: "national_pension_system_nps",
    label: "National Pension System (NPS)",
  },
  { value: "bonds_debentures", label: "Bonds & Debentures" },
  { value: "gold", label: "Gold" },
  { value: "silver", label: "Silver" },
  { value: "other_commodities", label: "Other Commodities" },
  { value: "real_estate", label: "Real Estate" },
  {
    value: "agricultural_land_farm_investment",
    label: "Agricultural Land / Farm Investment",
  },
  { value: "jewellery_precious_metals", label: "Jewellery & Precious Metals" },
  { value: "company_startup_setup", label: "Company / Startup Setup" },
  {
    value: "angel_investing_private_equity",
    label: "Angel Investing / Private Equity",
  },
  {
    value: "professional_certification_skill_investment",
    label: "Professional Certification & Skill Investment",
  },
  {
    value: "rd_initiatives_innovation_projects",
    label: "R&D Initiatives / Innovation Projects",
  },
  {
    value: "cryptocurrency_digital_assets",
    label: "Cryptocurrency & Digital Assets",
  },
  {
    value: "digital_businesses_online_assets",
    label: "Digital Businesses / Online Assets",
  },
  { value: "intellectual_property_ip", label: "Intellectual Property (IP)" },
  {
    value: "health_wellness_investment",
    label: "Health & Wellness Investment",
  },
  { value: "education_investment", label: "Education Investment" },
  {
    value: "community_charity_investment",
    label: "Community & Charity Investment",
  },
  {
    value: "sustainable_living_investments",
    label: "Sustainable Living Investments",
  },
];

const indianCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function PortfolioPage() {
  const { isAdmin, logout } = useRavAuth();
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
    asset_class: "equity_stocks",
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
        ravApiFetch<{ investments: Investment[] }>("/api/v1/investments"),
        ravApiFetch<InvestmentSummary>("/api/v1/investments/summary"),
        ravApiFetch<{ goals: GoalOption[] }>("/api/v1/goals"),
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
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [listResponse, summaryResponse, goalsResponse] =
          await Promise.all([
            ravApiFetch<{ investments: Investment[] }>("/api/v1/investments"),
            ravApiFetch<InvestmentSummary>("/api/v1/investments/summary"),
            ravApiFetch<{ goals: GoalOption[] }>("/api/v1/goals"),
          ]);

        if (!active) {
          return;
        }

        setInvestments(listResponse.investments ?? []);
        setSummary(summaryResponse);
        setGoals(goalsResponse.goals ?? []);
        setError("");
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load portfolio",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
    };
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

  const addInvestment = async () => {
    const trimmedName = form.name.trim();
    const amountInvested = Number(form.amount_invested);
    const units = Number(form.units);
    const unitValue = Number(form.unit_value);

    if (
      !trimmedName ||
      !form.asset_class.trim() ||
      !form.currency.trim() ||
      !Number.isFinite(amountInvested) ||
      amountInvested <= 0 ||
      !Number.isFinite(units) ||
      units <= 0 ||
      !Number.isFinite(unitValue) ||
      unitValue <= 0
    ) {
      setError(
        "Please enter all mandatory investment details before adding an investment.",
      );
      return;
    }

    try {
      const payload = {
        name: trimmedName,
        asset_class: form.asset_class,
        currency: form.currency,
        amount_invested: amountInvested,
        units,
        unit_value: unitValue,
        valuation_source: "manual",
        valuation_timestamp: new Date().toISOString(),
        goal_id: form.goal_id || undefined,
      };

      await ravApiFetch<Investment>("/api/v1/investments", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setError("");
      setForm({
        name: "",
        asset_class: "equity_stocks",
        currency: "INR",
        amount_invested: "",
        units: "",
        unit_value: "",
        goal_id: "",
      });
      await loadData();
    } catch (addError) {
      setError(
        addError instanceof Error
          ? addError.message
          : "Unable to add investment",
      );
    }
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
                onClick={() => void addInvestment()}
              >
                Add Investment
              </button>
            </div>

            <div className="field-grid" style={{ marginBottom: 16 }}>
              <label className="field overflow-safe">
                <span>Holding name</span>
                <input
                  className="safe-input"
                  value={form.name}
                  maxLength={160}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      name: event.target.value.slice(0, 160),
                    }))
                  }
                  placeholder="e.g. Nifty Index"
                />
              </label>

              <label className="field overflow-safe">
                <span>Asset class</span>
                <select
                  className="safe-select"
                  value={form.asset_class}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      asset_class: event.target.value,
                    }))
                  }
                >
                  {investmentCategories.map((category) => (
                    <option key={category.value} value={category.value}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="field overflow-safe">
                <span>Amount invested</span>
                <input
                  className="safe-input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  max={999999999999}
                  value={form.amount_invested}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      amount_invested: event.target.value.slice(0, 18),
                    }))
                  }
                  placeholder="250000"
                />
              </label>

              <label className="field overflow-safe">
                <span>Units</span>
                <input
                  className="safe-input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.000001"
                  max={999999999999}
                  value={form.units}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      units: event.target.value.slice(0, 18),
                    }))
                  }
                  placeholder="10"
                />
              </label>

              <label className="field overflow-safe">
                <span>Unit value</span>
                <input
                  className="safe-input"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.01"
                  max={999999999999}
                  value={form.unit_value}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      unit_value: event.target.value.slice(0, 18),
                    }))
                  }
                  placeholder="25000"
                />
              </label>

              <label className="field overflow-safe">
                <span>Linked goal</span>
                <select
                  className="safe-select"
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
    </RavProtectedLayout>
  );
}
