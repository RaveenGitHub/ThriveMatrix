"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

type FoundationControl = {
  id: string;
  name: string;
  status: "Stable" | "Enabled" | "Controlled" | "Tracked";
  owner: string;
  detail: string;
};

const initialControls: FoundationControl[] = [
  {
    id: "FND-101",
    name: "Runtime contracts",
    status: "Stable",
    owner: "Platform",
    detail: "Python and Node toolchains are pinned and validated before deployment.",
  },
  {
    id: "FND-204",
    name: "CI validation",
    status: "Enabled",
    owner: "Release",
    detail: "Core checks run before moving work across the delivery pipeline.",
  },
  {
    id: "FND-318",
    name: "Secrets handling",
    status: "Controlled",
    owner: "Security",
    detail: "Sensitive values remain local and out of repo or runtime logs.",
  },
];

const defaultForm = {
  name: "",
  owner: "",
  status: "Stable" as FoundationControl["status"],
  detail: "",
};

export default function FoundationPage() {
  const { isAdmin, logout } = useRavAuth();
  const [controls, setControls] = useState<FoundationControl[]>(initialControls);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  const foundationStats = useMemo(() => {
    const stableCount = controls.filter((item) => item.status === "Stable").length;
    const enabledCount = controls.filter((item) => item.status === "Enabled").length;

    return [
      {
        title: "Runtime baseline",
        value: stableCount > 0 ? "Ready" : "Setup",
        detail: "The local stack is documented and aligned to the approved Python and Node runtime constraints.",
      },
      {
        title: "Delivery controls",
        value: enabledCount > 0 ? "Active" : "Paused",
        detail: "Build, lint, and validation paths are part of the working delivery process.",
      },
      {
        title: "Contract quality",
        value: "Versioned",
        detail: "API behavior and configuration rules remain explicit and testable across stages.",
      },
      {
        title: "Security baseline",
        value: "Approved",
        detail: "Core policy guardrails and redaction patterns are in place before deeper feature work proceeds.",
      },
    ];
  }, [controls]);

  const actions = [
    "Keep the local runtime documentation synchronized with the actual CI and workstation setup.",
    "Validate every new stage against the existing contract, configuration, and security guardrails.",
    "Treat environment drift as a release risk until the pinned toolchain is formally installed.",
    "Record every approval gate and evidence item before moving from one feature stage to the next.",
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      setError("Control name is required.");
      return;
    }

    const nextControl: FoundationControl = {
      id: `FND-${Math.floor(Date.now() / 1000) % 100000}`,
      name,
      status: form.status,
      owner: form.owner.trim() || "Platform",
      detail: form.detail.trim() || "No additional notes recorded.",
    };

    setControls((current) => [nextControl, ...current]);
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
            <p className="eyebrow accent">F-00</p>
            <h2>
              Platform foundation and delivery controls keep the product stable,
              testable, and ready for the next feature stage.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Foundation summary">
            <div>
              <span className="meta-label">State</span>
              <strong>{controls.some((item) => item.status === "Stable") ? "Ready" : "Setup"}</strong>
            </div>
            <div>
              <span className="meta-label">Runtime</span>
              <strong>Local + CI</strong>
            </div>
            <div>
              <span className="meta-label">Gate</span>
              <strong>Approved</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">BASELINE</p>
                <h3>Foundation overview</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {foundationStats.map((item) => (
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
              <p className="eyebrow">CONTROLS</p>
              <h3>Delivery guardrails</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="goal-form">
            <div className="field-grid">
              <label className="field">
                <span>Control name</span>
                <input
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  placeholder="e.g. Runtime contracts"
                />
              </label>

              <label className="field">
                <span>Owner</span>
                <input
                  value={form.owner}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, owner: event.target.value }))
                  }
                  placeholder="e.g. Platform"
                />
              </label>

              <label className="field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as FoundationControl["status"],
                    }))
                  }
                >
                  <option value="Stable">Stable</option>
                  <option value="Enabled">Enabled</option>
                  <option value="Controlled">Controlled</option>
                  <option value="Tracked">Tracked</option>
                </select>
              </label>

              <label className="field field-wide">
                <span>Detail</span>
                <textarea
                  value={form.detail}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, detail: event.target.value }))
                  }
                  placeholder="Add context around runtime, release, or operational check results."
                />
              </label>
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="button-row">
              <button type="submit" className="primary-btn">
                Save control
              </button>
            </div>
          </form>

          <div className="goal-list compact-list">
            {controls.map((control) => (
              <div className="goal-item" key={control.id}>
                <div className="goal-topline">
                  <strong>{control.name}</strong>
                  <span className="pill success">{control.status}</span>
                </div>
                <div className="goal-details">
                  <span>{control.owner}</span>
                  <span>{control.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </RavProtectedLayout>
  );
}
