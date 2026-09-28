"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ravApiFetch, type CurrencyOption } from "../../lib/api";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

type GovernanceUser = {
  email: string;
  role: string;
  status: string;
};

type GovernanceSummary = {
  status: string;
  users: GovernanceUser[];
  modules: Array<{ id: string; name: string; status: string }>;
};

export default function GovernancePage() {
  const { isAdmin, logout } = useRavAuth();
  const [summary, setSummary] = useState<GovernanceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currencies, setCurrencies] = useState<CurrencyOption[]>([]);
  const [rateDrafts, setRateDrafts] = useState<Record<string, string>>({});
  const [currencyMessage, setCurrencyMessage] = useState("");

  useEffect(() => {
    const loadGovernance = async () => {
      try {
        setLoading(true);
        const response = await ravApiFetch<GovernanceSummary>(
          "/api/v1/admin/governance",
        );
        setSummary(response);
        setError("");
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load governance",
        );
      } finally {
        setLoading(false);
      }
    };

    void loadGovernance();
  }, []);

  useEffect(() => {
    void ravApiFetch<{
      currencies: Array<CurrencyOption & { usd_per_unit: string }>;
    }>("/api/v1/admin/currencies")
      .then((response) => {
        setCurrencies(response.currencies);
        setRateDrafts(
          Object.fromEntries(
            response.currencies.map((currency) => [
              currency.currency_code,
              String(currency.usd_per_unit ?? ""),
            ]),
          ),
        );
      })
      .catch((loadError: unknown) => {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load currency management",
        );
      });
  }, []);

  const updateCurrency = async (currency: CurrencyOption) => {
    setCurrencyMessage("");
    try {
      await ravApiFetch(`/api/v1/admin/currencies/${currency.currency_code}`, {
        method: "PUT",
        body: JSON.stringify({
          usd_per_unit: rateDrafts[currency.currency_code],
          is_active: !Boolean(currency.is_active),
        }),
      });
      setCurrencies((current) =>
        current.map((item) =>
          item.currency_code === currency.currency_code
            ? { ...item, is_active: !Boolean(currency.is_active) }
            : item,
        ),
      );
      setCurrencyMessage(`${currency.currency_code} updated`);
    } catch (updateError) {
      setCurrencyMessage(
        updateError instanceof Error
          ? updateError.message
          : "Currency update failed",
      );
    }
  };

  const adminUsers = useMemo(
    () => summary?.users.filter((user) => user.role === "admin") ?? [],
    [summary],
  );

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
            <p className="eyebrow accent">GOVERNANCE</p>
            <h2>Review access, module status, and ownership posture.</h2>
          </div>

          <div className="summary-strip" aria-label="Governance summary">
            <div>
              <span className="meta-label">System</span>
              <strong>
                {loading ? "Loading" : (summary?.status ?? "unknown")}
              </strong>
            </div>
            <div>
              <span className="meta-label">Admins</span>
              <strong>{adminUsers.length}</strong>
            </div>
            <div>
              <span className="meta-label">Modules</span>
              <strong>{summary?.modules.length ?? 0}</strong>
            </div>
          </div>
        </section>

        {error ? (
          <section className="panel" style={{ marginBottom: 24 }}>
            <p style={{ color: "#b42318" }}>{error}</p>
          </section>
        ) : null}

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">MODULES</p>
                <h3>Access scope</h3>
              </div>
            </div>

            {loading ? (
              <div className="governance-list">Loading module health…</div>
            ) : (
              <div className="governance-list">
                {(summary?.modules ?? []).map((module) => (
                  <div className="governance-item" key={module.id}>
                    <span>{module.id}</span>
                    <strong>{module.name}</strong>
                    <span
                      className={`pill ${module.status === "enabled" ? "success" : "neutral"}`}
                    >
                      {module.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">ADMINS</p>
                <h3>Role owners</h3>
              </div>
            </div>

            <ul className="activity-list">
              {(summary?.users ?? []).map((user) => (
                <li key={user.email}>
                  <span>
                    <strong>{user.email}</strong>
                    <small>
                      {user.role} • {user.status}
                    </small>
                  </span>
                </li>
              ))}
            </ul>
          </aside>
        </section>

        <section className="panel" style={{ marginTop: 24 }}>
          <div className="section-head">
            <div>
              <p className="eyebrow">CURRENCY CONTROL</p>
              <h3>Supported currencies and USD rates</h3>
            </div>
            {currencyMessage ? (
              <span className="pill neutral">{currencyMessage}</span>
            ) : null}
          </div>

          <div className="governance-list">
            {currencies.map((currency) => (
              <div className="governance-item" key={currency.currency_code}>
                <strong>{currency.currency_code}</strong>
                <span>{currency.currency_name}</span>
                <label className="field" style={{ maxWidth: 180 }}>
                  <span>USD per unit</span>
                  <input
                    className="safe-input"
                    inputMode="decimal"
                    value={rateDrafts[currency.currency_code] ?? ""}
                    onChange={(event) =>
                      setRateDrafts((current) => ({
                        ...current,
                        [currency.currency_code]: event.target.value,
                      }))
                    }
                    disabled={currency.currency_code === "USD"}
                  />
                </label>
                <button
                  type="button"
                  className="ghost-btn"
                  onClick={() => void updateCurrency(currency)}
                  disabled={currency.currency_code === "USD"}
                >
                  {Boolean(currency.is_active) ? "Disable" : "Enable"}
                </button>
              </div>
            ))}
          </div>
        </section>
      </main>
    </RavProtectedLayout>
  );
}
