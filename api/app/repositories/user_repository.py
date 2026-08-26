from __future__ import annotations

from typing import Any

from sqlalchemy import text

from app.db import get_engine, normalize_db_datetime, uses_mysql


class UserRepository:
    def __init__(self) -> None:
        self.engine = get_engine()

    def create_user(self, user: dict[str, Any]) -> None:
        if uses_mysql():
            with self.engine.begin() as conn:
                conn.execute(
                    text(
                        """
                        INSERT INTO users (
                            email,
                            phone,
                            username,
                            role,
                            name,
                            status,
                            verified,
                            password_hash,
                            password_salt,
                            preferred_currency,
                            otp_code,
                            otp_expires_at,
                            otp_attempts,
                            failed_login_attempts,
                            created_at,
                            updated_at
                        ) VALUES (
                            :email,
                            :phone,
                            :username,
                            :role,
                            :name,
                            :status,
                            :verified,
                            :password_hash,
                            :password_salt,
                            :preferred_currency,
                            :otp_code,
                            :otp_expires_at,
                            :otp_attempts,
                            :failed_login_attempts,
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP
                        )
                        """
                    ),
                    {
                        "email": user.get("email"),
                        "phone": user.get("phone"),
                        "username": user.get("username"),
                        "role": user.get("role", "user"),
                        "name": user.get("name"),
                        "status": user.get("status", "active"),
                        "verified": bool(user.get("verified", False)),
                        "password_hash": user["password_hash"],
                        "password_salt": user["password_salt"],
                        "preferred_currency": user.get("preferred_currency", "INR"),
                        "otp_code": user.get("otp_code"),
                        "otp_expires_at": normalize_db_datetime(user.get("otp_expires_at")),
                        "otp_attempts": int(user.get("otp_attempts", 0)),
                        "failed_login_attempts": int(user.get("failed_login_attempts", 0)),
                    },
                )
        else:
            with self.engine.begin() as conn:
                conn.execute(
                    text(
                        """
                        INSERT INTO users (
                            email,
                            phone,
                            username,
                            role,
                            name,
                            status,
                            verified,
                            password_hash,
                            password_salt,
                            preferred_currency,
                            otp_code,
                            otp_expires_at,
                            otp_attempts,
                            failed_login_attempts,
                            created_at,
                            updated_at
                        ) VALUES (
                            :email,
                            :phone,
                            :username,
                            :role,
                            :name,
                            :status,
                            :verified,
                            :password_hash,
                            :password_salt,
                            :preferred_currency,
                            :otp_code,
                            :otp_expires_at,
                            :otp_attempts,
                            :failed_login_attempts,
                            CURRENT_TIMESTAMP,
                            CURRENT_TIMESTAMP
                        )
                        """
                    ),
                    {
                        "email": user.get("email"),
                        "phone": user.get("phone"),
                        "username": user.get("username"),
                        "role": user.get("role", "user"),
                        "name": user.get("name"),
                        "status": user.get("status", "active"),
                        "verified": bool(user.get("verified", False)),
                        "password_hash": user["password_hash"],
                        "password_salt": user["password_salt"],
                        "preferred_currency": user.get("preferred_currency", "INR"),
                        "otp_code": user.get("otp_code"),
                        "otp_expires_at": normalize_db_datetime(user.get("otp_expires_at")),
                        "otp_attempts": int(user.get("otp_attempts", 0)),
                        "failed_login_attempts": int(user.get("failed_login_attempts", 0)),
                    },
                )

    def get_by_email(self, email: str) -> dict[str, Any] | None:
        with self.engine.begin() as conn:
            result = conn.execute(
                text(
                    "SELECT * FROM users WHERE email = :email ORDER BY id DESC LIMIT 1"
                ),
                {"email": email},
            ).mappings().first()
        return dict(result) if result else None

    def get_by_username(self, username: str) -> dict[str, Any] | None:
        with self.engine.begin() as conn:
            result = conn.execute(
                text(
                    "SELECT * FROM users WHERE username = :username ORDER BY id DESC LIMIT 1"
                ),
                {"username": username},
            ).mappings().first()
        return dict(result) if result else None

    def update_user(self, user_email: str, updates: dict[str, Any]) -> None:
        if not updates:
            return
        assignments = ", ".join(f"{key} = :{key}" for key in updates)
        params = {**updates, "email": user_email}
        with self.engine.begin() as conn:
            conn.execute(
                text(f"UPDATE users SET {assignments}, updated_at = CURRENT_TIMESTAMP WHERE email = :email"),
                params,
            )

    def add_password_reset_token(self, user_email: str, token_hash: str, expires_at: str) -> None:
        with self.engine.begin() as conn:
            conn.execute(
                text(
                    """
                    INSERT INTO password_reset_tokens (user_email, token_hash, expires_at, used_at, created_at)
                    VALUES (:user_email, :token_hash, :expires_at, NULL, CURRENT_TIMESTAMP)
                    """
                ),
                {"user_email": user_email, "token_hash": token_hash, "expires_at": expires_at},
            )

    def list_password_reset_tokens(self, user_email: str) -> list[dict[str, Any]]:
        with self.engine.begin() as conn:
            rows = conn.execute(
                text(
                    "SELECT user_email, token_hash, expires_at, used_at, created_at FROM password_reset_tokens WHERE user_email = :user_email ORDER BY created_at DESC"
                ),
                {"user_email": user_email},
            ).mappings().all()
        return [dict(row) for row in rows]

    def mark_password_reset_token_used(self, user_email: str, token_hash: str) -> None:
        with self.engine.begin() as conn:
            conn.execute(
                text(
                    "UPDATE password_reset_tokens SET used_at = CURRENT_TIMESTAMP WHERE user_email = :user_email AND token_hash = :token_hash AND used_at IS NULL"
                ),
                {"user_email": user_email, "token_hash": token_hash},
            )
