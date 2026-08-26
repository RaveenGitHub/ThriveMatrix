"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiFetch } from "../../lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const payload = {
      name: form.name.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      username: form.username.trim() || undefined,
      password: form.password,
      preferred_currency: "INR",
      require_verification: false,
      role: "user",
    };

    if (!payload.email && !payload.phone) {
      setError("Please enter either an email address or a phone number.");
      return;
    }

    if (!payload.password || payload.password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      await apiFetch<{ message: string }>("/api/v1/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setSuccess("Account created successfully. You can now sign in.");
      setForm({
        name: "",
        email: "",
        phone: "",
        username: "",
        password: "",
      });

      window.setTimeout(() => {
        router.replace("/login");
      }, 800);
    } catch (registerError) {
      setError(
        registerError instanceof Error
          ? registerError.message
          : "Unable to create account.",
      );
    }
  }

  return (
    <main className="page-shell">
      <section className="panel" style={{ maxWidth: 520, margin: "8rem auto" }}>
        <p className="eyebrow">CREATE ACCOUNT</p>
        <h2>Register new user</h2>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
          <label>
            <span>Full name</span>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              placeholder="Your full name"
              style={{ width: "100%", padding: 10, marginTop: 8 }}
            />
          </label>

          <label>
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
              placeholder="you@example.com"
              style={{ width: "100%", padding: 10, marginTop: 8 }}
            />
          </label>

          <label>
            <span>Phone</span>
            <input
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
              placeholder="9876543210"
              style={{ width: "100%", padding: 10, marginTop: 8 }}
            />
          </label>

          <label>
            <span>Username</span>
            <input
              value={form.username}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  username: event.target.value,
                }))
              }
              placeholder="username"
              style={{ width: "100%", padding: 10, marginTop: 8 }}
            />
          </label>

          <label>
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value,
                }))
              }
              placeholder="Create a strong password"
              style={{ width: "100%", padding: 10, marginTop: 8 }}
              required
            />
          </label>

          {error ? <p style={{ color: "#b42318" }}>{error}</p> : null}
          {success ? <p style={{ color: "#067647" }}>{success}</p> : null}

          <button className="primary-btn" type="submit">
            Create account
          </button>

          <p style={{ margin: 0, textAlign: "center" }}>
            Already have an account?{" "}
            <Link href="/login" style={{ color: "#1d4ed8", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}
