"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../auth-context";
import { ProtectedLayout } from "../protected-layout";

type Transaction = {
  id?: string;
  date: string;
  description: string;
  amount: number;
  type: "credit" | "debit";
  category?: string;
  owner_email?: string;
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

export default function TransactionsPage() {
  const { isAdmin, logout } = useAuth();
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
        apiFetch<{ transactions: Transaction[] }>("/api/v1/transactions"),
        apiFetch<TransactionSummary>("/api/v1/transactions/summary"),
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
          apiFetch<{ transactions: Transaction[] }>("/api/v1/transactions"),
          apiFetch<TransactionSummary>("/api/v1/transactions/summary"),
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
      await apiFetch("/api/v1/transactions/import", {
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
    <ProtectedLayout>
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

          <aside className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">RECENT</p>
                <h3>Activity feed</h3>
              </div>
            </div>

            <div className="goal-list compact-list">
              {loading ? (
                <div className="goal-item">Loading transactions…</div>
              ) : transactions.length === 0 ? (
                <div className="goal-item">No transactions yet.</div>
              ) : (
                transactions.map((transaction) => (
                  <div className="goal-item" key={transaction.id}>
                    <div className="goal-topline">
                      <strong>{transaction.description}</strong>
                      <span
                        className={`pill ${transaction.type === "credit" ? "success" : "neutral"}`}
                      >
                        {transaction.type === "credit" ? "Credit" : "Debit"}
                      </span>
                    </div>
                    <div className="goal-details">
                      <span>{transaction.category || "Uncategorized"}</span>
                      <span>{transaction.date}</span>
                    </div>
                    <div className="goal-details">
                      <span
                        className={
                          transaction.type === "credit" ? "positive" : ""
                        }
                      >
                        {transaction.type === "credit" ? "+" : "-"}
                        {indianCurrency.format(transaction.amount)}
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
