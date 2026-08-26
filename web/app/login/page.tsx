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
      <section className="panel" style={{ maxWidth: 480, margin: "8rem auto" }}>
        <p className="eyebrow">AUTHENTICATION</p>
        <h2>Sign in</h2>
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              style={{ width: "100%", padding: 10, marginTop: 8 }}
              required
            />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              style={{ width: "100%", padding: 10, marginTop: 8 }}
              required
            />
          </label>

          {error ? <p style={{ color: "#b42318" }}>{error}</p> : null}

          <button className="primary-btn" type="submit">
            Continue
          </button>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
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
