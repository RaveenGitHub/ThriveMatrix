"use client";

import { FormEvent, useMemo, useState } from "react";
import { ProtectedLayout } from "../protected-layout";

type GoalRecord = {
  id: number;
  name: string;
  target: number;
  current: number;
  status: "On track" | "At risk" | "Priority";
};

const defaultGoals: GoalRecord[] = [
  {
    id: 1,
    name: "Emergency Fund",
    target: 400000,
    current: 312000,
    status: "On track",
  },
  {
    id: 2,
    name: "Home Purchase",
    target: 1800000,
    current: 960000,
    status: "Priority",
  },
  {
    id: 3,
    name: "Child Education",
    target: 1200000,
    current: 840000,
    status: "At risk",
  },
];

const indianCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function GoalsPage() {
  const [goals, setGoals] = useState<GoalRecord[]>(defaultGoals);
  const [form, setForm] = useState({
    name: "",
    target: "",
    current: "",
    status: "On track" as GoalRecord["status"],
  });

  const summary = useMemo(() => {
    const totalTarget = goals.reduce((sum, goal) => sum + goal.target, 0);
    const totalCurrent = goals.reduce((sum, goal) => sum + goal.current, 0);
    const avgProgress = goals.length
      ? Math.round((totalCurrent / totalTarget) * 100)
      : 0;

    return {
      totalTarget,
      totalCurrent,
      avgProgress,
    };
  }, [goals]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    const target = Number(form.target);
    const current = Number(form.current);

    if (
      !name ||
      Number.isNaN(target) ||
      Number.isNaN(current) ||
      target <= 0 ||
      current < 0
    ) {
      return;
    }

    setGoals((existing) => [
      {
        id: Date.now(),
        name,
        target,
        current,
        status: form.status,
      },
      ...existing,
    ]);

    setForm({
      name: "",
      target: "",
      current: "",
      status: "On track",
    });
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
            <a href="#">Portfolio</a>
            <a href="#">Transactions</a>
          </nav>
        </header>

        <section className="feature-header panel">
          <div>
            <p className="eyebrow accent">GOAL MANAGEMENT</p>
            <h2>Shape the next milestone with clear progress tracking.</h2>
          </div>

          <div className="summary-strip" aria-label="Goal summary">
            <div>
              <span className="meta-label">Portfolio goal value</span>
              <strong>{indianCurrency.format(summary.totalCurrent)}</strong>
            </div>
            <div>
              <span className="meta-label">Target value</span>
              <strong>{indianCurrency.format(summary.totalTarget)}</strong>
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
                  <span>Target amount</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={form.target}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        target: event.target.value,
                      }))
                    }
                    placeholder="1500000"
                  />
                </label>

                <label className="field">
                  <span>Current savings</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min="0"
                    value={form.current}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        current: event.target.value,
                      }))
                    }
                    placeholder="650000"
                  />
                </label>

                <label className="field">
                  <span>Status</span>
                  <select
                    value={form.status}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        status: event.target.value as GoalRecord["status"],
                      }))
                    }
                  >
                    <option value="On track">On track</option>
                    <option value="Priority">Priority</option>
                    <option value="At risk">At risk</option>
                  </select>
                </label>
              </div>

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
              {goals.map((goal) => {
                const progress = Math.min(
                  100,
                  Math.round((goal.current / goal.target) * 100),
                );
                return (
                  <div className="goal-item" key={goal.id}>
                    <div className="goal-topline">
                      <strong>{goal.name}</strong>
                      <span
                        className={`pill ${goal.status === "On track" ? "success" : "neutral"}`}
                      >
                        {goal.status}
                      </span>
                    </div>
                    <div className="goal-details">
                      <span>{indianCurrency.format(goal.current)}</span>
                      <span>of {indianCurrency.format(goal.target)}</span>
                    </div>
                    <div
                      className="progress-track"
                      aria-label={`${goal.name} progress`}
                    >
                      <span style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </section>
      </main>
    </ProtectedLayout>
  );
}
