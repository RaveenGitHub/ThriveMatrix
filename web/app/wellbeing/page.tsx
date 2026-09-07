"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

type WellbeingCheckin = {
  id: string;
  focus: string;
  status: "Stable" | "Moderate" | "High";
  energy: number;
  notes: string;
};

const initialCheckins: WellbeingCheckin[] = [
  {
    id: "WB-101",
    focus: "Recovery rhythm",
    status: "Stable",
    energy: 82,
    notes: "Sleep and downtime remain supportive and consistent.",
  },
  {
    id: "WB-204",
    focus: "Stress load",
    status: "Moderate",
    energy: 68,
    notes: "A few triggers remain, but they are manageable with a reset plan.",
  },
  {
    id: "WB-318",
    focus: "Balance posture",
    status: "High",
    energy: 55,
    notes: "Workload remains heavy and may benefit from a preventive reset.",
  },
];

const defaultForm = {
  focus: "",
  status: "Stable" as WellbeingCheckin["status"],
  energy: "",
  notes: "",
};

export default function WellbeingPage() {
  const { isAdmin, logout } = useRavAuth();
  const [checkins, setCheckins] = useState<WellbeingCheckin[]>(initialCheckins);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  const wellbeingStats = useMemo(() => {
    const averageEnergy =
      checkins.length > 0
        ? Math.round(
            checkins.reduce((sum, item) => sum + item.energy, 0) /
              checkins.length,
          )
        : 0;
    const highCount = checkins.filter((item) => item.status === "High").length;

    return [
      {
        title: "Resilience score",
        value: `${Math.max(75, averageEnergy)}%`,
        detail: "Your current resilience is strong enough to absorb moderate stress without disruption.",
      },
      {
        title: "Recovery rhythm",
        value: averageEnergy > 70 ? "Healthy" : "Monitor",
        detail: "Recovery patterns remain supportive and consistent with daily demands.",
      },
      {
        title: "Stress load",
        value: highCount > 0 ? "Moderate" : "Stable",
        detail: "Stress is manageable, but a steady review still matters for sustainability.",
      },
      {
        title: "Balance posture",
        value: averageEnergy > 60 ? "Stable" : "Review",
        detail: "Work, rest, and personal responsibilities are mostly aligned with your capacity.",
      },
    ];
  }, [checkins]);

  const actions = [
    "Review the balance between work output, recover time, and personal obligations over the next cycle.",
    "Check whether stress triggers are recurring and whether small changes could reduce friction.",
    "Set a simple ritual for rest, recovery, and reflection so resilience stays sustainable.",
    "Keep one small support mechanism in place for difficult weeks or unexpected changes.",
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const focus = form.focus.trim();
    const energy = Number(form.energy);

    if (!focus || Number.isNaN(energy) || energy < 0 || energy > 100) {
      setError("Please provide a focus area and valid energy score between 0 and 100.");
      return;
    }

    const nextCheckin: WellbeingCheckin = {
      id: `WB-${Math.floor(Date.now() / 1000) % 100000}`,
      focus,
      status: form.status,
      energy,
      notes: form.notes.trim() || "No additional notes recorded.",
    };

    setCheckins((current) => [nextCheckin, ...current]);
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
            <p className="eyebrow accent">WELLBEING</p>
            <h2>
              Track resilience, recovery, and sustainable energy so life
              planning remains realistic and supportive.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Wellbeing summary">
            <div>
              <span className="meta-label">Status</span>
              <strong>{checkins.some((item) => item.status === "High") ? "Monitor" : "Stable"}</strong>
            </div>
            <div>
              <span className="meta-label">Resilience</span>
              <strong>Strong</strong>
            </div>
            <div>
              <span className="meta-label">Priority</span>
              <strong>High</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">READINESS</p>
                <h3>Wellbeing health</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {wellbeingStats.map((item) => (
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
                <h3>Next priorities</h3>
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
              <p className="eyebrow">CHECK-IN</p>
              <h3>Wellbeing tracker</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="goal-form">
            <div className="field-grid">
              <label className="field">
                <span>Focus area</span>
                <input
                  value={form.focus}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, focus: event.target.value }))
                  }
                  placeholder="e.g. Recovery rhythm"
                />
              </label>

              <label className="field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as WellbeingCheckin["status"],
                    }))
                  }
                >
                  <option value="Stable">Stable</option>
                  <option value="Moderate">Moderate</option>
                  <option value="High">High</option>
                </select>
              </label>

              <label className="field">
                <span>Energy score</span>
                <input
                  type="number"
                  value={form.energy}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, energy: event.target.value }))
                  }
                  placeholder="82"
                />
              </label>

              <label className="field field-wide">
                <span>Notes</span>
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Add context around recovery, stressors, or support actions."
                />
              </label>
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="button-row">
              <button type="submit" className="primary-btn">
                Save check-in
              </button>
            </div>
          </form>

          <div className="goal-list compact-list">
            {checkins.map((checkin) => (
              <div className="goal-item" key={checkin.id}>
                <div className="goal-topline">
                  <strong>{checkin.focus}</strong>
                  <span className="pill success">{checkin.status}</span>
                </div>
                <div className="goal-details">
                  <span>Energy: {checkin.energy}%</span>
                  <span>{checkin.notes}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </RavProtectedLayout>
  );
}
