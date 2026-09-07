"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

type EducationPlan = {
  id: string;
  program: string;
  target: string;
  status: "Active" | "Review" | "Complete";
  amount: number;
  notes: string;
};

const initialPlans: EducationPlan[] = [
  {
    id: "EDU-101",
    program: "MBA Abroad",
    target: "United Kingdom",
    status: "Active",
    amount: 2400000,
    notes: "Application review and funding baseline are aligned still.",
  },
  {
    id: "EDU-204",
    program: "Professional certification",
    target: "Data & AI track",
    status: "Review",
    amount: 950000,
    notes: "Costs updated; final vendor shortlist still pending.",
  },
  {
    id: "EDU-318",
    program: "Child education reserve",
    target: "Future tuition reserve",
    status: "Complete",
    amount: 500000,
    notes: "Reserve remains adequate for current savings runway.",
  },
];

const defaultForm = {
  program: "",
  target: "",
  amount: "",
  status: "Active" as EducationPlan["status"],
  notes: "",
};

const indianCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function EducationPage() {
  const { isAdmin, logout } = useRavAuth();
  const [plans, setPlans] = useState<EducationPlan[]>(initialPlans);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  const educationStats = useMemo(() => {
    const activeCount = plans.filter((item) => item.status === "Active").length;
    const reviewCount = plans.filter((item) => item.status === "Review").length;
    const totalAmount = plans.reduce((sum, item) => sum + item.amount, 0);

    return [
      {
        title: "Education readiness",
        value: `${Math.max(70, 72 + activeCount - reviewCount)}%`,
        detail: "The current funding path remains on a stable upward curve.",
      },
      {
        title: "Target corpus",
        value: indianCurrency.format(totalAmount),
        detail:
          "The plan remains aligned to expected academic horizon and cost assumptions.",
      },
      {
        title: "Monthly allocation",
        value: indianCurrency.format(Math.round(totalAmount / 24)),
        detail:
          "Contribution pace remains strong and consistent with the current path.",
      },
      {
        title: "Risk buffer",
        value: reviewCount > 0 ? "Monitor" : "Healthy",
        detail:
          "Funding resilience remains adequate for strategy shifts or delays.",
      },
    ];
  }, [plans]);

  const actions = [
    "Validate education cost assumptions against inflation and location changes.",
    "Review whether the funding schedule still reflects the target priority level.",
    "Check if there are any deferrals or alternative study paths that should be tracked.",
    "Adjust the contribution pattern if external commitments are likely to shift.",
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const program = form.program.trim();
    const target = form.target.trim();
    const amount = Number(form.amount);

    if (!program || !target || Number.isNaN(amount) || amount <= 0) {
      setError("Program name, target, and a valid amount are required.");
      return;
    }

    const nextPlan: EducationPlan = {
      id: `EDU-${Math.floor(Date.now() / 1000) % 100000}`,
      program,
      target,
      status: form.status,
      amount,
      notes: form.notes.trim() || "No additional notes recorded.",
    };

    setPlans((current) => [nextPlan, ...current]);
    setForm(defaultForm);
    setError("");
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
            <p className="eyebrow accent">EDUCATION</p>
            <h2>
              Track funding momentum, cost readiness, and future-study
              flexibility.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Education summary">
            <div>
              <span className="meta-label">Momentum</span>
              <strong>
                {plans.some((item) => item.status === "Active")
                  ? "Steady"
                  : "Setup"}
              </strong>
            </div>
            <div>
              <span className="meta-label">Funding</span>
              <strong>
                {plans.some((item) => item.status === "Review")
                  ? "Monitor"
                  : "Planned"}
              </strong>
            </div>
            <div>
              <span className="meta-label">Priority</span>
              <strong>{plans.length > 1 ? "High" : "Normal"}</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">READINESS</p>
                <h3>Education fuel</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {educationStats.map((item) => (
                <div className="insight-box" key={item.title}>
                  <span>{item.title}</span>
                  <strong>{item.value}</strong>
                  <small>{item.detail}</small>
                </div>
              ))}
            </div>
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">ACTIONS</p>
                <h3>Focus queue</h3>
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

        <section className="panel bottom-grid">
          <div className="section-head">
            <div>
              <p className="eyebrow">PLAN</p>
              <h3>Funding and study roadmap</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="goal-form">
            <div className="field-grid">
              <label className="field">
                <span>Program</span>
                <input
                  value={form.program}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      program: event.target.value,
                    }))
                  }
                  placeholder="e.g. MBA Abroad"
                />
              </label>

              <label className="field">
                <span>Target</span>
                <input
                  value={form.target}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      target: event.target.value,
                    }))
                  }
                  placeholder="e.g. United Kingdom"
                />
              </label>

              <label className="field">
                <span>Amount</span>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                  placeholder="2500000"
                />
              </label>

              <label className="field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as EducationPlan["status"],
                    }))
                  }
                >
                  <option value="Active">Active</option>
                  <option value="Review">Review</option>
                  <option value="Complete">Complete</option>
                </select>
              </label>

              <label className="field field-wide">
                <span>Notes</span>
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      notes: event.target.value,
                    }))
                  }
                  placeholder="Add context around funding strategy, timeline, or contingencies."
                />
              </label>
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="button-row">
              <button type="submit" className="primary-btn">
                Save plan
              </button>
            </div>
          </form>

          <div className="goal-list compact-list">
            {plans.map((plan) => (
              <div className="goal-item" key={plan.id}>
                <div className="goal-topline">
                  <strong>{plan.program}</strong>
                  <span className="pill success">{plan.status}</span>
                </div>
                <div className="goal-details">
                  <span>{plan.target}</span>
                  <span>{indianCurrency.format(plan.amount)}</span>
                  <span>{plan.notes}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </RavProtectedLayout>
  );
}
