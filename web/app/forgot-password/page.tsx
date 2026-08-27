"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { apiFetch } from "../../lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [resetTokenReceived, setResetTokenReceived] = useState(false);

  async function handleRequestReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    try {
      const response = await apiFetch<{
        token?: string;
        message?: string;
        status?: string;
      }>("/api/v1/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      if (response.token) {
        setToken(response.token);
      }
      setResetTokenReceived(true);
      setMessage(
        response.message ??
          "Password reset request received. Use the reset token sent by the system to continue.",
      );
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to request password reset.",
      );
    }
  }

  async function handleResetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!token.trim()) {
      setError(
        "Please enter the reset token from your email or reset request response.",
      );
      return;
    }

    if (!newPassword || newPassword.length < 8) {
      setError("New password must be at least 8 characters long.");
      return;
    }

    try {
      await apiFetch<{ status?: string; message?: string }>(
        "/api/v1/auth/reset-password",
        {
          method: "POST",
          body: JSON.stringify({ email, token, new_password: newPassword }),
        },
      );

      setMessage("Password reset complete. Redirecting to sign in.");
      setTimeout(() => {
        router.replace("/login");
      }, 800);
    } catch (resetError) {
      setError(
        resetError instanceof Error
          ? resetError.message
          : "Unable to reset password.",
      );
    }
  }

  return (
    <main className="page-shell">
      <section className="panel auth-card">
        <p className="eyebrow">ACCOUNT RECOVERY</p>
        <h2>Forgot password</h2>

        <form onSubmit={handleRequestReset} className="auth-form overflow-safe">
          <label className="overflow-safe">
            <span>Email address</span>
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

          {error ? (
            <p className="message auth-message" style={{ color: "#b42318" }}>
              {error}
            </p>
          ) : null}
          {message ? (
            <p className="message auth-message" style={{ color: "#067647" }}>
              {message}
            </p>
          ) : null}

          <button className="primary-btn" type="submit">
            Send reset request
          </button>
        </form>

        {resetTokenReceived ? (
          <form
            onSubmit={handleResetPassword}
            className="auth-form overflow-safe"
            style={{ marginTop: 20 }}
          >
            <label className="overflow-safe">
              <span>Reset token</span>
              <input
                className="safe-input"
                value={token}
                maxLength={256}
                onChange={(event) => setToken(event.target.value.slice(0, 256))}
                placeholder="Paste the reset token"
                required
              />
            </label>

            <label className="overflow-safe">
              <span>New password</span>
              <input
                className="safe-input"
                type="password"
                value={newPassword}
                maxLength={128}
                onChange={(event) =>
                  setNewPassword(event.target.value.slice(0, 128))
                }
                placeholder="Enter a new password"
                required
              />
            </label>

            <button className="primary-btn" type="submit">
              Reset password
            </button>
          </form>
        ) : null}

        <p style={{ marginTop: 18, textAlign: "center" }}>
          Back to{" "}
          <Link href="/login" style={{ color: "#1d4ed8", fontWeight: 600 }}>
            sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
