"use client";

import { FormEvent, useState } from "react";

type Transaction = {
  id: number;
  title: string;
  category: string;
  amount: number;
  kind: "credit" | "debit";
  date: string;
};

const defaultTransactions: Transaction[] = [
  {
    id: 1,
    title: "Salary credit",
    category: "Income",
    amount: 72000,
    kind: "credit",
    date: "2026-08-01",
  },
  {
    id: 2,
    title: "Rent payment",
    category: "Housing",
    amount: 28000,
    kind: "debit",
    date: "2026-08-03",
  },
  {
    id: 3,
    title: "Investment top-up",
    category: "Investments",
    amount: 12500,
    kind: "debit",
    date: "2026-08-05",
  },
  {
    id: 4,
    title: "Insurance premium",
    category: "Protection",
    amount: 6200,
    kind: "debit",
    date: "2026-08-09",
  },
];

const indianCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function TransactionsPage() {
  const [transactions, setTransactions] =
    useState<Transaction[]>(defaultTransactions);

  const [form, setForm] = useState({
    title: "",
    category: "Income",
    amount: "",
    kind: "credit" as Transaction["kind"],
    date: "2026-08-19",
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = form.title.trim();
    const amount = Number(form.amount);

    if (!title || Number.isNaN(amount) || amount <= 0) {
      return;
    }

    setTransactions((current) => [
      {
        id: Date.now(),
        title,
        category: form.category,
        amount,
        kind: form.kind,
        date: form.date,
      },
      ...current,
    ]);

    setForm({
      title: "",
      category: "Income",
      amount: "",
      kind: "credit",
      date: "2026-08-19",
    });
  };

  const netFlow = transactions.reduce((sum, item) => {
    return item.kind === "credit" ? sum + item.amount : sum - item.amount;
  }, 0);

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
        </nav>
      </header>

      <section className="feature-header panel">
        <div>
          <p className="eyebrow accent">TRANSACTIONS</p>
          <h2>Review movement, cash flow, and category patterns.</h2>
        </div>

        <div className="summary-strip" aria-label="Transaction summary">
          <div>
            <span className="meta-label">Net flow</span>
            <strong>{indianCurrency.format(netFlow)}</strong>
          </div>
          <div>
            <span className="meta-label">Entries</span>
            <strong>{transactions.length}</strong>
          </div>
          <div>
            <span className="meta-label">Spending ratio</span>
            <strong>31%</strong>
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
                <span>Title</span>
                <input
                  value={form.title}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      title: event.target.value,
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
                  <option value="Income">Income</option>
                  <option value="Housing">Housing</option>
                  <option value="Investments">Investments</option>
                  <option value="Protection">Protection</option>
                  <option value="Lifestyle">Lifestyle</option>
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
                  value={form.kind}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      kind: event.target.value as Transaction["kind"],
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
            {transactions.map((transaction) => (
              <div className="goal-item" key={transaction.id}>
                <div className="goal-topline">
                  <strong>{transaction.title}</strong>
                  <span
                    className={`pill ${transaction.kind === "credit" ? "success" : "neutral"}`}
                  >
                    {transaction.kind === "credit" ? "Credit" : "Debit"}
                  </span>
                </div>
                <div className="goal-details">
                  <span>{transaction.category}</span>
                  <span>{transaction.date}</span>
                </div>
                <div className="goal-details">
                  <span
                    className={transaction.kind === "credit" ? "positive" : ""}
                  >
                    {transaction.kind === "credit" ? "+" : "-"}
                    {indianCurrency.format(transaction.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </main>
  );
}
