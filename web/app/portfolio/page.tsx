"use client";

import { useMemo, useState } from "react";
import { ProtectedLayout } from "../protected-layout";

type Investment = {
  id: number;
  name: string;
  category: string;
  allocation: number;
  value: number;
  gain: number;
  status: "Strong" | "Stable" | "Watch";
};

const defaultInvestments: Investment[] = [
  {
    id: 1,
    name: "Nifty Index Fund",
    category: "Equity",
    allocation: 32,
    value: 780000,
    gain: 5.4,
    status: "Strong",
  },
  {
    id: 2,
    name: "PPF",
    category: "Debt",
    allocation: 22,
    value: 530000,
    gain: 3.1,
    status: "Stable",
  },
  {
    id: 3,
    name: "Gold ETF",
    category: "Commodity",
    allocation: 16,
    value: 390000,
    gain: 2.7,
    status: "Stable",
  },
  {
    id: 4,
    name: "Fixed Deposit",
    category: "Cash",
    allocation: 18,
    value: 440000,
    gain: 3.8,
    status: "Strong",
  },
];

const indianCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function PortfolioPage() {
  const [investments, setInvestments] =
    useState<Investment[]>(defaultInvestments);

  const summary = useMemo(() => {
    const totalValue = investments.reduce((sum, item) => sum + item.value, 0);
    const totalAllocation = investments.reduce(
      (sum, item) => sum + item.allocation,
      0,
    );
    const weightedGain = investments.reduce(
      (sum, item) => sum + item.value * (item.gain / 100),
      0,
    );

    return {
      totalValue,
      totalAllocation,
      weightedGain,
    };
  }, [investments]);

  const addSampleHolding = () => {
    setInvestments((current) => [
      {
        id: Date.now(),
        name: "Sovereign Gold Bond",
        category: "Commodity",
        allocation: 12,
        value: 290000,
        gain: 4.1,
        status: "Watch",
      },
      ...current,
    ]);
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
            <a href="#">Transactions</a>
          </nav>
        </header>

        <section className="feature-header panel">
          <div>
            <p className="eyebrow accent">PORTFOLIO</p>
            <h2>Monitor allocation, gains, and balance by asset class.</h2>
          </div>

          <div className="summary-strip" aria-label="Portfolio summary">
            <div>
              <span className="meta-label">Total value</span>
              <strong>{indianCurrency.format(summary.totalValue)}</strong>
            </div>
            <div>
              <span className="meta-label">Allocation mix</span>
              <strong>{summary.totalAllocation}%</strong>
            </div>
            <div>
              <span className="meta-label">Weighted gain</span>
              <strong>{indianCurrency.format(summary.weightedGain)}</strong>
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
                onClick={addSampleHolding}
              >
                + Add holding
              </button>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Category</th>
                    <th>Allocation</th>
                    <th>Value</th>
                    <th>Gain</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {investments.map((investment) => (
                    <tr key={investment.id}>
                      <td>{investment.name}</td>
                      <td>{investment.category}</td>
                      <td>{investment.allocation}%</td>
                      <td>{indianCurrency.format(investment.value)}</td>
                      <td className="positive">+{investment.gain}%</td>
                      <td>
                        <span
                          className={`pill ${investment.status === "Strong" ? "success" : "neutral"}`}
                        >
                          {investment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
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
                <strong>Up 6.4%</strong>
                <small>
                  YTD trend benchmarked against the current tracked holdings.
                </small>
              </div>
            </div>
          </aside>
        </section>
      </main>
    </ProtectedLayout>
  );
}
