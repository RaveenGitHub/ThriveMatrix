"use client";

import { FormEvent, useState } from "react";

type Policy = {
  id: number;
  name: string;
  type: "Health" | "Life" | "Critical illness" | "Auto";
  cover: number;
  premium: number;
  renewal: string;
  status: "Active" | "Review";
};

const defaultPolicies: Policy[] = [
  {
    id: 1,
    name: "Family Health Plus",
    type: "Health",
    cover: 2200000,
    premium: 18200,
    renewal: "2026-09-18",
    status: "Active",
  },
  {
    id: 2,
    name: "Term Life Secure",
    type: "Life",
    cover: 10000000,
    premium: 9200,
    renewal: "2026-11-12",
    status: "Active",
  },
  {
    id: 3,
    name: "Critical Illness Cover",
    type: "Critical illness",
    cover: 5000000,
    premium: 12500,
    renewal: "2026-08-29",
    status: "Review",
  },
];

const indianCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function InsurancePage() {
  const [policies, setPolicies] = useState<Policy[]>(defaultPolicies);

  const [form, setForm] = useState({
    name: "",
    type: "Health" as Policy["type"],
    cover: "",
    premium: "",
    renewal: "2026-09-01",
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    const cover = Number(form.cover);
    const premium = Number(form.premium);

    if (
      !name ||
      Number.isNaN(cover) ||
      Number.isNaN(premium) ||
      cover <= 0 ||
      premium <= 0
    ) {
      return;
    }

    setPolicies((current) => [
      {
        id: Date.now(),
        name,
        type: form.type,
        cover,
        premium,
        renewal: form.renewal,
        status: "Active",
      },
      ...current,
    ]);

    setForm({
      name: "",
      type: "Health",
      cover: "",
      premium: "",
      renewal: "2026-09-01",
    });
  };

  const totalCover = policies.reduce((sum, policy) => sum + policy.cover, 0);
  const totalPremium = policies.reduce(
    (sum, policy) => sum + policy.premium,
    0,
  );

  return (
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
          <a href="/insurance">Insurance</a>
        </nav>
      </header>

      <section className="feature-header panel">
        <div>
          <p className="eyebrow accent">INSURANCE</p>
          <h2>Protect your family and plan for the risk profile you carry.</h2>
        </div>

        <div className="summary-strip" aria-label="Insurance summary">
          <div>
            <span className="meta-label">Coverage</span>
            <strong>{indianCurrency.format(totalCover)}</strong>
          </div>
          <div>
            <span className="meta-label">Annual premium</span>
            <strong>{indianCurrency.format(totalPremium)}</strong>
          </div>
          <div>
            <span className="meta-label">Coverage score</span>
            <strong>82/100</strong>
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
                <span>Plan type</span>
                <select
                  value={form.type}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      type: event.target.value as Policy["type"],
                    }))
                  }
                >
                  <option value="Health">Health</option>
                  <option value="Life">Life</option>
                  <option value="Critical illness">Critical illness</option>
                  <option value="Auto">Auto</option>
                </select>
              </label>

              <label className="field">
                <span>Coverage</span>
                <input
                  type="number"
                  min="0"
                  value={form.cover}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      cover: event.target.value,
                    }))
                  }
                  placeholder="2500000"
                />
              </label>

              <label className="field">
                <span>Annual premium</span>
                <input
                  type="number"
                  min="0"
                  value={form.premium}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      premium: event.target.value,
                    }))
                  }
                  placeholder="15000"
                />
              </label>

              <label className="field field-wide">
                <span>Renewal date</span>
                <input
                  type="date"
                  value={form.renewal}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      renewal: event.target.value,
                    }))
                  }
                />
              </label>
            </div>

            <button className="primary-btn" type="submit">
              Save policy
            </button>
          </form>
        </article>

        <aside className="panel">
          <div className="section-head">
            <div>
              <p className="eyebrow">COVERAGE</p>
              <h3>Active policies</h3>
            </div>
          </div>

          <div className="goal-list compact-list">
            {policies.map((policy) => (
              <div className="goal-item" key={policy.id}>
                <div className="goal-topline">
                  <strong>{policy.name}</strong>
                  <span
                    className={`pill ${policy.status === "Active" ? "success" : "neutral"}`}
                  >
                    {policy.status}
                  </span>
                </div>
                <div className="goal-details">
                  <span>{policy.type}</span>
                  <span>{policy.renewal}</span>
                </div>
                <div className="goal-details">
                  <span>{indianCurrency.format(policy.cover)}</span>
                  <span>{indianCurrency.format(policy.premium)}/yr</span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
