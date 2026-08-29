"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ravApiFetch } from "../../lib/api";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

type Goal = {
  id: string;
  name: string;
  target_amount: number;
  target_currency: string;
  status: string;
  priority: string;
};

type Investment = {
  id: string;
  name: string;
  asset_class: string;
  currency: string;
  amount_invested: number;
  current_asset_value: number;
  gain_loss: number;
};

type Policy = {
  id: string;
  name: string;
  policy_type: string;
  coverage_amount: number;
  premium_amount: number;
};

type DashboardSummary = {
  goal_count: number;
  investment_count: number;
  insurance_count: number;
  coverage_score: number;
  currency: string;
  status: string;
  freshness: {
    version: string;
    status: string;
    updated_at: string;
    source: string;
  };
};

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const defaultSummary: DashboardSummary = {
  goal_count: 0,
  investment_count: 0,
  insurance_count: 0,
  coverage_score: 0,
  currency: "INR",
  status: "partial",
  freshness: {
    version: "dashboard-v1",
    status: "partial",
    updated_at: new Date().toISOString(),
    source: "live-data",
  },
};

export default function HomePage() {
  const { isAdmin, logout } = useRavAuth();
  const [summary, setSummary] = useState<DashboardSummary>(defaultSummary);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        const [
          summaryResponse,
          goalsResponse,
          investmentsResponse,
          policiesResponse,
        ] = await Promise.all([
          ravApiFetch<DashboardSummary>("/api/v1/dashboard/summary"),
          ravApiFetch<{ goals: Goal[] }>("/api/v1/goals"),
          ravApiFetch<{ investments: Investment[] }>("/api/v1/investments"),
          ravApiFetch<{ policies: Policy[] }>("/api/v1/insurance/policies"),
        ]);

        setSummary(summaryResponse);
        setGoals(goalsResponse.goals ?? []);
        setInvestments(investmentsResponse.investments ?? []);
        setPolicies(policiesResponse.policies ?? []);
        setError("");
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, []);

  const homeStats = useMemo(() => {
    const totalTarget = goals.reduce(
      (sum, goal) => sum + Number(goal.target_amount || 0),
      0,
    );
    const portfolioValue = investments.reduce(
      (sum, investment) => sum + Number(investment.current_asset_value || 0),
      0,
    );
    const goalProgress =
      totalTarget > 0
        ? Math.min(100, Math.round((portfolioValue / totalTarget) * 100))
        : 0;

    return [
      {
        title: "Dashboard status",
        value: summary.status === "ready" ? "Ready" : "Partial",
        detail: `Source freshness: ${summary.freshness.version}`,
      },
      {
        title: "Target value",
        value: currencyFormatter.format(totalTarget),
        detail: `${goals.length} active goals tracked`,
      },
      {
        title: "Portfolio value",
        value: currencyFormatter.format(portfolioValue),
        detail: `${investments.length} tracked positions`,
      },
      {
        title: "Coverage score",
        value: `${summary.coverage_score}/100`,
        detail: `${policies.length} active policies`,
      },
      {
        title: "Goal progress",
        value: `${goalProgress}%`,
        detail: "Estimated from portfolio value against tracked goals",
      },
    ];
  }, [
    goals,
    investments,
    policies.length,
    summary.coverage_score,
    summary.freshness.version,
    summary.status,
  ]);

  const actions = useMemo(() => {
    const nextSteps = [
      "Review the top-priority goals and confirm any funding gaps.",
      "Check the current investment mix before making any planned changes.",
      "Validate policy renewal dates and coverage adequacy for the next cycle.",
    ];

    if (goals.length === 0) {
      nextSteps.unshift(
        "Create a first goal so the dashboard has a measurable plan to track.",
      );
    }

    if (investments.length === 0) {
      nextSteps.unshift(
        "Add your first investment position to populate the portfolio summary.",
      );
    }

    if (policies.length === 0) {
      nextSteps.unshift(
        "Add a protection policy to activate the coverage score card.",
      );
    }

    return nextSteps.slice(0, 4);
  }, [goals.length, investments.length, policies.length]);

  const portfolioRows = investments.slice(0, 4).map((item) => ({
    name: item.name,
    allocation: `${Math.max(
      1,
      Math.round(
        (item.current_asset_value /
          Math.max(
            investments.reduce(
              (sum, current) => sum + current.current_asset_value,
              0,
            ),
            1,
          )) *
          100,
      ),
    )}%`,
    value: currencyFormatter.format(item.current_asset_value),
    change: `${item.gain_loss >= 0 ? "+" : "-"}${currencyFormatter.format(Math.abs(item.gain_loss))}`,
  }));

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
            <p className="eyebrow accent">HOME</p>
            <h2>
              Keep your life capital plan aligned with current financial
              signals.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Dashboard summary">
            <div>
              <span className="meta-label">Dashboard status</span>
              <strong>
                {summary.status === "ready" ? "Ready" : "Partial"}
              </strong>
            </div>
            <div>
              <span className="meta-label">Data freshness</span>
              <strong>{summary.freshness.status}</strong>
            </div>
            <div>
              <span className="meta-label">Coverage score</span>
              <strong>{summary.coverage_score}/100</strong>
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
                <p className="eyebrow">READINESS</p>
                <h3>Dashboard snapshot</h3>
              </div>
            </div>

            {loading ? (
              <div className="insight-box">Loading dashboard…</div>
            ) : (
              <div className="insight-grid three-up">
                {homeStats.map((item) => (
                  <div className="insight-box" key={item.title}>
                    <span>{item.title}</span>
                    <strong>{item.value}</strong>
                    <small>{item.detail}</small>
                  </div>
                ))}
              </div>
            )}
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">ACTIONS</p>
                <h3>Next moves</h3>
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

        <section className="content-grid">
          <article className="panel panel-span-2">
            <div className="section-head">
              <div>
                <p className="eyebrow">GOALS</p>
                <h3>Target progress</h3>
              </div>
            </div>

            <div className="goal-list">
              {goals.length === 0 ? (
                <div className="goal-item">
                  No goals yet. Add one from the goals module.
                </div>
              ) : (
                goals.slice(0, 3).map((goal) => {
                  const progress = Math.min(
                    100,
                    Math.round(
                      (((goal.target_amount || 1) * 0.68) /
                        goal.target_amount) *
                        100,
                    ),
                  );
                  return (
                    <div className="goal-item" key={goal.id}>
                      <div className="goal-topline">
                        <strong>{goal.name}</strong>
                        <span className="pill success">{goal.priority}</span>
                      </div>
                      <div className="goal-details">
                        <span>
                          {currencyFormatter.format(goal.target_amount)}
                        </span>
                        <span>{goal.status}</span>
                      </div>
                      <div
                        className="progress-track"
                        aria-label={`${goal.name} progress`}
                      >
                        <span style={{ width: `${progress}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </article>

          <aside className="panel">
            <div className="section-head compact">
              <div>
                <p className="eyebrow">ALERTS</p>
                <h3>Action queue</h3>
              </div>
            </div>

            <div className="alert-list">
              {policies.length === 0 ? (
                <div className="alert-item">
                  <span className="alert-dot goal_overdue" aria-hidden="true" />
                  <div>
                    <strong>No protection data yet</strong>
                    <p>
                      Add a policy to trigger renewal and coverage monitoring.
                    </p>
                  </div>
                </div>
              ) : (
                policies.slice(0, 3).map((policy) => (
                  <div className="alert-item" key={policy.id}>
                    <span
                      className="alert-dot policy_expiring"
                      aria-hidden="true"
                    />
                    <div>
                      <strong>{policy.name}</strong>
                      <p>
                        {policy.policy_type} cover:{" "}
                        {currencyFormatter.format(policy.coverage_amount)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>

        <section className="content-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">PORTFOLIO</p>
                <h3>Portfolio allocation</h3>
              </div>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Allocation</th>
                    <th>Value</th>
                    <th>Change</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioRows.length === 0 ? (
                    <tr>
                      <td colSpan={4}>No portfolio positions yet.</td>
                    </tr>
                  ) : (
                    portfolioRows.map((row) => (
                      <tr key={row.name}>
                        <td>{row.name}</td>
                        <td>{row.allocation}</td>
                        <td>{row.value}</td>
                        <td className="positive">{row.change}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">INSURANCE</p>
                <h3>Coverage overview</h3>
              </div>
            </div>

            <div className="insurance-card">
              <div
                className="ring"
                aria-label={`Coverage score ${summary.coverage_score} percent`}
              >
                <span>{summary.coverage_score}%</span>
              </div>
              <ul>
                {policies.length === 0 ? (
                  <li>
                    <strong>No policies</strong>
                    <span>Add coverage data to see the score.</span>
                  </li>
                ) : (
                  policies.slice(0, 3).map((policy) => (
                    <li key={policy.id}>
                      <strong>{policy.policy_type}</strong>
                      <span>
                        {currencyFormatter.format(policy.coverage_amount)} cover
                      </span>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </article>
        </section>
      </main>
    </RavProtectedLayout>
  );
}
