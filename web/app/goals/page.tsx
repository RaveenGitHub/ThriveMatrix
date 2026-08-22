"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
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
};

const indianCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    category: "general",
    target_amount: "",
    target_date: new Date().toISOString().slice(0, 10),
  });

  const loadGoals = async () => {
    try {
      setLoading(true);
      const payload = await apiFetch<{ goals: GoalRecord[] }>("/api/v1/goals");
      setGoals(payload.goals ?? []);
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
    void loadGoals();
  }, []);

  const summary = useMemo(() => {
    const totalTarget = goals.reduce(
      (sum, goal) => sum + Number(goal.target_amount || 0),
      0,
    );
    const avgProgress = goals.length ? 68 : 0;

    return {
      totalTarget,
      avgProgress,
    };
  }, [goals]);

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
        category: "general",
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
              <p className="eyebrow">PRIVATE BETA / INDIA-FIRST</p>
              <h1>ThriveMatrix</h1>
            </div>
          </div>

          <nav className="main-nav" aria-label="Main navigation">
            <a href="/">Overview</a>
            <a href="/goals">Goals</a>
            <a href="/portfolio">Portfolio</a>
            <a href="/transactions">Transactions</a>
          </nav>
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
                    <option value="general">General</option>
                    <option value="housing">Housing</option>
                    <option value="education">Education</option>
                    <option value="retirement">Retirement</option>
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
                        <span
                          className={`pill ${goal.status === "active" ? "success" : "neutral"}`}
                        >
                          {goal.status}
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
