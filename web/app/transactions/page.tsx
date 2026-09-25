"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { ravApiFetch } from "../../lib/api";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";
import {
  ExtractedStatementRow,
  StatementImportPanel,
} from "./statement-importer";

type Transaction = {
  id?: string;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  category?: string;
  owner_email?: string;
  currency?: string;
};

type TransactionSummary = {
  income_total: number;
  expense_total: number;
  net_total: number;
  savings_rate: number;
  transaction_count: number;
};

const transactionCategoryOptions = [
  "Grocery",
  "Vegetables & Fruits",
  "Milk & Dairy",
  "Meat & Fish",
  "Home Supplies",
  "Gas Cylinder",
  "Water Can",
  "Eat Out / Restaurants",
  "Snacks & Beverages",
  "Online Food Delivery",
  "Clothing / Dress",
  "Personal Care",
  "Entertainment",
  "School Fee",
  "Tuition Fee",
  "Books & Stationery",
  "Extracurricular Activities",
  "Salary",
  "Business Income",
  "Freelancing Income",
  "Dividend",
  "Interest Income",
  "Rental Income",
  "Lending In (Money Received Back)",
  "Lending Out (Money Given)",
  "Loan EMI Paid",
  "Loan EMI Received",
  "Fuel",
  "Auto/Taxi",
  "Vehicle Service",
  "Parking",
  "Electricity Bill",
  "Water Bill",
  "Internet / WiFi",
  "Mobile Recharge",
  "DTH / TV Subscription",
  "Medical Expenses",
  "Pharmacy",
  "Health Insurance Premium",
  "Gym / Fitness",
  "Charity",
  "Temple / Religious Offering",
  "Community Contribution",
  "Family Support",
  "Shopping",
  "Online Purchase",
  "Misc Expense",
  "Misc Income",
];

const indianCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const formatMoney = (value: number) => indianCurrency.format(value);

export default function TransactionsPage() {
  const { isAdmin, logout } = useRavAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<TransactionSummary>({
    income_total: 0,
    expense_total: 0,
    net_total: 0,
    savings_rate: 0,
    transaction_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statementRows, setStatementRows] = useState<ExtractedStatementRow[]>(
    [],
  );
  const [statementSourceName, setStatementSourceName] = useState("");
  const [statementStatus, setStatementStatus] = useState("");
  const [savingStatement, setSavingStatement] = useState(false);
  const [form, setForm] = useState({
    description: "",
    category: "",
    amount: "",
    type: "credit" as "credit" | "debit",
    date: new Date().toISOString().slice(0, 10),
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [listResponse, summaryResponse] = await Promise.all([
        ravApiFetch<{ transactions: Transaction[] }>("/api/v1/transactions"),
        ravApiFetch<TransactionSummary>("/api/v1/transactions/summary"),
      ]);
      setTransactions(listResponse.transactions ?? []);
      setSummary(summaryResponse);
      setError("");
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Unable to load transactions",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [listResponse, summaryResponse] = await Promise.all([
          ravApiFetch<{ transactions: Transaction[] }>("/api/v1/transactions"),
          ravApiFetch<TransactionSummary>("/api/v1/transactions/summary"),
        ]);

        if (!active) {
          return;
        }

        setTransactions(listResponse.transactions ?? []);
        setSummary(summaryResponse);
        setError("");
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load transactions",
        );
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const handleStatementReady = (
    rows: ExtractedStatementRow[],
    sourceName: string,
  ) => {
    setStatementRows(rows);
    setStatementSourceName(sourceName);
    setStatementStatus(`Review ${rows.length} extracted statement entries.`);
    setError("");
  };

  const handleConfirmStatement = async () => {
    if (statementRows.length === 0) {
      return;
    }

    try {
      setSavingStatement(true);
      setError("");

      const reviewPayload = {
        source_name: statementSourceName || "bank-statement",
        records: statementRows.map((row) => ({
          date: row.date,
          description: row.description,
          amount: row.amount,
          type: row.type,
          category: row.category ?? "Misc Expense",
        })),
      };

      const reviewResponse = await ravApiFetch<{
        accepted_count: number;
        duplicate_count: number;
        transactions: Array<{
          date: string;
          description: string;
          amount: number;
          type: "credit" | "debit";
          category?: string;
        }>;
      }>("/api/v1/transactions/review", {
        method: "POST",
        body: JSON.stringify(reviewPayload),
      });

      const importPayload = {
        source_name: reviewPayload.source_name,
        records: (reviewResponse.transactions ?? []).map((transaction) => ({
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type,
          category: transaction.category ?? "Misc Expense",
        })),
      };

      if (importPayload.records.length > 0) {
        await ravApiFetch("/api/v1/transactions/import", {
          method: "POST",
          body: JSON.stringify(importPayload),
        });
      }

      setStatementRows([]);
      setStatementSourceName("");
      setStatementStatus(
        reviewResponse.duplicate_count > 0
          ? `Imported ${reviewResponse.accepted_count} entries, skipped ${reviewResponse.duplicate_count} duplicates.`
          : `Imported ${reviewResponse.accepted_count} entries successfully.`,
      );
      await loadData();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to import statement transactions",
      );
    } finally {
      setSavingStatement(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const description = form.description.trim();
    const amount = Number(form.amount);

    if (
      !description ||
      !form.category ||
      Number.isNaN(amount) ||
      amount <= 0 ||
      !form.date
    ) {
      setError(
        "Please fill in a valid date, category, amount, and description before saving.",
      );
      return;
    }

    try {
      await ravApiFetch("/api/v1/transactions/import", {
        method: "POST",
        body: JSON.stringify({
          source_name: "ui-import",
          records: [
            {
              date: form.date,
              description,
              amount,
              type: form.type,
              category: form.category,
            },
          ],
        }),
      });

      setError("");
      setForm({
        description: "",
        category: "",
        amount: "",
        type: "credit",
        date: new Date().toISOString().slice(0, 10),
      });
      await loadData();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to save transaction",
      );
    }
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
            <p className="eyebrow accent">TRANSACTIONS</p>
            <h2>Review movement, cash flow, and category patterns.</h2>
          </div>

          <div className="summary-strip" aria-label="Transaction summary">
            <div>
              <span className="meta-label">Net flow</span>
              <strong>{indianCurrency.format(summary.net_total)}</strong>
            </div>
            <div>
              <span className="meta-label">Entries</span>
              <strong>{summary.transaction_count}</strong>
            </div>
            <div>
              <span className="meta-label">Savings rate</span>
              <strong>{summary.savings_rate}%</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">IMPORT</p>
                <h3>Log a transaction</h3>
              </div>
            </div>

            <StatementImportPanel onTransactionsReady={handleStatementReady} />

            <form className="goal-form" onSubmit={handleSubmit}>
              <div className="field-grid">
                <label className="field">
                  <span>Description</span>
                  <input
                    value={form.description}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        description: event.target.value,
                      }))
                    }
                    placeholder="e.g. Grocery top-up"
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
                    <option value="">Select category</option>
                    {transactionCategoryOptions.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="field">
                  <span>Amount</span>
                  <input
                    type="number"
                    min="0"
                    value={form.amount}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        amount: event.target.value,
                      }))
                    }
                    placeholder="15000"
                  />
                </label>

                <label className="field">
                  <span>Type</span>
                  <select
                    value={form.type}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        type: event.target.value as "credit" | "debit",
                      }))
                    }
                  >
                    <option value="credit">Credit</option>
                    <option value="debit">Debit</option>
                  </select>
                </label>

                <label className="field field-wide">
                  <span>Date</span>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        date: event.target.value,
                      }))
                    }
                  />
                </label>
              </div>

              {error ? (
                <p style={{ color: "#b42318", marginBottom: 12 }}>{error}</p>
              ) : null}

              <button className="primary-btn" type="submit">
                Save entry
              </button>
            </form>
          </article>

          {statementRows.length > 0 ? (
            <article className="panel" style={{ gridColumn: "1 / -1" }}>
              <div className="section-head">
                <div>
                  <p className="eyebrow">REVIEW</p>
                  <h3>Statement review</h3>
                </div>
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => void handleConfirmStatement()}
                  disabled={savingStatement}
                >
                  {savingStatement
                    ? "Saving entries…"
                    : "Confirm extracted transactions"}
                </button>
              </div>

              <p style={{ marginTop: 0, color: "#475467" }}>
                {statementStatus ||
                  `Reviewing ${statementRows.length} extracted records from ${statementSourceName || "statement upload"}.`}
              </p>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "10px 8px" }}>
                        Date
                      </th>
                      <th style={{ textAlign: "left", padding: "10px 8px" }}>
                        Description
                      </th>
                      <th style={{ textAlign: "right", padding: "10px 8px" }}>
                        Credit
                      </th>
                      <th style={{ textAlign: "right", padding: "10px 8px" }}>
                        Debit
                      </th>
                      <th style={{ textAlign: "right", padding: "10px 8px" }}>
                        Amount
                      </th>
                      <th style={{ textAlign: "left", padding: "10px 8px" }}>
                        Currency
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {statementRows.map((row, index) => (
                      <tr key={`${row.date}-${row.description}-${index}`}>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderTop: "1px solid #e4e7ec",
                          }}
                        >
                          {row.date}
                        </td>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderTop: "1px solid #e4e7ec",
                          }}
                        >
                          {row.description}
                        </td>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderTop: "1px solid #e4e7ec",
                            textAlign: "right",
                          }}
                        >
                          {row.type === "credit"
                            ? formatMoney(row.amount)
                            : "—"}
                        </td>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderTop: "1px solid #e4e7ec",
                            textAlign: "right",
                          }}
                        >
                          {row.type === "debit" ? formatMoney(row.amount) : "—"}
                        </td>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderTop: "1px solid #e4e7ec",
                            textAlign: "right",
                          }}
                        >
                          {formatMoney(row.amount)}
                        </td>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderTop: "1px solid #e4e7ec",
                          }}
                        >
                          {row.currency}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </article>
          ) : null}

          <aside className="panel" style={{ gridColumn: "1 / -1" }}>
            <div className="section-head">
              <div>
                <p className="eyebrow">RECENT</p>
                <h3>Transaction ledger</h3>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              {loading ? (
                <div className="goal-item">Loading transactions…</div>
              ) : transactions.length === 0 ? (
                <div className="goal-item">No transactions yet.</div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "10px 8px" }}>
                        Date
                      </th>
                      <th style={{ textAlign: "left", padding: "10px 8px" }}>
                        Description
                      </th>
                      <th style={{ textAlign: "right", padding: "10px 8px" }}>
                        Credit
                      </th>
                      <th style={{ textAlign: "right", padding: "10px 8px" }}>
                        Debit
                      </th>
                      <th style={{ textAlign: "right", padding: "10px 8px" }}>
                        Amount
                      </th>
                      <th style={{ textAlign: "left", padding: "10px 8px" }}>
                        Currency
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr
                        key={
                          transaction.id ??
                          `${transaction.date}-${transaction.description}`
                        }
                      >
                        <td
                          style={{
                            padding: "10px 8px",
                            borderTop: "1px solid #e4e7ec",
                          }}
                        >
                          {transaction.date}
                        </td>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderTop: "1px solid #e4e7ec",
                          }}
                        >
                          {transaction.description}
                        </td>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderTop: "1px solid #e4e7ec",
                            textAlign: "right",
                          }}
                        >
                          {transaction.type === "credit"
                            ? formatMoney(transaction.amount)
                            : "—"}
                        </td>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderTop: "1px solid #e4e7ec",
                            textAlign: "right",
                          }}
                        >
                          {transaction.type === "debit"
                            ? formatMoney(transaction.amount)
                            : "—"}
                        </td>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderTop: "1px solid #e4e7ec",
                            textAlign: "right",
                          }}
                        >
                          {formatMoney(transaction.amount)}
                        </td>
                        <td
                          style={{
                            padding: "10px 8px",
                            borderTop: "1px solid #e4e7ec",
                          }}
                        >
                          {transaction.currency ?? "INR"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </aside>
        </section>
      </main>
    </RavProtectedLayout>
  );
}
