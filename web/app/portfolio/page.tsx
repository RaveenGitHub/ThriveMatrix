"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "../../lib/api";
import { ProtectedLayout } from "../protected-layout";

type Investment = {
  id: string;
  name: string;
  asset_class: string;
  currency: string;
  amount_invested: number;
  units: number;
  unit_value: number;
  current_asset_value: number;
  gain_loss: number;
};

type InvestmentSummary = {
  total_invested: number;
  current_value: number;
  gain_loss: number;
};

const indianCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function PortfolioPage() {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [summary, setSummary] = useState<InvestmentSummary>({
    total_invested: 0,
    current_value: 0,
    gain_loss: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [listResponse, summaryResponse] = await Promise.all([
          apiFetch<{ investments: Investment[] }>("/api/v1/investments"),
          apiFetch<InvestmentSummary>("/api/v1/investments/summary"),
        ]);
        setInvestments(listResponse.investments ?? []);
        setSummary(summaryResponse);
        setError("");
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load portfolio",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const totalAllocation = useMemo(() => {
    if (!investments.length) return 0;
    return investments.reduce(
      (sum, item) =>
        sum +
        Math.min(
          100,
          Math.round(
            (item.current_asset_value / Math.max(summary.current_value, 1)) *
              100,
          ),
        ),
      0,
    );
  }, [investments, summary.current_value]);

  const addSampleHolding = async () => {
    try {
      await apiFetch<Investment>("/api/v1/investments", {
        method: "POST",
        body: JSON.stringify({
          name: "Sovereign Gold Bond",
          asset_class: "commodity",
          currency: "INR",
          amount_invested: 290000,
          units: 12,
          unit_value: 24000,
          valuation_source: "manual",
          valuation_timestamp: new Date().toISOString(),
        }),
      });
      window.location.reload();
    } catch (addError) {
      setError(
        addError instanceof Error ? addError.message : "Unable to add holding",
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
            <p className="eyebrow accent">PORTFOLIO</p>
            <h2>Monitor allocation, gains, and balance by asset class.</h2>
          </div>

          <div className="summary-strip" aria-label="Portfolio summary">
            <div>
              <span className="meta-label">Total value</span>
              <strong>{indianCurrency.format(summary.current_value)}</strong>
            </div>
            <div>
              <span className="meta-label">Allocation mix</span>
              <strong>{totalAllocation}%</strong>
            </div>
            <div>
              <span className="meta-label">Weighted gain</span>
              <strong>{indianCurrency.format(summary.gain_loss)}</strong>
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

            {error ? (
              <p style={{ color: "#b42318", marginBottom: 12 }}>{error}</p>
            ) : null}

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Asset</th>
                    <th>Category</th>
                    <th>Value</th>
                    <th>Gain/Loss</th>
                    <th>Invested</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5}>Loading investments…</td>
                    </tr>
                  ) : investments.length === 0 ? (
                    <tr>
                      <td colSpan={5}>No investments yet.</td>
                    </tr>
                  ) : (
                    investments.map((investment) => (
                      <tr key={investment.id}>
                        <td>{investment.name}</td>
                        <td>{investment.asset_class}</td>
                        <td>
                          {indianCurrency.format(
                            investment.current_asset_value,
                          )}
                        </td>
                        <td
                          className={
                            investment.gain_loss >= 0 ? "positive" : ""
                          }
                        >
                          {investment.gain_loss >= 0 ? "+" : "-"}
                          {indianCurrency.format(
                            Math.abs(investment.gain_loss),
                          )}
                        </td>
                        <td>
                          {indianCurrency.format(investment.amount_invested)}
                        </td>
                      </tr>
                    ))
                  )}
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
                <strong>
                  {summary.gain_loss >= 0 ? "Up" : "Down"}{" "}
                  {indianCurrency.format(Math.abs(summary.gain_loss))}
                </strong>
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
