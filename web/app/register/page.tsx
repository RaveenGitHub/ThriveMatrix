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
      <section className="panel auth-card">
        <p className="eyebrow">CREATE ACCOUNT</p>
        <h2>Register new user</h2>

        <form onSubmit={handleSubmit} className="auth-form overflow-safe">
          <label className="overflow-safe">
            <span>Full name</span>
            <input
              className="safe-input"
              value={form.name}
              maxLength={120}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value.slice(0, 120),
                }))
              }
              placeholder="Your full name"
            />
          </label>

          <label className="overflow-safe">
            <span>Email</span>
            <input
              className="safe-input"
              type="email"
              value={form.email}
              maxLength={254}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value.slice(0, 254),
                }))
              }
              placeholder="you@example.com"
            />
          </label>

          <label className="overflow-safe">
            <span>Phone</span>
            <input
              className="safe-input"
              value={form.phone}
              maxLength={20}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value.slice(0, 20),
                }))
              }
              placeholder="9876543210"
            />
          </label>

          <label className="overflow-safe">
            <span>Username</span>
            <input
              className="safe-input"
              value={form.username}
              maxLength={40}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  username: event.target.value.slice(0, 40),
                }))
              }
              placeholder="username"
            />
          </label>

          <label className="overflow-safe">
            <span>Password</span>
            <input
              className="safe-input"
              type="password"
              value={form.password}
              maxLength={128}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  password: event.target.value.slice(0, 128),
                }))
              }
              placeholder="Create a strong password"
              required
            />
          </label>

          {error ? (
            <p className="message auth-message" style={{ color: "#b42318" }}>
              {error}
            </p>
          ) : null}
          {success ? (
            <p className="message auth-message" style={{ color: "#067647" }}>
              {success}
            </p>
          ) : null}

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
