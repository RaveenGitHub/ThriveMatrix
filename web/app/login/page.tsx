"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiFetch } from "../../lib/api";
import { useAuth } from "../auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { refreshSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    try {
      await apiFetch<{ access_token: string; refresh_token: string }>(
        "/api/v1/auth/login",
        {
          method: "POST",
          body: JSON.stringify({ email, password }),
        },
      );

      await refreshSession();
      router.replace("/home");
    } catch {
      setError("Invalid email or password.");
    }
  }

  return (
    <main className="page-shell">
      <section className="panel auth-card">
        <p className="eyebrow">AUTHENTICATION</p>
        <h2>Sign in</h2>
        <form onSubmit={handleSubmit} className="auth-form overflow-safe">
          <label className="overflow-safe">
            <span>Email</span>
            <input
              className="safe-input"
              type="email"
              value={email}
              maxLength={254}
              onChange={(event) => setEmail(event.target.value.slice(0, 254))}
              placeholder="you@example.com"
              required
            />
          </label>
          <label className="overflow-safe">
            <span>Password</span>
            <input
              className="safe-input"
              type="password"
              value={password}
              maxLength={128}
              onChange={(event) =>
                setPassword(event.target.value.slice(0, 128))
              }
              placeholder="Password"
              required
            />
          </label>

          {error ? (
            <p className="message auth-message" style={{ color: "#b42318" }}>
              {error}
            </p>
          ) : null}

          <button className="primary-btn" type="submit">
            Continue
          </button>

          <div
            className="auth-links responsive-stack"
            style={{
              justifyContent: "space-between",
              marginTop: 8,
              fontSize: 14,
            }}
          >
            <Link
              href="/forgot-password"
              style={{
                color: "#1d4ed8",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Forgot password?
            </Link>

            <Link
              href="/register"
              style={{
                color: "#1d4ed8",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Register new user
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
