"use client";

import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { ProtectedLayout } from "../protected-layout";

type Policy = {
  id: string;
  name: string;
  policy_type: string;
  coverage_amount: number;
  premium_amount: number;
  renewal_date: string;
};

const indianCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function InsurancePage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    policy_type: "health",
    coverage_amount: "",
    premium_amount: "",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    renewal_date: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
  });

  const loadPolicies = async () => {
    try {
      setLoading(true);
      const response = await apiFetch<{ policies: Policy[] }>(
        "/api/v1/insurance/policies",
      );
      setPolicies(response.policies ?? []);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load policies",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPolicies();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = form.name.trim();
    const coverageAmount = Number(form.coverage_amount);
    const premiumAmount = Number(form.premium_amount);

    if (
      !name ||
      Number.isNaN(coverageAmount) ||
      Number.isNaN(premiumAmount) ||
      coverageAmount <= 0 ||
      premiumAmount <= 0
    ) {
      return;
    }

    try {
      await apiFetch("/api/v1/insurance/policies", {
        method: "POST",
        body: JSON.stringify({
          name,
          policy_type: form.policy_type,
          premium_amount: premiumAmount,
          coverage_amount: coverageAmount,
          start_date: form.start_date,
          end_date: form.end_date,
          renewal_date: form.renewal_date,
        }),
      });

      setForm({
        name: "",
        policy_type: "health",
        coverage_amount: "",
        premium_amount: "",
        start_date: new Date().toISOString().slice(0, 10),
        end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
        renewal_date: new Date(Date.now() + 300 * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10),
      });
      await loadPolicies();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save policy",
      );
    }
  };

  const totalCover = policies.reduce(
    (sum, policy) => sum + Number(policy.coverage_amount || 0),
    0,
  );
  const totalPremium = policies.reduce(
    (sum, policy) => sum + Number(policy.premium_amount || 0),
    0,
  );

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
            <a href="/insurance">Insurance</a>
          </nav>
        </header>

        <section className="feature-header panel">
          <div>
            <p className="eyebrow accent">INSURANCE</p>
            <h2>
              Protect your family and plan for the risk profile you carry.
            </h2>
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
              <span className="meta-label">Policies</span>
              <strong>{policies.length}</strong>
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
                    value={form.policy_type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        policy_type: event.target.value,
                      }))
                    }
                  >
                    <option value="health">Health</option>
                    <option value="life">Life</option>
                    <option value="disability">Disability</option>
                    <option value="critical_illness">Critical illness</option>
                    <option value="auto">Auto</option>
                  </select>
                </label>

                <label className="field">
                  <span>Coverage</span>
                  <input
                    type="number"
                    min="0"
                    value={form.coverage_amount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        coverage_amount: event.target.value,
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
                    value={form.premium_amount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        premium_amount: event.target.value,
                      }))
                    }
                    placeholder="15000"
                  />
                </label>

                <label className="field field-wide">
                  <span>Start date</span>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        start_date: event.target.value,
                      }))
                    }
                  />
                </label>

                <label className="field field-wide">
                  <span>Renewal date</span>
                  <input
                    type="date"
                    value={form.renewal_date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        renewal_date: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              {error ? (
                <p style={{ color: "#b42318", marginBottom: 12 }}>{error}</p>
              ) : null}

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
              {loading ? (
                <div className="goal-item">Loading policies…</div>
              ) : policies.length === 0 ? (
                <div className="goal-item">No insurance policies yet.</div>
              ) : (
                policies.map((policy) => (
                  <div className="goal-item" key={policy.id}>
                    <div className="goal-topline">
                      <strong>{policy.name}</strong>
                      <span className="pill success">Active</span>
                    </div>
                    <div className="goal-details">
                      <span>{policy.policy_type}</span>
                      <span>{policy.renewal_date}</span>
                    </div>
                    <div className="goal-details">
                      <span>
                        {indianCurrency.format(policy.coverage_amount)}
                      </span>
                      <span>
                        {indianCurrency.format(policy.premium_amount)}/yr
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </aside>
        </section>
      </main>
    </ProtectedLayout>
  );
}
