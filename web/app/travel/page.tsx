"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRavAuth } from "../auth-context";
import { RavProtectedLayout } from "../protected-layout";

type TripPlan = {
  id: string;
  destination: string;
  timeframe: string;
  budget: number;
  status: "Planned" | "Queued" | "Booked";
  notes: string;
};

const initialTrips: TripPlan[] = [
  {
    id: "TRIP-101",
    destination: "Bali",
    timeframe: "October 2026",
    budget: 160000,
    status: "Planned",
    notes: "Flex budget remains intact with enough contingency for changes.",
  },
  {
    id: "TRIP-204",
    destination: "Goa",
    timeframe: "November 2026",
    budget: 75000,
    status: "Queued",
    notes: "Short trip remains on the lower-risk planning list.",
  },
  {
    id: "TRIP-318",
    destination: "Himachal",
    timeframe: "December 2026",
    budget: 90000,
    status: "Booked",
    notes: "Reservation and transport details are already in place.",
  },
];

const defaultForm = {
  destination: "",
  timeframe: "",
  budget: "",
  status: "Planned" as TripPlan["status"],
  notes: "",
};

const indianCurrency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export default function TravelPage() {
  const { isAdmin, logout } = useRavAuth();
  const [trips, setTrips] = useState<TripPlan[]>(initialTrips);
  const [form, setForm] = useState(defaultForm);
  const [error, setError] = useState("");

  const tripStats = useMemo(() => {
    const totalBudget = trips.reduce((sum, item) => sum + item.budget, 0);
    const bookedCount = trips.filter((item) => item.status === "Booked").length;

    return [
      {
        title: "Travel readiness",
        value: `${Math.max(70, 74 + bookedCount)}%`,
        detail: "Trip planning remains comfortably ahead of the target date.",
      },
      {
        title: "Budget envelope",
        value: indianCurrency.format(totalBudget),
        detail: "Current budget supports a balanced travel plan without strain.",
      },
      {
        title: "Savings cadence",
        value: indianCurrency.format(Math.round(totalBudget / 12)),
        detail: "Contribution pace remains consistent and resilient.",
      },
      {
        title: "Flex buffer",
        value: bookedCount > 0 ? "Healthy" : "Balanced",
        detail: "There is enough slack to absorb medium changes in trip costs.",
      },
    ];
  }, [trips]);

  const actions = [
    "Align the trip budget with current airfare and stay assumptions.",
    "Review the itinerary against the planned travel timeline and slack.",
    "Check whether this should remain a self-funded or partially shared trip plan.",
    "Finalize a backup plan for weather, schedule, or transit disruptions.",
  ];

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const destination = form.destination.trim();
    const timeframe = form.timeframe.trim();
    const budget = Number(form.budget);

    if (!destination || !timeframe || Number.isNaN(budget) || budget <= 0) {
      setError("Destination, timeframe, and a valid budget are required.");
      return;
    }

    const nextTrip: TripPlan = {
      id: `TRIP-${Math.floor(Date.now() / 1000) % 100000}`,
      destination,
      timeframe,
      budget,
      status: form.status,
      notes: form.notes.trim() || "No additional notes recorded.",
    };

    setTrips((current) => [nextTrip, ...current]);
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
            <p className="eyebrow accent">TRAVEL</p>
            <h2>
              Track vacation plans, financial buffer, and trip readiness without
              overcommitting.
            </h2>
          </div>

          <div className="summary-strip" aria-label="Travel summary">
            <div>
              <span className="meta-label">Timing</span>
              <strong>{trips.some((trip) => trip.status === "Booked") ? "Booked" : "Planned"}</strong>
            </div>
            <div>
              <span className="meta-label">Budget</span>
              <strong>Balanced</strong>
            </div>
            <div>
              <span className="meta-label">Flex</span>
              <strong>Ready</strong>
            </div>
          </div>
        </section>

        <section className="feature-grid">
          <article className="panel">
            <div className="section-head">
              <div>
                <p className="eyebrow">READINESS</p>
                <h3>Trip health</h3>
              </div>
            </div>

            <div className="insight-grid three-up">
              {tripStats.map((item) => (
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
                <h3>Next decisions</h3>
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
              <p className="eyebrow">PLAN</p>
              <h3>Travel roadmap</h3>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="goal-form">
            <div className="field-grid">
              <label className="field">
                <span>Destination</span>
                <input
                  value={form.destination}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, destination: event.target.value }))
                  }
                  placeholder="e.g. Bali"
                />
              </label>

              <label className="field">
                <span>Timeframe</span>
                <input
                  value={form.timeframe}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, timeframe: event.target.value }))
                  }
                  placeholder="e.g. October 2026"
                />
              </label>

              <label className="field">
                <span>Budget</span>
                <input
                  type="number"
                  value={form.budget}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, budget: event.target.value }))
                  }
                  placeholder="160000"
                />
              </label>

              <label className="field">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      status: event.target.value as TripPlan["status"],
                    }))
                  }
                >
                  <option value="Planned">Planned</option>
                  <option value="Queued">Queued</option>
                  <option value="Booked">Booked</option>
                </select>
              </label>

              <label className="field field-wide">
                <span>Trip notes</span>
                <textarea
                  value={form.notes}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, notes: event.target.value }))
                  }
                  placeholder="Add context around booking, stakeholders, or flexibility."
                />
              </label>
            </div>

            {error ? <p className="form-error">{error}</p> : null}

            <div className="button-row">
              <button type="submit" className="primary-btn">
                Save trip
              </button>
            </div>
          </form>

          <div className="goal-list compact-list">
            {trips.map((trip) => (
              <div className="goal-item" key={trip.id}>
                <div className="goal-topline">
                  <strong>{trip.destination}</strong>
                  <span className="pill success">{trip.status}</span>
                </div>
                <div className="goal-details">
                  <span>{trip.timeframe}</span>
                  <span>{indianCurrency.format(trip.budget)}</span>
                  <span>{trip.notes}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </RavProtectedLayout>
  );
}
