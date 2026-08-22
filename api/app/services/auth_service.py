from __future__ import annotations

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from app.db import get_engine, uses_mysql
from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self) -> None:
        self.user_repository = UserRepository()
        self._access_tokens: dict[str, dict[str, Any]] = {}
        self._refresh_tokens: dict[str, dict[str, Any]] = {}
        self._used_refresh_tokens: set[str] = set()

    def hash_password(self, password: str, salt: str | None = None) -> tuple[str, str]:
        effective_salt = salt or secrets.token_hex(16)
        digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), effective_salt.encode("utf-8"), 100_000)
        return effective_salt, digest.hex()

    def create_user(self, payload: dict[str, Any]) -> dict[str, Any]:
        salt, password_hash = self.hash_password(payload["password"])
        user = {
            "email": payload["email"],
            "phone": payload.get("phone"),
            "username": payload.get("username"),
            "role": payload.get("role", "user"),
            "name": payload.get("name"),
            "status": "pending_verification" if payload.get("require_verification") else "active",
            "verified": not payload.get("require_verification", False),
            "password_hash": password_hash,
            "password_salt": salt,
            "preferred_currency": payload.get("preferred_currency", "INR").upper(),
            "otp_code": payload.get("otp_code"),
            "otp_expires_at": payload.get("otp_expires_at"),
            "otp_attempts": 0,
            "failed_login_attempts": 0,
        }
        self.user_repository.create_user(user)
        return user

    def find_user_by_identifier(self, identifier: str, users: dict[str, dict[str, Any]]) -> dict[str, Any] | None:
        normalized_identifier = identifier.strip().lower()
        for user in users.values():
            if (user.get("email") or "") == normalized_identifier:
                return user
            if (user.get("username") or "") == normalized_identifier:
                return user
            if (user.get("phone") or "") == normalized_identifier:
                return user
        return None

    def verify_password(self, password: str, user: dict[str, Any]) -> bool:
        _, expected_hash = self.hash_password(password, user["password_salt"])
        return hmac.compare_digest(expected_hash, user["password_hash"])

    def issue_tokens(self, email: str, role: str) -> dict[str, str]:
        access_token = secrets.token_urlsafe(32)
        refresh_token = secrets.token_urlsafe(32)
        access_expires_at = (datetime.now(timezone.utc) + timedelta(minutes=60)).isoformat()
        refresh_expires_at = (datetime.now(timezone.utc) + timedelta(days=14)).isoformat()

        self._access_tokens[access_token] = {
            "email": email,
            "role": role,
            "expires_at": access_expires_at,
            "session_closed": False,
        }
        refresh_hash = hashlib.sha256(refresh_token.encode("utf-8")).hexdigest()
        self._refresh_tokens[refresh_hash] = {
            "email": email,
            "role": role,
            "expires_at": refresh_expires_at,
        }

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "access_token_expires_at": access_expires_at,
            "refresh_token_expires_at": refresh_expires_at,
        }

    def invalidate_user_sessions(self, email: str) -> None:
        for token, session in list(self._access_tokens.items()):
            if session.get("email") == email:
                session["session_closed"] = True
                session["expires_at"] = datetime.now(timezone.utc).isoformat()
                self._access_tokens.pop(token, None)

        for refresh_hash, refresh_session in list(self._refresh_tokens.items()):
            if refresh_session.get("email") == email:
                self._used_refresh_tokens.add(refresh_hash)
                self._refresh_tokens.pop(refresh_hash, None)

    def cleanup_expired_sessions(self) -> None:
        now = datetime.now(timezone.utc)
        for token, session in list(self._access_tokens.items()):
            expires_at = session.get("expires_at")
            if expires_at and datetime.fromisoformat(expires_at) <= now:
                self._access_tokens.pop(token, None)

        for refresh_hash, session in list(self._refresh_tokens.items()):
            expires_at = session.get("expires_at")
            if expires_at and datetime.fromisoformat(expires_at) <= now:
                self._used_refresh_tokens.add(refresh_hash)
                self._refresh_tokens.pop(refresh_hash, None)

    def user_can_login(self, user: dict[str, Any], password: str) -> bool:
        if user.get("status") in {"deleted", "locked", "pending_verification", "unverified"}:
            return False
        return self.verify_password(password, user)
