"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../auth-context";
import { ProtectedLayout } from "../protected-layout";

type GoalRecord = {
  id: string;
  name: string;
  category: string;
  target_amount: number;
  target_currency: string;
  target_date: string;
  status: string;
  priority: string;
  owner_email?: string;
  is_default_goal?: boolean;
};

type GoalProgress = {
  goal_id: string;
  goal_name: string;
  target_amount: number;
  current_amount: number;
  percent_complete: number;
  remaining_amount: number;
  funding_gap: number;
  status: string;
};

const GOAL_CATEGORY_OPTIONS = [
  { value: "emergency_fund", label: "Emergency Fund" },
  { value: "home_purchase", label: "Home Purchase" },
  { value: "home_renovation", label: "Home Renovation" },
  { value: "child_education", label: "Child Education" },
  { value: "higher_education", label: "Higher Education" },
  { value: "marriage", label: "Marriage / Wedding" },
  { value: "retirement", label: "Retirement" },
  { value: "vehicle", label: "Vehicle Purchase" },
  { value: "travel", label: "Travel / Vacation" },
  { value: "international_travel", label: "International Travel" },
  { value: "healthcare", label: "Healthcare" },
  { value: "insurance_premium", label: "Insurance Premium" },
  { value: "parents_care", label: "Parents Care" },
  { value: "family_support", label: "Family Support" },
  { value: "business_fund", label: "Business Fund" },
  { value: "wealth_creation", label: "Wealth Creation" },
  { value: "debt_repayment", label: "Debt Repayment" },
  { value: "skill_upgrade", label: "Skill Upgrade" },
  { value: "gifting", label: "Gifting / Legacy" },
  { value: "hobby_or_leisure", label: "Hobby / Leisure" },
];

const indianCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function GoalsPage() {
  const { isAdmin, logout } = useAuth();
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [progressByGoal, setProgressByGoal] = useState<
    Record<string, GoalProgress>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "emergency_fund",
    target_amount: "",
    target_date: new Date().toISOString().slice(0, 10),
  });

  const loadGoals = async () => {
    try {
      setLoading(true);
      const payload = await apiFetch<{ goals: GoalRecord[] }>("/api/v1/goals");
      const nextGoals = payload.goals ?? [];
      setGoals(nextGoals);

      const progressEntries = await Promise.all(
        nextGoals.map(async (goal) => {
          try {
            const progress = await apiFetch<GoalProgress>(
              `/api/v1/goals/${goal.id}/progress`,
            );
            return [goal.id, progress] as const;
          } catch {
            return [goal.id, null] as const;
          }
        }),
      );

      const nextProgress: Record<string, GoalProgress> = {};
      for (const [goalId, goalProgress] of progressEntries) {
        if (goalProgress) {
          nextProgress[goalId] = goalProgress;
        }
      }
      setProgressByGoal(nextProgress);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Unable to load goals",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadGoals = async () => {
      try {
        setLoading(true);
        const payload = await apiFetch<{ goals: GoalRecord[] }>(
          "/api/v1/goals",
        );
        const nextGoals = payload.goals ?? [];

        if (!active) {
          return;
        }

        setGoals(nextGoals);

        const progressEntries = await Promise.all(
          nextGoals.map(async (goal) => {
            try {
              const progress = await apiFetch<GoalProgress>(
                `/api/v1/goals/${goal.id}/progress`,
              );
              return [goal.id, progress] as const;
            } catch {
              return [goal.id, null] as const;
            }
          }),
        );

        if (!active) {
          return;
        }

        const nextProgress: Record<string, GoalProgress> = {};
        for (const [goalId, goalProgress] of progressEntries) {
          if (goalProgress) {
            nextProgress[goalId] = goalProgress;
          }
        }
        setProgressByGoal(nextProgress);
        setError("");
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load goals",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadGoals();

    return () => {
      active = false;
    };
  }, []);

  const summary = useMemo(() => {
    const totalTarget = goals.reduce(
      (sum, goal) => sum + Number(goal.target_amount || 0),
      0,
    );
    const avgProgress = goals.length
      ? Math.round(
          goals.reduce((sum, goal) => {
            const progress = progressByGoal[goal.id]?.percent_complete ?? 0;
            return sum + progress;
          }, 0) / goals.length,
        )
      : 0;

    return {
      totalTarget,
      avgProgress,
    };
  }, [goals, progressByGoal]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    const targetAmount = Number(form.target_amount);

    if (!name || Number.isNaN(targetAmount) || targetAmount <= 0) {
      return;
    }

    try {
      await apiFetch<GoalRecord>("/api/v1/goals", {
        method: "POST",
        body: JSON.stringify({
          name,
          category: form.category,
          target_amount: targetAmount,
          target_currency: "INR",
          target_date: form.target_date,
          status: "active",
          priority: "medium",
        }),
      });

      setForm({
        name: "",
        category: "emergency_fund",
        target_amount: "",
        target_date: new Date().toISOString().slice(0, 10),
      });
      await loadGoals();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save goal",
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
            <p className="eyebrow accent">GOAL MANAGEMENT</p>
            <h2>Shape the next milestone with clear progress tracking.</h2>
          </div>

          <div className="summary-strip" aria-label="Goal summary">
            <div>
              <span className="meta-label">Target value</span>
              <strong>{indianCurrency.format(summary.totalTarget)}</strong>
            </div>
            <div>
              <span className="meta-label">Active goals</span>
              <strong>{goals.length}</strong>
            </div>
            <div>
              <span className="meta-label">Average progress</span>
              <strong>{summary.avgProgress}%</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">NEW GOAL</p>
                <h3>Add a target</h3>
              </div>
            </div>

            <form className="goal-form" onSubmit={handleSubmit}>
              <div className="field-grid">
                <label className="field">
                  <span>Goal name</span>
                  <input
                    value={form.name}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="e.g. Wedding planning"
                  />
                </label>

                <label className="field">
                  <span>Category</span>
                  <select
                    value={form.category}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        category: event.target.value,
                      }))
                    }
                  >
                    {GOAL_CATEGORY_OPTIONS.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Target amount</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={form.target_amount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        target_amount: event.target.value,
                      }))
                    }
                    placeholder="1500000"
                  />
                </label>

                <label className="field">
                  <span>Target date</span>
                  <input
                    type="date"
                    value={form.target_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        target_date: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              {error ? (
                <p style={{ color: "#b42318", marginBottom: 12 }}>{error}</p>
              ) : null}

              <button className="primary-btn" type="submit">
                Save goal
              </button>
            </form>
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">TRACKER</p>
                <h3>Progress overview</h3>
              </div>
            </div>

            <div className="goal-list compact-list">
              {loading ? (
                <div className="goal-item">Loading goals…</div>
              ) : goals.length === 0 ? (
                <div className="goal-item">
                  No goals yet. Create one to get started.
                </div>
              ) : (
                goals.map((goal) => {
                  const progress = Math.min(
                    100,
                    Number(progressByGoal[goal.id]?.percent_complete ?? 0),
                  );
                  const displayStatus =
                    progress >= 100 ? "completed" : goal.status;
                  return (
                    <div className="goal-item" key={goal.id}>
                      <div className="goal-topline">
                        <strong>{goal.name}</strong>
                        <span
                          className={`pill ${displayStatus === "completed" ? "success" : "neutral"}`}
                        >
                          {displayStatus}
                        </span>
                      </div>
                      <div className="goal-details">
                        <span>{indianCurrency.format(goal.target_amount)}</span>
                        <span>{goal.target_date}</span>
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
          </aside>
        </section>
      </main>
    </ProtectedLayout>
  );
}
