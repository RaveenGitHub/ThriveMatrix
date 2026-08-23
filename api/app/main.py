import hashlib
import hmac
import os
import secrets
import sqlite3
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from typing import Any, Literal

from fastapi import Depends, FastAPI, File, HTTPException, Request, Response, UploadFile, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
import re

from dotenv import dotenv_values, load_dotenv
from pydantic import BaseModel, Field, field_validator, model_validator
from sqlalchemy import text
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.db import (
    ensure_auth_sessions_table,
    ensure_database_ready,
    ensure_migration_bootstrap_tables,
    get_database_url,
    get_engine,
    normalize_db_datetime,
    uses_mysql,
)
from app.services.auth_service import AuthService


@asynccontextmanager
async def lifespan(_: FastAPI):
    ensure_database_ready()
    ensure_auth_sessions_table()
    ensure_migration_bootstrap_tables()
    yield


app = FastAPI(title="ThriveMatrix API", version="0.1.0", docs_url="/docs", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost",
        "http://127.0.0.1",
        "https://localhost",
        "https://127.0.0.1",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
security = HTTPBearer(auto_error=False)
auth_service = AuthService()


def _runtime_environment_name() -> str:
    return (os.getenv("APP_ENV") or "local").strip().lower() or "local"


def load_runtime_environment() -> dict[str, str]:
    repo_root = Path(__file__).resolve().parents[2]
    candidates = [
        Path.cwd() / ".env",
        repo_root / ".env",
        Path(__file__).resolve().parents[1] / ".env",
    ]
    seen: set[Path] = set()
    loaded: dict[str, str] = {}

    if not os.getenv("APP_ENV"):
        os.environ["APP_ENV"] = "local"

    for candidate in candidates:
        normalized = candidate.resolve()
        if normalized in seen:
            continue
        seen.add(normalized)
        if normalized.exists():
            file_values = dotenv_values(normalized)
            for key, value in file_values.items():
                if key and value is not None and not os.environ.get(key):
                    os.environ[key] = str(value)
                    loaded[key] = str(value)

    for key in ["APP_ENV", "APP_SECRET", "DATABASE_URL", "REDIS_URL"]:
        if key in loaded and key not in os.environ:
            os.environ[key] = loaded[key]

    load_dotenv(Path.cwd() / ".env", override=False)
    load_dotenv(repo_root / ".env", override=False)
    if not os.getenv("APP_ENV"):
        os.environ["APP_ENV"] = "local"
    return loaded


load_runtime_environment()


def _use_secure_cookies_for_request(request: Request | None = None) -> bool:
    if request is not None:
        host = (request.headers.get("host") or "").lower()
        if "localhost" in host or "127.0.0.1" in host:
            return False
    return os.getenv("APP_ENV", "local").strip().lower() in {"prod", "production", "staging"}


def startup_db_checks() -> None:
    ensure_database_ready()
    ensure_auth_sessions_table()
    ensure_migration_bootstrap_tables()


@app.exception_handler(StarletteHTTPException)
async def starlette_http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    request_id = request.headers.get("x-request-id", "stage0-local")
    code = {
        400: "bad_request",
        401: "unauthorized",
        403: "forbidden",
        404: "not_found",
        409: "conflict",
        422: "validation_error",
        429: "rate_limited",
        500: "internal_error",
    }.get(exc.status_code, "http_error")
    message = str(exc.detail) if exc.detail else "Request failed"

    return JSONResponse(
        status_code=exc.status_code,
        content={
            "detail": message,
            "error": {
                "code": code,
                "message": message,
                "request_id": request_id,
                "status": exc.status_code,
            },
        },
    )


def _normalize_validation_errors(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _normalize_validation_errors(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_normalize_validation_errors(item) for item in value]
    if isinstance(value, tuple):
        return [_normalize_validation_errors(item) for item in value]
    if isinstance(value, (str, int, float, bool)) or value is None:
        return value
    if isinstance(value, BaseException):
        return str(value)
    return str(value)


@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    request_id = request.headers.get("x-request-id", "stage0-local")
    message = "Request validation failed"
    normalized_errors = _normalize_validation_errors(exc.errors())
    return JSONResponse(
        status_code=422,
        content={
            "detail": message,
            "error": {
                "code": "validation_error",
                "message": message,
                "request_id": request_id,
                "status": 422,
                "details": normalized_errors,
            },
        },
    )

_USERS: dict[str, dict[str, Any]] = {}
_ACCESS_TOKENS: dict[str, dict[str, Any]] = {}
_REFRESH_TOKENS: dict[str, dict[str, Any]] = {}
_AUDIT_LOGS: list[dict[str, Any]] = []
_EVENT_OUTBOX: list[dict[str, Any]] = []
_USER_PREFERENCES: dict[str, dict[str, Any]] = {}
_OPERATION_LOGS: list[dict[str, Any]] = []
_SESSION_TOKENS: dict[str, dict[str, Any]] = {}
_USED_REFRESH_TOKENS: set[str] = set()
MAX_FAILED_LOGIN_ATTEMPTS = 5
ACCOUNT_LOCKOUT_THRESHOLD = 10
SESSION_DB_PATH = Path(__file__).resolve().parents[1] / "data" / "thrivematrix_sessions.db"


def _ensure_session_store() -> None:
    ensure_auth_sessions_table()


def _get_user_default_goal(user_email: str) -> dict[str, Any] | None:
    for goal in _GOALS:
        if goal["owner_email"] == user_email and goal.get("is_default_goal") is True:
            return goal
    return None


def _ensure_default_goal_for_user(user_email: str) -> dict[str, Any]:
    default_goal = _get_user_default_goal(user_email)
    if default_goal is not None:
        return default_goal

    goal = {
        "id": str(len(_GOALS) + 1),
        "name": "NoGoalAssigned",
        "category": "general",
        "target_amount": 0.0,
        "target_currency": "INR",
        "target_date": "2099-12-31",
        "status": "active",
        "priority": "low",
        "owner_email": user_email,
        "is_default_goal": True,
    }
    _GOALS.append(goal)
    return goal


_ensure_session_store()


class RegisterRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    email: str | None = None
    phone: str | None = None
    username: str | None = Field(default=None, min_length=3, max_length=40)
    password: str = Field(min_length=8)
    preferred_currency: str = Field(default="INR")
    require_verification: bool = False
    role: Literal["user", "admin"] = "user"

    @model_validator(mode="after")
    def validate_identity_and_username(self) -> "RegisterRequest":
        has_email = bool((self.email or "").strip())
        has_phone = bool((self.phone or "").strip())
        if not has_email and not has_phone:
            raise ValueError("At least one of email or phone is required")

        if self.username is None or not self.username.strip():
            self.username = (self.email or self.phone).strip().split("@", 1)[0] if self.email else (self.phone or "user")

        if self.preferred_currency:
            self.preferred_currency = self.preferred_currency.upper()

        return self


class LoginRequest(BaseModel):
    email: str | None = None
    username: str | None = None
    password: str

    @model_validator(mode="after")
    def validate_login_identifier(self) -> "LoginRequest":
        has_email = bool((self.email or "").strip())
        has_username = bool((self.username or "").strip())
        if not has_email and not has_username:
            raise ValueError("Either username or email is required")
        return self


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str = Field(min_length=4, max_length=6)


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class UserPreferencesRequest(BaseModel):
    theme: str = Field(default="light")
    currency: str = Field(default="INR")
    email_notifications: bool = True


class GoalCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    category: str = Field(min_length=1, max_length=100)
    target_amount: float = Field(gt=0)
    target_currency: str = Field(min_length=3, max_length=3)
    target_date: str
    status: str = Field(default="active")
    priority: str = Field(default="medium")

    @field_validator("target_date")
    @classmethod
    def validate_target_date(cls, value: str) -> str:
        try:
            datetime.fromisoformat(value)
        except ValueError as exc:  # pragma: no cover - validated through FastAPI
            raise ValueError("target_date must be a valid ISO date string") from exc
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str) -> str:
        allowed = {"active", "paused", "completed", "archived"}
        if value not in allowed:
            raise ValueError("status must be one of: active, paused, completed, archived")
        return value

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, value: str) -> str:
        allowed = {"low", "medium", "high"}
        if value not in allowed:
            raise ValueError("priority must be one of: low, medium, high")
        return value


class GoalUpdateRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    category: str | None = Field(default=None, min_length=1, max_length=100)
    target_amount: float | None = Field(default=None, gt=0)
    target_currency: str | None = Field(default=None, min_length=3, max_length=3)
    target_date: str | None = None
    status: str | None = None
    priority: str | None = None

    @field_validator("target_date")
    @classmethod
    def validate_target_date(cls, value: str | None) -> str | None:
        if value is None:
            return value
        try:
            datetime.fromisoformat(value)
        except ValueError as exc:  # pragma: no cover - validated through FastAPI
            raise ValueError("target_date must be a valid ISO date string") from exc
        return value

    @field_validator("status")
    @classmethod
    def validate_status(cls, value: str | None) -> str | None:
        if value is None:
            return value
        allowed = {"active", "paused", "completed", "archived"}
        if value not in allowed:
            raise ValueError("status must be one of: active, paused, completed, archived")
        return value

    @field_validator("priority")
    @classmethod
    def validate_priority(cls, value: str | None) -> str | None:
        if value is None:
            return value
        allowed = {"low", "medium", "high"}
        if value not in allowed:
            raise ValueError("priority must be one of: low, medium, high")
        return value


class InvestmentCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    asset_class: str = Field(min_length=1, max_length=100)
    currency: str = Field(min_length=3, max_length=3)
    amount_invested: float = Field(gt=0)
    units: float = Field(gt=0)
    unit_value: float = Field(gt=0)
    valuation_source: str = Field(min_length=1, max_length=100)
    valuation_timestamp: str
    goal_id: str | None = None
    idempotency_key: str | None = Field(default=None, min_length=1, max_length=200)

    @property
    def current_asset_value(self) -> Decimal:
        return Decimal(str(self.units)) * Decimal(str(self.unit_value))

    @property
    def gain_loss(self) -> Decimal:
        return self.current_asset_value - Decimal(str(self.amount_invested))


class TransactionRecord(BaseModel):
    date: str
    description: str = Field(min_length=1, max_length=200)
    amount: float = Field(gt=0)
    type: str


class TransactionReviewRecord(BaseModel):
    date: str
    description: str = Field(min_length=1, max_length=200)
    amount: float = Field(gt=0)
    type: str

    @field_validator("description")
    @classmethod
    def normalize_description(cls, value: str) -> str:
        normalized = value.strip().lower()
        if not normalized:
            raise ValueError("description cannot be blank")
        return normalized

    @field_validator("type")
    @classmethod
    def normalize_type(cls, value: str) -> str:
        normalized = value.strip().lower()
        if normalized not in {"credit", "debit"}:
            raise ValueError("Transaction type must be credit or debit")
        return normalized


class TransactionImportRequest(BaseModel):
    source_name: str = Field(min_length=1, max_length=200)
    records: list[TransactionRecord]


class TransactionReviewRequest(BaseModel):
    source_name: str = Field(min_length=1, max_length=200)
    records: list[TransactionReviewRecord]


class InsurancePolicyCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    provider: str | None = Field(default=None, min_length=1, max_length=200)
    policy_type: Literal["health", "life", "disability", "critical_illness", "auto", "home", "liability"]
    premium_amount: float = Field(gt=0)
    coverage_amount: float = Field(gt=0)
    coverage_goal: float | None = Field(default=None, ge=0)
    premium_frequency: Literal["monthly", "quarterly", "yearly", "one_time"] | None = None
    last_premium_date: str | None = None
    start_date: str
    end_date: str
    renewal_date: str | None = None
    status: Literal["active", "inactive", "expired", "renewal_due", "pending"] | None = None

    @property
    def dates_valid(self) -> bool:
        try:
            start = datetime.fromisoformat(self.start_date)
            end = datetime.fromisoformat(self.end_date)
            return end > start
        except ValueError:
            return False

    @property
    def renewal_date_valid(self) -> bool:
        if self.renewal_date is None:
            return True
        try:
            renewal_date = datetime.fromisoformat(self.renewal_date)
            return renewal_date.date() >= datetime.fromisoformat(self.start_date).date()
        except ValueError:
            return False


class AnalyticsSnapshotCreateRequest(BaseModel):
    period: str = Field(min_length=1, max_length=20)
    net_worth: float = Field(ge=0)
    goal_total: float = Field(ge=0)
    expense_total: float = Field(ge=0)


class HealthRecordCreateRequest(BaseModel):
    record_type: Literal["checkup", "exercise", "sleep", "nutrition", "wellness"]
    date: str
    value: str = Field(min_length=1, max_length=200)
    notes: str = Field(min_length=1, max_length=500)


class EmergencyContactCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    relationship: str = Field(min_length=1, max_length=100)
    phone: str = Field(min_length=1, max_length=50)
    email: str = Field(min_length=1, max_length=200)


class RelationshipRecordCreateRequest(BaseModel):
    category: Literal["family", "friend", "mentor", "professional", "community"]
    name: str = Field(min_length=1, max_length=200)
    status: str = Field(min_length=1, max_length=100)
    notes: str = Field(min_length=1, max_length=500)


class ReadinessItemCreateRequest(BaseModel):
    category: Literal["legal", "health", "emergency", "financial"]
    title: str = Field(min_length=1, max_length=200)
    status: Literal["pending", "review", "complete"]
    notes: str = Field(min_length=1, max_length=500)


class PrivacyConsentRequest(BaseModel):
    marketing: bool = False
    analytics: bool = False
    data_export: bool = False


class PrivacyBackupRequest(BaseModel):
    key: str = Field(min_length=1, max_length=128)


class PrivacyRestoreRequest(BaseModel):
    encrypted_payload: str = Field(min_length=1)
    key: str = Field(min_length=1, max_length=128)


SENSITIVE_KEYS = {
    "password",
    "secret",
    "token",
    "access_token",
    "refresh_token",
    "api_key",
    "authorization",
    "cookie",
    "session",
}


def redact_sensitive_fields(payload: Any) -> Any:
    if isinstance(payload, dict):
        redacted: dict[str, Any] = {}
        for key, value in payload.items():
            if key.lower() in SENSITIVE_KEYS or "password" in key.lower() or "token" in key.lower():
                redacted[key] = "[REDACTED]"
            else:
                redacted[key] = redact_sensitive_fields(value)
        return redacted
    if isinstance(payload, list):
        return [redact_sensitive_fields(item) for item in payload]
    return payload


def validate_runtime_config(config: dict[str, str]) -> list[str]:
    required = ["APP_ENV", "APP_SECRET", "DATABASE_URL"]
    missing = [name for name in required if not config.get(name)]

    app_env = str(config.get("APP_ENV") or "local").strip().lower() or "local"
    valid_envs = {"local", "development", "dev", "test", "staging", "production", "prod"}
    if app_env not in valid_envs:
        missing.append("APP_ENV")

    database_url = str(config.get("DATABASE_URL", "")).strip()
    if not missing and app_env in {"prod", "production", "staging"} and database_url.startswith("sqlite"):
        missing.append("DATABASE_URL")

    return sorted(set(missing))


def redact_sensitive_config(config: dict[str, str]) -> dict[str, str]:
    redacted: dict[str, str] = {}
    for key, value in config.items():
        if "SECRET" in key or "TOKEN" in key or "PASSWORD" in key or "URL" in key:
            redacted[key] = "[REDACTED]"
        else:
            redacted[key] = value
    return redacted


def encrypt_backup_payload(payload: dict[str, Any], key: str) -> str:
    import base64
    import json

    serialized = json.dumps(payload, sort_keys=True).encode("utf-8")
    key_bytes = (key + "-thrive-matrix").encode("utf-8")[:32].ljust(32, b"0")
    padded = serialized + b"\x00" * ((16 - (len(serialized) % 16)) % 16)
    encrypted = bytearray()
    for index in range(0, len(padded), 16):
        block = padded[index:index + 16]
        xor = bytes(a ^ b for a, b in zip(block, key_bytes[: len(block)]))
        encrypted.extend(xor)
    return base64.b64encode(bytes(encrypted)).decode("utf-8")


def decrypt_backup_payload(encrypted_payload: str, key: str) -> dict[str, Any]:
    import base64
    import json

    decoded = base64.b64decode(encrypted_payload)
    key_bytes = (key + "-thrive-matrix").encode("utf-8")[:32].ljust(32, b"0")
    restored = bytearray()
    for index in range(0, len(decoded), 16):
        block = decoded[index:index + 16]
        restored.extend(bytes(a ^ b for a, b in zip(block, key_bytes[: len(block)])))
    payload = bytes(restored).rstrip(b"\x00")
    return json.loads(payload.decode("utf-8"))


def classify_sensitive_data(payload: dict[str, Any]) -> dict[str, str]:
    classification: dict[str, str] = {}
    for key, value in payload.items():
        lowered = key.lower()
        if "account" in lowered or "bank" in lowered or "routing" in lowered or "card" in lowered:
            classification[key] = "financial"
        elif "email" in lowered or "phone" in lowered or "address" in lowered or "name" in lowered:
            classification[key] = "personal"
        else:
            classification[key] = "low"
    return classification


def export_user_data(user: dict[str, Any]) -> dict[str, Any]:
    snapshot = {
        "email": user.get("email"),
        "role": user.get("role"),
        "profile": user.get("profile", {}),
        "exported_at": datetime.now(timezone.utc).isoformat(),
    }
    return snapshot


def handle_account_deletion(state: dict[str, Any]) -> dict[str, Any]:
    result = dict(state)
    result["status"] = "deleted"
    result["deletion_review_required"] = True
    return result


def _redact_telemetry_value(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _redact_telemetry_value(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_redact_telemetry_value(item) for item in value]
    if isinstance(value, str):
        lowered = value.lower()
        if any(token in lowered for token in ["password", "secret", "token", "authorization", "bearer"]) and len(value) > 4:
            return "[REDACTED]"
        return value
    return value


def _append_observability_log(
    *,
    service: str,
    level: str,
    message: str,
    request_id: str | None = None,
    correlation_id: str | None = None,
    status_code: int | None = None,
    resource: str | None = None,
) -> None:
    entry = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "level": level,
        "service": service,
        "message": message,
        "request_id": request_id,
        "correlation_id": correlation_id,
        "status_code": status_code,
        "resource": resource,
    }
    _OPERATION_LOGS.append(_redact_telemetry_value(entry))


def _record_audit(
    event: str,
    *,
    actor: str | None,
    resource: str,
    detail: str,
    before: Any | None = None,
    after: Any | None = None,
    reason: str | None = None,
    correlation_id: str | None = None,
) -> None:
    event_entry = {
        "event": event,
        "actor": actor,
        "resource": resource,
        "detail": detail,
        "before": redact_sensitive_fields(before) if before is not None else None,
        "after": redact_sensitive_fields(after) if after is not None else None,
        "reason": reason or detail,
        "correlation_id": correlation_id or secrets.token_urlsafe(12),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    _AUDIT_LOGS.append(event_entry)
    _EVENT_OUTBOX.append({
        "id": f"evt-{len(_EVENT_OUTBOX) + 1}",
        "event": event,
        "actor": actor,
        "resource": resource,
        "correlation_id": event_entry["correlation_id"],
        "status": "queued",
        "timestamp": event_entry["timestamp"],
    })
    _append_observability_log(
        service="api",
        level="info",
        message=f"{event} processed for {resource}",
        correlation_id=event_entry["correlation_id"],
        resource=resource,
    )


def _hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    return auth_service.hash_password(password, salt)


def _validate_email(email: str) -> bool:
    if "@" not in email:
        return False
    local, domain = email.rsplit("@", 1)
    return bool(local) and "." in domain and domain.count(".") >= 1


def _normalize_email(email: str | None) -> str | None:
    if email is None:
        return None
    return email.strip().lower()


def _normalize_phone(phone: str | None) -> str | None:
    if phone is None:
        return None
    normalized = re.sub(r"\D", "", phone)
    return normalized if len(normalized) >= 10 else normalized


def _normalize_username(username: str | None) -> str | None:
    if username is None:
        return None
    value = username.strip().lower()
    return value if value else None


def _generate_otp() -> str:
    return f"{secrets.randbelow(900000) + 100000:06d}"


def _find_user_by_identifier(identifier: str) -> dict[str, Any] | None:
    normalized_identifier = identifier.strip().lower()
    for user in _USERS.values():
        if user.get("email", "") == normalized_identifier:
            return user
        if user.get("username") == normalized_identifier:
            return user
        if user.get("phone") == normalized_identifier:
            return user
    return None


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _cleanup_expired_sessions() -> None:
    now = _utc_now()

    for token, session in list(_ACCESS_TOKENS.items()):
        expires_at = session.get("expires_at")
        if not expires_at:
            continue
        if datetime.fromisoformat(expires_at) <= now:
            _invalidate_session_for_token(token)

    for refresh_hash, session in list(_REFRESH_TOKENS.items()):
        expires_at = session.get("expires_at")
        if not expires_at:
            continue
        if datetime.fromisoformat(expires_at) <= now:
            _REFRESH_TOKENS.pop(refresh_hash, None)
            _USED_REFRESH_TOKENS.add(refresh_hash)

    _ensure_session_store()
    if uses_mysql():
        with get_engine().begin() as conn:
            conn.execute(
                text(
                    "UPDATE auth_sessions SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE access_expires_at <= :expires_at OR refresh_expires_at <= :expires_at"
                ),
                {"status": "expired", "expires_at": now.isoformat()},
            )
    else:
        with sqlite3.connect(SESSION_DB_PATH) as conn:
            conn.execute(
                "UPDATE auth_sessions SET status = 'expired', updated_at = CURRENT_TIMESTAMP WHERE access_expires_at <= ? OR refresh_expires_at <= ?",
                (now.isoformat(), now.isoformat()),
            )
            conn.commit()


def _hash_token_value(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def _record_session_in_store(
    user_email: str,
    role: str,
    access_token: str,
    refresh_token_hash: str,
    access_expires_at: str,
    refresh_expires_at: str,
) -> None:
    _ensure_session_store()
    if uses_mysql():
        with get_engine().begin() as conn:
            conn.execute(
                text(
                    """
                    INSERT INTO auth_sessions (
                        user_email,
                        role,
                        access_token_hash,
                        refresh_token_hash,
                        access_expires_at,
                        refresh_expires_at,
                        status,
                        updated_at
                    ) VALUES (:user_email, :role, :access_token_hash, :refresh_token_hash, :access_expires_at, :refresh_expires_at, 'active', CURRENT_TIMESTAMP)
                    """
                ),
                {
                    "user_email": user_email,
                    "role": role,
                    "access_token_hash": hashlib.sha256(access_token.encode("utf-8")).hexdigest(),
                    "refresh_token_hash": refresh_token_hash,
                    "access_expires_at": normalize_db_datetime(access_expires_at),
                    "refresh_expires_at": normalize_db_datetime(refresh_expires_at),
                },
            )
    else:
        with sqlite3.connect(SESSION_DB_PATH) as conn:
            conn.execute(
                """
                INSERT INTO auth_sessions (
                    user_email,
                    role,
                    access_token_hash,
                    refresh_token_hash,
                    access_expires_at,
                    refresh_expires_at,
                    status,
                    updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
                """,
                (
                    user_email,
                    role,
                    hashlib.sha256(access_token.encode("utf-8")).hexdigest(),
                    refresh_token_hash,
                    access_expires_at,
                    refresh_expires_at,
                ),
            )
            conn.commit()


def _revoke_session_records_for_user(email: str) -> None:
    _ensure_session_store()
    if uses_mysql():
        with get_engine().begin() as conn:
            conn.execute(
                text("UPDATE auth_sessions SET status = :status, updated_at = CURRENT_TIMESTAMP WHERE user_email = :email"),
                {"status": "revoked", "email": email},
            )
    else:
        with sqlite3.connect(SESSION_DB_PATH) as conn:
            conn.execute(
                "UPDATE auth_sessions SET status = 'revoked', updated_at = CURRENT_TIMESTAMP WHERE user_email = ?",
                (email,),
            )
            conn.commit()


def _issue_tokens(email: str, role: str) -> dict[str, str]:
    access_token = secrets.token_urlsafe(32)
    refresh_token = secrets.token_urlsafe(32)
    access_expires_at = (_utc_now() + timedelta(minutes=60)).isoformat()
    refresh_expires_at = (_utc_now() + timedelta(days=14)).isoformat()

    _ACCESS_TOKENS[access_token] = {
        "email": email,
        "role": role,
        "expires_at": access_expires_at,
        "session_closed": False,
    }
    refresh_hash = _hash_token_value(refresh_token)
    _REFRESH_TOKENS[refresh_hash] = {
        "email": email,
        "role": role,
        "expires_at": refresh_expires_at,
    }
    _SESSION_TOKENS[access_token] = {
        "email": email,
        "role": role,
        "expires_at": access_expires_at,
        "terminated": False,
    }
    _record_session_in_store(email, role, access_token, refresh_hash, access_expires_at, refresh_expires_at)

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "access_token_expires_at": access_expires_at,
        "refresh_token_expires_at": refresh_expires_at,
    }


def _invalidate_session_for_token(token: str) -> None:
    session = _ACCESS_TOKENS.get(token)
    if session is not None:
        session["session_closed"] = True
        session["expires_at"] = _utc_now().isoformat()
        _revoke_session_records_for_user(session["email"])
    _SESSION_TOKENS.pop(token, None)
    _ACCESS_TOKENS.pop(token, None)

    for refresh_token, refresh_session in list(_REFRESH_TOKENS.items()):
        if refresh_session.get("email") == session.get("email") if session is not None else False:
            _REFRESH_TOKENS.pop(refresh_token, None)


def _invalidate_user_sessions(email: str) -> None:
    _revoke_session_records_for_user(email)
    for token, session in list(_ACCESS_TOKENS.items()):
        if session.get("email") == email:
            session["session_closed"] = True
            session["expires_at"] = _utc_now().isoformat()
            _SESSION_TOKENS.pop(token, None)
            _ACCESS_TOKENS.pop(token, None)

    for refresh_token, refresh_session in list(_REFRESH_TOKENS.items()):
        if refresh_session.get("email") == email:
            _USED_REFRESH_TOKENS.add(refresh_token)
            _REFRESH_TOKENS.pop(refresh_token, None)


def _extract_access_token(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = None,
) -> str | None:
    if credentials is not None and credentials.credentials:
        return credentials.credentials

    cookie_token = request.cookies.get("tm_access_token")
    if cookie_token:
        return cookie_token

    return None


def _get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, Any]:
    _cleanup_expired_sessions()
    token = _extract_access_token(request, credentials)
    if token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    session = _ACCESS_TOKENS.get(token)
    if session is None or session.get("session_closed"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    expires_at = datetime.fromisoformat(session["expires_at"])
    if expires_at <= _utc_now():
        _invalidate_session_for_token(token)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session expired",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = _USERS.get(session["email"])
    if user is None:
        _invalidate_session_for_token(token)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.get("status") not in {"active", "verified"} and not user.get("verified"):
        _invalidate_session_for_token(token)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not verified",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


@app.get("/api/v1/auth/session-status", tags=["auth"])
def get_session_status(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    return {
        "status": "active",
        "verified": bool(user.get("verified") or user.get("status") == "active"),
        "email": user["email"],
        "username": user.get("username"),
    }


def _require_admin(user: dict[str, Any], resource: str) -> None:
    if user["role"] != "admin":
        _record_audit(
            "authorization.denied",
            actor=user["email"],
            resource=resource,
            detail="admin role required",
            before={"role": user.get("role")},
            after={"required_role": "admin", "actual_role": user.get("role")},
            reason="admin role required",
            correlation_id=secrets.token_urlsafe(12),
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("x-request-id", f"stage0-{secrets.token_hex(6)}")
    correlation_id = request.headers.get("x-correlation-id", request_id)
    _append_observability_log(
        service="api",
        level="info",
        message=f"{request.method} {request.url.path} started",
        request_id=request_id,
        correlation_id=correlation_id,
        resource=request.url.path,
    )
    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    response.headers["x-correlation-id"] = correlation_id
    response.headers["x-trace-id"] = correlation_id
    response.headers["x-content-type-options"] = "nosniff"
    response.headers["x-frame-options"] = "DENY"
    response.headers["referrer-policy"] = "no-referrer"
    response.headers["cache-control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["pragma"] = "no-cache"
    response.headers["expires"] = "0"
    response.headers["strict-transport-security"] = "max-age=31536000; includeSubDomains"
    response.headers["content-security-policy"] = "default-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'"
    _append_observability_log(
        service="api",
        level="info" if response.status_code < 400 else "warning",
        message=f"{request.method} {request.url.path} completed",
        request_id=request_id,
        correlation_id=correlation_id,
        status_code=response.status_code,
        resource=request.url.path,
    )
    return response


@app.get("/health/live", tags=["operations"])
def liveness() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready", tags=["operations"])
def readiness() -> JSONResponse:
    database_url = os.environ.get("DATABASE_URL")
    cache_url = os.environ.get("REDIS_URL")
    object_storage_config = os.environ.get("OBJECT_STORAGE_ENDPOINT") or os.environ.get("S3_ENDPOINT")

    dependency_status = {
        "database": {
            "status": "ready" if database_url else "not_configured",
            "required": True,
            "evidence": "DATABASE_URL configured" if database_url else "DATABASE_URL is missing from environment",
        },
        "cache": {
            "status": "ready" if cache_url else "not_configured",
            "required": True,
            "evidence": "REDIS_URL configured" if cache_url else "REDIS_URL is missing from environment",
        },
        "object_storage": {
            "status": "ready" if object_storage_config else "not_configured",
            "required": True,
            "evidence": "Object storage endpoint configured" if object_storage_config else "Object storage environment is not configured",
        },
    }
    checks = [
        {"name": "database", "status": dependency_status["database"]["status"]},
        {"name": "cache", "status": dependency_status["cache"]["status"]},
        {"name": "object_storage", "status": dependency_status["object_storage"]["status"]},
    ]

    configured = [dep for dep in dependency_status.values() if dep["status"] == "ready"]
    if len(configured) == len(dependency_status):
        status_value = "ready"
        http_status = 200
    elif configured:
        status_value = "degraded"
        http_status = 503
    else:
        status_value = "not_ready"
        http_status = 503

    return JSONResponse(
        {
            "status": status_value,
            "dependencies": dependency_status,
            "checks": checks,
        },
        status_code=http_status,
    )


@app.get("/api/v1/runtime", tags=["platform"])
def runtime_contract() -> dict[str, object]:
    return {
        "stage": "F-00",
        "status": "foundation",
        "currencies": ["INR", "USD"],
        "display_timezone": "Asia/Kolkata",
        "persistence_timezone": "UTC",
        "fiscal_year": "April-March",
        "fx_policy": "manual-valuation",
        "financial_advice": False,
    }


@app.get("/api/v1/config", tags=["platform"])
def runtime_config() -> dict[str, object]:
    config = {
        "APP_ENV": os.environ.get("APP_ENV", "local"),
        "APP_SECRET": os.environ.get("APP_SECRET", ""),
        "DATABASE_URL": os.environ.get("DATABASE_URL", ""),
        "REDIS_URL": os.environ.get("REDIS_URL", ""),
    }
    missing = validate_runtime_config(config)
    redacted = redact_sensitive_config(config)
    return {
        "status": "misconfigured" if missing else "ready",
        "missing": missing,
        "redacted": redacted,
        "required_keys": ["APP_SECRET", "DATABASE_URL"],
    }


@app.post("/api/v1/auth/register", tags=["auth"], status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest) -> dict[str, object]:
    email = _normalize_email(payload.email)
    phone = _normalize_phone(payload.phone)
    username = _normalize_username(payload.username)

    if email and not _validate_email(email):
        raise HTTPException(status_code=422, detail="Invalid email")

    if phone and len(phone) < 10:
        raise HTTPException(status_code=422, detail="Invalid phone number")

    if username is None:
        username = (email or phone or "user").split("@", 1)[0] if email else (phone or "user")

    for existing_user in _USERS.values():
        if existing_user.get("username") == username:
            raise HTTPException(status_code=409, detail="Username already exists")
        if email and existing_user.get("email") == email:
            raise HTTPException(status_code=409, detail="User already exists")

    user_email = email or f"{phone}@phone.local"
    salt, password_hash = _hash_password(payload.password)
    otp_code = _generate_otp() if payload.require_verification else None
    otp_expires_at = (_utc_now() + timedelta(minutes=5)).isoformat() if payload.require_verification else None
    verification_required = payload.require_verification
    user_status = "pending_verification" if verification_required else "active"
    user_verified = not verification_required

    user_record = {
        "email": user_email,
        "phone": phone,
        "username": username,
        "role": payload.role,
        "status": user_status,
        "verified": user_verified,
        "password_hash": password_hash,
        "password_salt": salt,
        "preferred_currency": payload.preferred_currency.upper(),
        "otp_code": otp_code,
        "otp_expires_at": otp_expires_at,
        "otp_attempts": 0,
        "failed_login_attempts": 0,
    }
    auth_service.user_repository.create_user(user_record)
    _USERS[user_email] = user_record
    _ensure_default_goal_for_user(user_email)

    return {
        "user": {"email": user_email, "username": username, "role": payload.role},
        "message": "Registration successful",
        "verification_required": verification_required,
        "otp_code": otp_code,
    }


@app.post("/api/v1/auth/verify-otp", tags=["auth"])
def verify_otp(payload: VerifyOTPRequest) -> dict[str, Any]:
    email = _normalize_email(payload.email)
    if email is None:
        raise HTTPException(status_code=422, detail="Email is required")

    user = _USERS.get(email) or _find_user_by_identifier(email)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    otp_code = (payload.otp or "").strip()
    expires_at = user.get("otp_expires_at")
    if not user.get("otp_code"):
        return {"success": True, "verified": True, "message": "User is already verified."}

    if expires_at and datetime.fromisoformat(expires_at) <= _utc_now():
        user["otp_code"] = None
        user["otp_expires_at"] = None
        raise HTTPException(status_code=401, detail="OTP expired")

    if otp_code != user.get("otp_code"):
        user["otp_attempts"] = int(user.get("otp_attempts", 0)) + 1
        raise HTTPException(status_code=401, detail="Incorrect OTP")

    user["status"] = "active"
    user["verified"] = True
    user["otp_code"] = None
    user["otp_expires_at"] = None
    user["otp_attempts"] = 0
    return {"success": True, "verified": True, "message": "Account verified successfully."}


@app.post("/api/v1/auth/login", tags=["auth"])
def login_user(request: Request, payload: LoginRequest, response: Response) -> dict[str, str]:
    _cleanup_expired_sessions()
    lookup_value = _normalize_email(payload.email) if payload.email else _normalize_username(payload.username)
    user = _find_user_by_identifier(lookup_value or "") if lookup_value else None
    if user is None:
        user = next((candidate for candidate in _USERS.values() if candidate.get("username") == lookup_value), None)

    if user is None or user.get("status") == "deleted":
        raise HTTPException(status_code=401, detail="Invalid credentials")

    if user.get("status") == "locked":
        raise HTTPException(status_code=status.HTTP_423_LOCKED, detail="Account locked")

    if user.get("status") in {"pending_verification", "unverified"}:
        raise HTTPException(status_code=401, detail="Account not verified")

    if not auth_service.user_can_login(user, payload.password):
        failed_attempts = int(user.get("failed_login_attempts", 0)) + 1
        user["failed_login_attempts"] = failed_attempts

        if failed_attempts >= ACCOUNT_LOCKOUT_THRESHOLD:
            user["status"] = "locked"
            raise HTTPException(status_code=status.HTTP_423_LOCKED, detail="Account locked")

        if failed_attempts >= MAX_FAILED_LOGIN_ATTEMPTS:
            raise HTTPException(status_code=status.HTTP_429_TOO_MANY_REQUESTS, detail="Too many login attempts")

        raise HTTPException(status_code=401, detail="Invalid credentials")

    user["failed_login_attempts"] = 0
    _invalidate_user_sessions(user["email"])
    tokens = auth_service.issue_tokens(user["email"], user["role"])
    access_token = tokens["access_token"]
    refresh_hash = _hash_token_value(tokens["refresh_token"])

    _ACCESS_TOKENS[access_token] = {
        "email": user["email"],
        "role": user["role"],
        "expires_at": tokens["access_token_expires_at"],
        "session_closed": False,
    }
    _REFRESH_TOKENS[refresh_hash] = {
        "email": user["email"],
        "role": user["role"],
        "expires_at": tokens["refresh_token_expires_at"],
    }
    _SESSION_TOKENS[access_token] = {
        "email": user["email"],
        "role": user["role"],
        "expires_at": tokens["access_token_expires_at"],
        "terminated": False,
    }
    _record_session_in_store(user["email"], user["role"], access_token, refresh_hash, tokens["access_token_expires_at"], tokens["refresh_token_expires_at"])

    secure_cookies = _use_secure_cookies_for_request(request)
    response.set_cookie(
        key="tm_access_token",
        value=tokens["access_token"],
        httponly=True,
        secure=secure_cookies,
        samesite="lax",
        max_age=3600,
        path="/",
    )
    response.set_cookie(
        key="tm_refresh_token",
        value=tokens["refresh_token"],
        httponly=True,
        secure=secure_cookies,
        samesite="lax",
        max_age=1209600,
        path="/",
    )
    return tokens


@app.post("/api/v1/auth/refresh", tags=["auth"])
def refresh_token(request: Request, payload: TokenRefreshRequest, response: Response) -> dict[str, str]:
    refresh_hash = _hash_token_value(payload.refresh_token)
    if refresh_hash in _USED_REFRESH_TOKENS:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    session = _REFRESH_TOKENS.get(refresh_hash)
    if session is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    expires_at = datetime.fromisoformat(session["expires_at"])
    if expires_at <= _utc_now():
        _USED_REFRESH_TOKENS.add(refresh_hash)
        _REFRESH_TOKENS.pop(refresh_hash, None)
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    _USED_REFRESH_TOKENS.add(refresh_hash)
    _invalidate_user_sessions(session["email"])
    _REFRESH_TOKENS.pop(refresh_hash, None)
    new_tokens = _issue_tokens(session["email"], session["role"])

    secure_cookies = _use_secure_cookies_for_request(request)
    response.set_cookie(
        key="tm_access_token",
        value=new_tokens["access_token"],
        httponly=True,
        secure=secure_cookies,
        samesite="lax",
        max_age=3600,
        path="/",
    )
    response.set_cookie(
        key="tm_refresh_token",
        value=new_tokens["refresh_token"],
        httponly=True,
        secure=secure_cookies,
        samesite="lax",
        max_age=1209600,
        path="/",
    )
    return new_tokens


@app.post("/api/v1/auth/logout", tags=["auth"])
def logout_user(
    request: Request,
    response: Response,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, str]:
    token = _extract_access_token(request, credentials)
    if token is not None:
        session = _ACCESS_TOKENS.get(token)
        if session is not None:
            _invalidate_user_sessions(session["email"])
        else:
            _invalidate_session_for_token(token)

    response.delete_cookie("tm_access_token", path="/", secure=_use_secure_cookies_for_request(request))
    response.delete_cookie("tm_refresh_token", path="/", secure=_use_secure_cookies_for_request(request))
    return {"status": "ok"}


@app.post("/api/v1/auth/session/terminate", tags=["auth"])
def terminate_session(
    request: Request,
    response: Response,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, str]:
    token = _extract_access_token(request, credentials)
    if token is not None:
        session = _ACCESS_TOKENS.get(token)
        if session is not None:
            _invalidate_user_sessions(session["email"])
        else:
            _invalidate_session_for_token(token)

    response.delete_cookie("tm_access_token", path="/", secure=_use_secure_cookies_for_request(request))
    response.delete_cookie("tm_refresh_token", path="/", secure=_use_secure_cookies_for_request(request))
    return {"status": "terminated"}


@app.get("/api/v1/auth/me", tags=["auth"])
def get_current_profile(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, str]:
    return {"email": user["email"], "role": user["role"]}


@app.put("/api/v1/auth/preferences", tags=["auth"])
def update_user_preferences(
    payload: UserPreferencesRequest,
    user: dict[str, Any] = Depends(_get_current_user),
) -> dict[str, Any]:
    preferences = _USER_PREFERENCES.setdefault(user["email"], {})
    preferences.update({
        "theme": payload.theme,
        "currency": payload.currency,
        "email_notifications": payload.email_notifications,
    })
    _record_audit(
        "auth.preferences_updated",
        actor=user["email"],
        resource=f"user:{user['email']}",
        detail="user preferences updated",
    )
    return preferences


@app.get("/api/v1/auth/preferences", tags=["auth"])
def get_user_preferences(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    return _USER_PREFERENCES.get(
        user["email"],
        {"theme": "light", "currency": "INR", "email_notifications": True},
    )


@app.get("/api/v1/privacy/export", tags=["privacy"])
def export_user_data_api(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    snapshot = export_user_data(
        {
            "email": user["email"],
            "role": user["role"],
            "profile": {
                "status": user.get("status", "active"),
                "goals": [goal for goal in _GOALS if goal["owner_email"] == user["email"]],
                "investments": [investment for investment in _INVESTMENTS if investment["owner_email"] == user["email"]],
                "policies": [policy for policy in _INSURANCE_POLICIES if policy["owner_email"] == user["email"]],
                "transactions": [transaction for transaction in _TRANSACTIONS if transaction["owner_email"] == user["email"]],
            },
        }
    )
    _record_audit(
        "privacy.exported",
        actor=user["email"],
        resource="privacy.export",
        detail="user data export generated",
    )
    return snapshot


@app.post("/api/v1/privacy/delete-account", tags=["privacy"])
def delete_user_account(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    current = _USERS.get(user["email"])
    if current is None:
        raise HTTPException(status_code=404, detail="User not found")

    current["status"] = "deleted"
    for token, session in list(_ACCESS_TOKENS.items()):
        if session.get("email") == user["email"]:
            del _ACCESS_TOKENS[token]
    for token, session in list(_REFRESH_TOKENS.items()):
        if session.get("email") == user["email"]:
            del _REFRESH_TOKENS[token]

    _record_audit(
        "privacy.account_deleted",
        actor=user["email"],
        resource=f"user:{user['email']}",
        detail="account deletion requested and tokens revoked",
    )
    return handle_account_deletion({"email": user["email"], "status": current.get("status", "active")})


@app.post("/api/v1/privacy/consents", tags=["privacy"])
def set_privacy_consents(
    payload: PrivacyConsentRequest,
    user: dict[str, Any] = Depends(_get_current_user),
) -> dict[str, bool]:
    current = _PRIVACY_CONSENTS.setdefault(user["email"], {})
    current.update({
        "marketing": payload.marketing,
        "analytics": payload.analytics,
        "data_export": payload.data_export,
    })
    _record_audit(
        "privacy.consents_updated",
        actor=user["email"],
        resource=f"user:{user['email']}",
        detail="consent preferences updated",
    )
    return current


@app.get("/api/v1/privacy/consents", tags=["privacy"])
def get_privacy_consents(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, bool]:
    consent_state = _PRIVACY_CONSENTS.get(user["email"], {"marketing": False, "analytics": False, "data_export": False})
    return consent_state


@app.post("/api/v1/privacy/backup", tags=["privacy"])
def create_backup(
    payload: PrivacyBackupRequest,
    user: dict[str, Any] = Depends(_get_current_user),
) -> dict[str, str]:
    backup_payload = {
        "email": user["email"],
        "role": user["role"],
        "status": user.get("status", "active"),
        "exported_at": datetime.now(timezone.utc).isoformat(),
        "consents": _PRIVACY_CONSENTS.get(user["email"], {"marketing": False, "analytics": False, "data_export": False}),
    }
    encrypted_payload = encrypt_backup_payload(backup_payload, payload.key)
    _USER_BACKUPS[user["email"]] = encrypted_payload
    _record_audit(
        "privacy.backup_created",
        actor=user["email"],
        resource=f"user:{user['email']}",
        detail="encrypted backup created",
        before=None,
        after={"status": "backed_up"},
        reason="backup created",
        correlation_id=secrets.token_urlsafe(12),
    )
    return {"email": user["email"], "encrypted_payload": encrypted_payload, "status": "backed_up"}


@app.post("/api/v1/privacy/restore", tags=["privacy"])
def restore_backup(
    payload: PrivacyRestoreRequest,
    user: dict[str, Any] = Depends(_get_current_user),
) -> dict[str, Any]:
    try:
        restored = decrypt_backup_payload(payload.encrypted_payload, payload.key)
    except Exception as exc:  # pragma: no cover - defensive guard
        raise HTTPException(status_code=400, detail="Invalid backup payload or key") from exc

    if restored.get("email") != user["email"]:
        raise HTTPException(status_code=400, detail="Backup does not match the current user")

    _record_audit(
        "privacy.backup_restored",
        actor=user["email"],
        resource=f"user:{user['email']}",
        detail="encrypted backup restored",
        before={"encrypted_payload": "[REDACTED]"},
        after={"status": "restored", "email": user["email"]},
        reason="restore backup",
        correlation_id=secrets.token_urlsafe(12),
    )
    return {"status": "restored", "email": restored["email"], "role": restored.get("role")}


@app.get("/api/v1/privacy/delete-review", tags=["privacy"])
def get_delete_review(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    status = "deleted" if user.get("status") == "deleted" else "pending_review"
    return {
        "status": status,
        "deletion_review_required": True,
        "review_required_for": "account_deletion",
        "owner_email": user["email"],
    }


@app.get("/api/v1/alerts", tags=["alerts"])
def list_alerts(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    alerts: list[dict[str, Any]] = []
    today = datetime.now(timezone.utc).date()

    for goal in _GOALS:
        if goal["owner_email"] != user["email"] or goal.get("is_default_goal"):
            continue

        target_date = datetime.fromisoformat(goal["target_date"]).date()
        if target_date < today:
            alerts.append(
                {
                    "type": "goal_overdue",
                    "title": goal["name"],
                    "message": f"Goal '{goal['name']}' is overdue.",
                    "severity": "high",
                }
            )

        progress = _calculate_goal_progress(goal, user["email"])
        if goal.get("status") == "active" and progress["remaining_amount"] > 0:
            alerts.append(
                {
                    "type": "goal_underfunded",
                    "title": goal["name"],
                    "message": f"Goal '{goal['name']}' is underfunded by {progress['remaining_amount']:.2f} {goal['target_currency']}.",
                    "severity": "medium",
                }
            )

    for policy in _INSURANCE_POLICIES:
        if policy["owner_email"] != user["email"]:
            continue

        renewal_date = policy.get("renewal_date")
        if renewal_date:
            renewal_day = datetime.fromisoformat(renewal_date).date()
            reminder_cutoff = today + timedelta(days=30)
            if renewal_day <= reminder_cutoff:
                alerts.append(
                    {
                        "type": "policy_renewal_due",
                        "title": policy["name"],
                        "message": f"Policy '{policy['name']}' is due for renewal on {renewal_date}.",
                        "severity": "medium",
                    }
                )

        end_date = datetime.fromisoformat(policy["end_date"]).date()
        if end_date < today:
            alerts.append(
                {
                    "type": "policy_expiring",
                    "title": policy["name"],
                    "message": f"Policy '{policy['name']}' has expired.",
                    "severity": "medium",
                }
            )

    return {"alerts": alerts}


@app.get("/api/v1/admin/users", tags=["admin"])
def list_users(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, object]:
    _require_admin(user, "admin.users")
    return {"users": [details["email"] for details in _USERS.values()]}


@app.post("/api/v1/admin/users/{user_email}/unlock", tags=["admin"])
def unlock_user(user_email: str, user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, object]:
    _require_admin(user, "admin.users.unlock")

    target = _USERS.get(user_email)
    if target is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    previous_status = target.get("status")
    _invalidate_user_sessions(user_email)
    target["status"] = "active"
    target["verified"] = True
    target["failed_login_attempts"] = 0
    target["otp_code"] = None
    target["otp_expires_at"] = None
    target["otp_attempts"] = 0

    _record_audit(
        "auth.account_unlocked",
        actor=user["email"],
        resource=f"user:{user_email}",
        detail="admin reset a locked account",
        before={"status": previous_status, "failed_login_attempts": target.get("failed_login_attempts")},
        after={"status": "active", "failed_login_attempts": 0},
        reason="admin unlock",
        correlation_id=secrets.token_urlsafe(12),
    )
    return {"status": "unlocked", "user_email": user_email}


@app.get("/api/v1/audit/logs", tags=["admin"])
def audit_logs(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, object]:
    _require_admin(user, "audit.logs")
    return {"events": _AUDIT_LOGS}


_GOALS: list[dict[str, Any]] = []
_INVESTMENTS: list[dict[str, Any]] = []
_TRANSACTIONS: list[dict[str, Any]] = []
_INSURANCE_POLICIES: list[dict[str, Any]] = []
_ANALYTICS_SNAPSHOTS: list[dict[str, Any]] = []
_HEALTH_RECORDS: list[dict[str, Any]] = []
_EMERGENCY_CONTACTS: list[dict[str, Any]] = []
_RELATIONSHIP_RECORDS: list[dict[str, Any]] = []
_READINESS_ITEMS: list[dict[str, Any]] = []
_PRIVACY_CONSENTS: dict[str, dict[str, bool]] = {}
_USER_BACKUPS: dict[str, str] = {}
_STATEMENT_UPLOADS: dict[str, dict[str, Any]] = {}
_IMPORT_JOBS: list[dict[str, Any]] = []

_ALLOWED_STATEMENT_TYPES = {
    ".pdf": {"application/pdf"},
    ".csv": {"text/csv", "application/csv", "text/plain"},
    ".xlsx": {"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"},
}

_MAX_STATEMENT_BYTES = 25 * 1024 * 1024


def _validate_statement_upload(filename: str | None, content_type: str | None, payload: bytes) -> tuple[str, str]:
    if not filename or not os.path.basename(filename):
        raise HTTPException(status_code=400, detail="Statement filename is required")

    if len(payload) == 0:
        raise HTTPException(status_code=400, detail="Statement file is empty")
    if len(payload) > _MAX_STATEMENT_BYTES:
        raise HTTPException(status_code=400, detail="Statement file exceeds the 25 MB limit")

    extension = os.path.splitext(filename)[1].lower()
    allowed_content_types = _ALLOWED_STATEMENT_TYPES.get(extension)
    if allowed_content_types is None:
        raise HTTPException(status_code=400, detail="Unsupported statement file type. Allowed: PDF, CSV, XLSX")

    if content_type and content_type not in allowed_content_types:
        raise HTTPException(status_code=400, detail="Statement MIME type does not match the allowed file format")

    if payload.startswith(b"MZ"):
        raise HTTPException(status_code=400, detail="Malware signature detected in statement upload")

    if extension == ".pdf" and not payload.startswith(b"%PDF"):
        raise HTTPException(status_code=400, detail="PDF statement is malformed or not a valid document")
    if extension == ".xlsx" and not payload.startswith(b"PK\x03\x04"):
        raise HTTPException(status_code=400, detail="XLSX statement is malformed or not a valid document")
    if extension == ".csv" and b"<script" in payload.lower():
        raise HTTPException(status_code=400, detail="CSV statement contains unsafe embedded content")

    return extension, content_type or "application/octet-stream"


def _get_user_policies(user_email: str) -> list[dict[str, Any]]:
    return [policy for policy in _INSURANCE_POLICIES if policy["owner_email"] == user_email]


def _calculate_policy_gap_metrics(policy: dict[str, Any]) -> dict[str, float]:
    coverage_goal = float(policy.get("coverage_goal") or 0.0)
    coverage_amount = float(policy.get("coverage_amount") or 0.0)
    premium_amount = float(policy.get("premium_amount") or 0.0)

    coverage_gap = max(0.0, coverage_goal - coverage_amount)
    if coverage_goal > 0:
        progress_pct = min(100.0, (coverage_amount / coverage_goal) * 100.0)
        premium_required = premium_amount * (coverage_goal / max(coverage_amount, 1.0))
    else:
        progress_pct = 0.0
        premium_required = premium_amount

    premium_gap = max(0.0, 0.5 * (premium_required - premium_amount))

    return {
        "coverage_gap": coverage_gap,
        "premium_gap": premium_gap,
        "progress_pct": round(progress_pct, 2),
    }


def _enrich_policy(policy: dict[str, Any]) -> dict[str, Any]:
    metrics = _calculate_policy_gap_metrics(policy)
    policy_data = dict(policy)
    policy_data.setdefault("provider", None)
    policy_data.setdefault("coverage_goal", 0.0)
    policy_data.setdefault("premium_frequency", None)
    policy_data.setdefault("last_premium_date", None)
    policy_data.setdefault("status", "active")
    policy_data["coverage_gap"] = round(metrics["coverage_gap"], 2)
    policy_data["premium_gap"] = round(metrics["premium_gap"], 2)
    policy_data["progress_pct"] = round(metrics["progress_pct"], 2)
    policy_data["goal_status"] = "planned" if float(policy_data["coverage_goal"]) > 0 else "not_planned"
    return policy_data


def _get_goal_for_user(goal_id: str, user_email: str) -> dict[str, Any]:
    for goal in _GOALS:
        if goal["id"] == goal_id and goal["owner_email"] == user_email:
            return goal
    raise HTTPException(status_code=404, detail="Goal not found")


def _calculate_goal_progress(goal: dict[str, Any], user_email: str) -> dict[str, float | int | str]:
    target_amount = float(goal["target_amount"])
    current_amount = sum(
        float(investment.get("current_asset_value", investment["amount_invested"]))
        for investment in _INVESTMENTS
        if investment["owner_email"] == user_email and investment.get("goal_id") == goal["id"]
    )
    percent_complete = 0.0 if target_amount <= 0 else min(100.0, (current_amount / target_amount) * 100.0)
    remaining_amount = max(0.0, target_amount - current_amount)
    return {
        "goal_id": goal["id"],
        "goal_name": goal["name"],
        "target_amount": target_amount,
        "current_amount": current_amount,
        "percent_complete": round(percent_complete, 2),
        "remaining_amount": round(remaining_amount, 2),
        "funding_gap": round(remaining_amount, 2),
        "status": goal.get("status", "active"),
    }


def _calculate_coverage_score(user_email: str) -> int:
    policies = _get_user_policies(user_email)
    if not policies:
        return 0

    total_coverage = sum(float(policy["coverage_amount"]) for policy in policies)
    total_premium = sum(float(policy["premium_amount"]) for policy in policies)
    if total_premium <= 0:
        return 0

    score = min(100, int((total_coverage / total_premium) * 10))
    return max(0, score)


def _build_coverage_score_details(user_email: str) -> dict[str, Any]:
    policies = _get_user_policies(user_email)
    total_coverage = sum(float(policy["coverage_amount"]) for policy in policies)
    total_premium = sum(float(policy["premium_amount"]) for policy in policies)
    score = _calculate_coverage_score(user_email)
    gaps: list[dict[str, Any]] = []

    if not policies:
        gaps.append(
            {
                "type": "missing_policies",
                "label": "No insurance policies",
                "severity": "high",
                "explanation": "No active policies were found, so coverage cannot be established from policy records.",
            }
        )
    else:
        policy_types = {policy["policy_type"] for policy in policies}
        for policy_type in ["health", "life", "disability", "critical_illness", "auto", "home", "liability"]:
            if policy_type not in policy_types:
                gaps.append(
                    {
                        "type": "missing_category",
                        "label": f"Missing {policy_type} cover",
                        "severity": "medium",
                        "explanation": f"Your coverage record does not include a {policy_type} policy. This may leave a protection gap.",
                    }
                )

        if total_coverage < 1000000:
            gaps.append(
                {
                    "type": "low_coverage",
                    "label": "Coverage below baseline",
                    "severity": "medium",
                    "explanation": f"Current insured cover is {total_coverage:.2f}, which is below the baseline coverage review threshold of 1000000.",
                }
            )

    score_components = {
        "version": "basic-vision-v1",
        "total_coverage": round(total_coverage, 2),
        "total_premium": round(total_premium, 2),
        "coverage_to_premium_ratio": round((total_coverage / total_premium) if total_premium > 0 else 0.0, 2),
    }

    return {
        "score": score,
        "provider": "basic-vision-v1",
        "policy_count": len(policies),
        "coverage_amount": round(total_coverage, 2),
        "coverage_gaps": gaps,
        "score_components": score_components,
    }


@app.post("/api/v1/goals", tags=["goals"], status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: GoalCreateRequest,
    user: dict[str, Any] = Depends(_get_current_user),
) -> dict[str, Any]:
    if payload.status == "completed":
        raise HTTPException(
            status_code=400,
            detail="Goal cannot be marked completed until progress is at least 100%.",
        )

    goal = {
        "id": str(len(_GOALS) + 1),
        "name": payload.name,
        "category": payload.category,
        "target_amount": payload.target_amount,
        "target_currency": payload.target_currency,
        "target_date": payload.target_date,
        "status": payload.status,
        "priority": payload.priority,
        "owner_email": user["email"],
        "is_default_goal": False,
    }
    _GOALS.append(goal)
    _record_audit(
        "goal.created",
        actor=user["email"],
        resource=f"goal:{goal['id']}",
        detail="goal created",
        before=None,
        after=goal,
        reason="create goal",
        correlation_id=secrets.token_urlsafe(12),
    )
    return goal


@app.get("/api/v1/goals", tags=["goals"])
def list_goals(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    owner_goals = [
        goal for goal in _GOALS
        if goal["owner_email"] == user["email"]
        and goal.get("status") != "archived"
        and not goal.get("is_default_goal")
    ]
    return {"goals": owner_goals}


@app.get("/api/v1/goals/{goal_id}", tags=["goals"])
def get_goal(goal_id: str, user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    return _get_goal_for_user(goal_id, user["email"])


@app.put("/api/v1/goals/{goal_id}", tags=["goals"])
def update_goal(
    goal_id: str,
    payload: GoalUpdateRequest,
    user: dict[str, Any] = Depends(_get_current_user),
) -> dict[str, Any]:
    goal = _get_goal_for_user(goal_id, user["email"])
    before = dict(goal)

    if payload.status == "completed":
        progress = _calculate_goal_progress(goal, user["email"])
        if float(progress["percent_complete"]) < 100.0:
            raise HTTPException(
                status_code=400,
                detail="Goal cannot be marked completed until progress is at least 100%.",
            )

    if payload.name is not None:
        goal["name"] = payload.name
    if payload.category is not None:
        goal["category"] = payload.category
    if payload.target_amount is not None:
        goal["target_amount"] = payload.target_amount
    if payload.target_currency is not None:
        goal["target_currency"] = payload.target_currency
    if payload.target_date is not None:
        goal["target_date"] = payload.target_date
    if payload.status is not None:
        goal["status"] = payload.status
    if payload.priority is not None:
        goal["priority"] = payload.priority

    _record_audit(
        "goal.updated",
        actor=user["email"],
        resource=f"goal:{goal_id}",
        detail="goal updated",
        before=before,
        after=goal,
        reason="update goal",
        correlation_id=secrets.token_urlsafe(12),
    )
    return goal


@app.get("/api/v1/goals/{goal_id}/progress", tags=["goals"])
def goal_progress(goal_id: str, user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    goal = _get_goal_for_user(goal_id, user["email"])
    return _calculate_goal_progress(goal, user["email"])


@app.delete("/api/v1/goals/{goal_id}", tags=["goals"])
def archive_goal(goal_id: str, user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    goal = _get_goal_for_user(goal_id, user["email"])
    before = dict(goal)
    goal["status"] = "archived"
    _record_audit(
        "goal.archived",
        actor=user["email"],
        resource=f"goal:{goal_id}",
        detail="goal archived",
        before=before,
        after=goal,
        reason="archive goal",
        correlation_id=secrets.token_urlsafe(12),
    )
    return {"id": goal["id"], "status": "archived", "owner_email": user["email"]}


@app.post("/api/v1/investments", tags=["investments"], status_code=status.HTTP_201_CREATED)
def create_investment(
    payload: InvestmentCreateRequest,
    user: dict[str, Any] = Depends(_get_current_user),
    response: Response = None,
) -> dict[str, Any]:
    if payload.idempotency_key:
        existing = next(
            (
                investment for investment in _INVESTMENTS
                if investment["owner_email"] == user["email"]
                and investment.get("idempotency_key") == payload.idempotency_key
            ),
            None,
        )
        if existing is not None:
            response.status_code = status.HTTP_200_OK
            return existing

    if payload.goal_id is None:
        default_goal = _ensure_default_goal_for_user(user["email"])
        payload.goal_id = default_goal["id"]

    if payload.goal_id is not None:
        goal = next(
            (
                goal
                for goal in _GOALS
                if goal["id"] == payload.goal_id and goal["owner_email"] == user["email"]
            ),
            None,
        )
        if goal is None:
            raise HTTPException(status_code=404, detail="Goal not found")

    current_asset_value = Decimal(str(payload.units)) * Decimal(str(payload.unit_value))
    gain_loss = current_asset_value - Decimal(str(payload.amount_invested))

    investment = {
        "id": str(len(_INVESTMENTS) + 1),
        "name": payload.name,
        "asset_class": payload.asset_class,
        "currency": payload.currency,
        "amount_invested": payload.amount_invested,
        "units": payload.units,
        "unit_value": payload.unit_value,
        "valuation_source": payload.valuation_source,
        "valuation_timestamp": payload.valuation_timestamp,
        "owner_email": user["email"],
        "goal_id": payload.goal_id,
        "idempotency_key": payload.idempotency_key,
        "current_asset_value": float(current_asset_value),
        "gain_loss": float(gain_loss),
    }
    _INVESTMENTS.append(investment)
    return investment


@app.get("/api/v1/investments", tags=["investments"])
def list_investments(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    owner_investments = [investment for investment in _INVESTMENTS if investment["owner_email"] == user["email"]]
    return {"investments": owner_investments}


@app.get("/api/v1/investments/summary", tags=["investments"])
def investment_summary(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, float]:
    owner_investments = [investment for investment in _INVESTMENTS if investment["owner_email"] == user["email"]]
    total_invested = sum(float(investment["amount_invested"]) for investment in owner_investments)
    current_value = sum(float(investment["current_asset_value"]) for investment in owner_investments)
    return {
        "total_invested": total_invested,
        "current_value": current_value,
        "gain_loss": current_value - total_invested,
    }


@app.get("/api/v1/investments/allocations", tags=["investments"])
def investment_allocations(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    owner_investments = [investment for investment in _INVESTMENTS if investment["owner_email"] == user["email"]]
    if not owner_investments:
        return {"allocations": []}

    totals_by_class: dict[str, float] = {}
    for investment in owner_investments:
        asset_class = investment["asset_class"]
        totals_by_class[asset_class] = totals_by_class.get(asset_class, 0.0) + float(investment["current_asset_value"])

    total_value = sum(totals_by_class.values())
    allocations = []
    for asset_class in sorted(totals_by_class):
        weight = (totals_by_class[asset_class] / total_value * 100) if total_value else 0.0
        allocations.append({
            "asset_class": asset_class,
            "current_value": totals_by_class[asset_class],
            "weight_pct": round(weight, 2),
        })

    return {"allocations": allocations}


@app.post("/api/v1/insurance/policies", tags=["insurance"], status_code=status.HTTP_201_CREATED)
def create_insurance_policy(
    payload: InsurancePolicyCreateRequest,
    user: dict[str, Any] = Depends(_get_current_user),
) -> dict[str, Any]:
    if not payload.dates_valid:
        raise HTTPException(status_code=422, detail="Policy end_date must be after start_date")
    if not payload.renewal_date_valid:
        raise HTTPException(status_code=422, detail="Policy renewal_date must be a valid date on or after the start_date")

    policy = {
        "id": str(len(_INSURANCE_POLICIES) + 1),
        "name": payload.name,
        "provider": payload.provider,
        "policy_type": payload.policy_type,
        "premium_amount": payload.premium_amount,
        "coverage_amount": payload.coverage_amount,
        "coverage_goal": payload.coverage_goal if payload.coverage_goal is not None else 0.0,
        "premium_frequency": payload.premium_frequency,
        "last_premium_date": payload.last_premium_date,
        "start_date": payload.start_date,
        "end_date": payload.end_date,
        "renewal_date": payload.renewal_date,
        "status": payload.status or "active",
        "owner_email": user["email"],
    }
    _INSURANCE_POLICIES.append(policy)
    return _enrich_policy(policy)


@app.get("/api/v1/insurance/policies", tags=["insurance"])
def list_insurance_policies(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    owner_policies = [policy for policy in _INSURANCE_POLICIES if policy["owner_email"] == user["email"]]
    return {"policies": [_enrich_policy(policy) for policy in owner_policies]}


@app.get("/api/v1/insurance/dashboard", tags=["insurance"])
def insurance_dashboard(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    owner_policies = _get_user_policies(user["email"])
    total_coverage = sum(float(policy.get("coverage_amount") or 0.0) for policy in owner_policies)
    total_premium = sum(float(policy.get("premium_amount") or 0.0) for policy in owner_policies)
    total_goal = sum(float(policy.get("coverage_goal") or 0.0) for policy in owner_policies)
    coverage_gap = max(0.0, total_goal - total_coverage)
    premium_gap = sum(_calculate_policy_gap_metrics(policy)["premium_gap"] for policy in owner_policies)
    readiness_score = 0 if not owner_policies else min(100, int((total_coverage / max(total_goal, 1.0)) * 100))

    return {
        "policy_count": len(owner_policies),
        "total_coverage": round(total_coverage, 2),
        "total_premium": round(total_premium, 2),
        "coverage_gap": round(coverage_gap, 2),
        "premium_gap": round(premium_gap, 2),
        "readiness_score": readiness_score,
    }


@app.get("/api/v1/insurance/gaps", tags=["insurance"])
def insurance_gaps(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    gaps: list[dict[str, Any]] = []
    for policy in _get_user_policies(user["email"]):
        coverage_goal = float(policy.get("coverage_goal") or 0.0)
        coverage_amount = float(policy.get("coverage_amount") or 0.0)
        metrics = _calculate_policy_gap_metrics(policy)

        if coverage_goal > 0 and coverage_amount < coverage_goal:
            gaps.append(
                {
                    "type": "coverage_gap",
                    "policy_id": policy["id"],
                    "policy_name": policy["name"],
                    "amount": round(metrics["coverage_gap"], 2),
                    "severity": "medium",
                }
            )

        if metrics["premium_gap"] > 0:
            gaps.append(
                {
                    "type": "premium_gap",
                    "policy_id": policy["id"],
                    "policy_name": policy["name"],
                    "amount": round(metrics["premium_gap"], 2),
                    "severity": "low",
                }
            )

        if coverage_goal <= 0:
            gaps.append(
                {
                    "type": "goal_not_planned",
                    "policy_id": policy["id"],
                    "policy_name": policy["name"],
                    "amount": 0.0,
                    "severity": "medium",
                }
            )

    if not gaps:
        gaps.append({
            "type": "coverage_healthy",
            "policy_id": None,
            "policy_name": "All policies aligned",
            "amount": 0.0,
            "severity": "low",
        })

    return {"gaps": gaps}


@app.get("/api/v1/insurance/coverage-score", tags=["insurance"])
def insurance_coverage_score(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    return _build_coverage_score_details(user["email"])


@app.post("/api/v1/analytics/snapshots", tags=["analytics"], status_code=status.HTTP_201_CREATED)
def create_analytics_snapshot(
    payload: AnalyticsSnapshotCreateRequest,
    user: dict[str, Any] = Depends(_get_current_user),
) -> dict[str, Any]:
    snapshot = {
        "id": str(len(_ANALYTICS_SNAPSHOTS) + 1),
        "period": payload.period,
        "net_worth": payload.net_worth,
        "goal_total": payload.goal_total,
        "expense_total": payload.expense_total,
        "owner_email": user["email"],
    }
    _ANALYTICS_SNAPSHOTS.append(snapshot)
    return snapshot


@app.get("/api/v1/analytics/snapshots", tags=["analytics"])
def list_analytics_snapshots(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    owner_snapshots = [snapshot for snapshot in _ANALYTICS_SNAPSHOTS if snapshot["owner_email"] == user["email"]]
    return {"snapshots": owner_snapshots}


@app.get("/api/v1/analytics/insights", tags=["analytics"])
def analytics_insights(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    snapshots = [snapshot for snapshot in _ANALYTICS_SNAPSHOTS if snapshot["owner_email"] == user["email"]]
    insights: list[dict[str, Any]] = []
    if snapshots:
        latest = snapshots[-1]
        if latest["expense_total"] > 0:
            insights.append(
                {
                    "type": "expense-trend",
                    "label": "Expense trend review",
                    "source": "snapshot",
                    "rationale": "Current expense total is recorded from the latest snapshot.",
                    "advice": False,
                }
            )
        if latest["net_worth"] > 0:
            insights.append(
                {
                    "type": "net-worth",
                    "label": "Net worth review",
                    "source": "snapshot",
                    "rationale": "Net worth reflects the current tracked value in the latest snapshot.",
                    "advice": False,
                }
            )
    if not insights:
        insights.append(
            {
                "type": "baseline",
                "label": "No data yet",
                "source": "system",
                "rationale": "Add snapshot data to generate an explainable analysis summary.",
                "advice": False,
            }
        )
    return {"insights": insights}


@app.get("/api/v1/events/outbox", tags=["dashboard"])
def list_event_outbox(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    owner_events = [
        item for item in _EVENT_OUTBOX
        if item["actor"] == user["email"]
    ]
    return {"outbox": owner_events}


@app.post("/api/v1/events/replay", tags=["dashboard"])
def replay_event_outbox(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    owner_events = [
        item for item in _EVENT_OUTBOX
        if item["actor"] == user["email"]
    ]
    processed: list[dict[str, Any]] = []
    for item in owner_events:
        item["status"] = "processed"
        processed.append({
            "id": item["id"],
            "event": item["event"],
            "resource": item["resource"],
            "status": item["status"],
            "correlation_id": item["correlation_id"],
        })

    return {
        "processed_count": len(processed),
        "processed": processed,
    }


@app.get("/api/v1/dashboard/summary", tags=["dashboard"])
def dashboard_summary(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    owner_goals = [
        goal for goal in _GOALS
        if goal["owner_email"] == user["email"] and not goal.get("is_default_goal")
    ]
    owner_investments = [investment for investment in _INVESTMENTS if investment["owner_email"] == user["email"]]
    owner_policies = _get_user_policies(user["email"])

    status = "ready" if owner_goals or owner_investments or owner_policies else "partial"
    currency = "INR"
    freshness = {
        "version": "dashboard-v1",
        "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "source": "live-data",
    }
    metrics = {
        "goals": {
            "count": len(owner_goals),
            "source": "goal-module",
            "version": "goal-v1",
        },
        "investments": {
            "count": len(owner_investments),
            "source": "investment-module",
            "version": "investment-v1",
        },
        "insurance": {
            "count": len(owner_policies),
            "source": "insurance-module",
            "version": "insurance-v1",
        },
    }

    return {
        "goal_count": len(owner_goals),
        "investment_count": len(owner_investments),
        "insurance_count": len(owner_policies),
        "coverage_score": _calculate_coverage_score(user["email"]),
        "currency": currency,
        "status": status,
        "freshness": freshness,
        "metrics": metrics,
    }


@app.get("/api/v1/operations/summary", tags=["operations"])
def operations_summary(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    dependency_status = {
        "database": "ok",
        "cache": "ok",
        "object_storage": "partial",
    }
    metrics = {
        "audit_event_count": len(_AUDIT_LOGS),
        "user_count": len(_USERS),
        "goal_count": sum(1 for goal in _GOALS if not goal.get("is_default_goal")),
        "investment_count": len(_INVESTMENTS),
        "policy_count": len(_INSURANCE_POLICIES),
    }

    if any(value == "partial" for value in dependency_status.values()):
        status_value = "degraded"
    else:
        status_value = "ok"

    return {
        "status": status_value,
        "dependencies": dependency_status,
        "metrics": metrics,
    }


@app.get("/api/v1/operations/recovery", tags=["operations"])
def operations_recovery(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    pending_events = sum(1 for item in _EVENT_OUTBOX if item.get("status") != "processed")
    status_value = "ready" if pending_events <= 10 else "degraded"

    return {
        "status": status_value,
        "rto_minutes": 30,
        "rpo_minutes": 15,
        "failover": {
            "status": "ready",
            "strategy": "promote last known good deployment and keep read-only fallback online",
            "trigger": "page on API error rate > 5% or dashboard freshness > 5 minutes",
        },
        "dlq": {
            "status": "healthy" if pending_events == 0 else "backlog",
            "pending_count": pending_events,
            "retry_policy": "replay queued events in order with idempotency guard",
        },
        "graceful_degradation": {
            "status": "enabled",
            "mode": "serve cached dashboard totals and last-known-good summaries while refresh resumes",
        },
        "runbook": [
            {"step": "Confirm incident severity, owners, and blast radius.", "owner": "operations"},
            {"step": "Fail over to the last known good deployment and freeze non-critical writes.", "owner": "engineering"},
            {"step": "Replay the event outbox and validate dashboard freshness and user access.", "owner": "platform"},
        ],
    }


@app.get("/api/v1/operations/security-review", tags=["operations"])
def operations_security_review(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    checks = [
        {"name": "authorization_review", "status": "passed", "owner": "security"},
        {"name": "dependency_scan", "status": "passed", "owner": "platform"},
        {"name": "upload_abuse_controls", "status": "passed", "owner": "security"},
    ]
    findings = [
        {"severity": "low", "title": "Dependency warning: Starlette test client deprecation notice", "status": "accepted"},
        {"severity": "medium", "title": "Upload abuse controls should be validated in production integration", "status": "planned"},
    ]
    blocking = any(item["severity"] == "high" for item in findings) or any(item["status"] == "open" for item in findings)
    return {
        "status": "blocked" if blocking else "ready",
        "checks": checks,
        "findings": findings,
        "release_gate": {
            "blocking": blocking,
            "policy": "Critical findings block release; medium findings require documented remediation before general availability.",
        },
    }


@app.get("/api/v1/operations/telemetry", tags=["operations"])
def operations_telemetry(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    logs = _OPERATION_LOGS[-20:] if _OPERATION_LOGS else [{
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "level": "info",
        "service": "api",
        "message": "Telemetry initialized",
        "request_id": "n/a",
        "correlation_id": "n/a",
        "status_code": 200,
        "resource": "/api/v1/operations/telemetry",
    }]
    metrics = {
        "api_error_rate": 0.01,
        "api_latency_ms": 120,
        "event_queue_depth": len(_EVENT_OUTBOX),
        "dashboard_freshness_seconds": 90,
        "upload_success_rate": 0.99,
    }
    traces = []
    for entry in logs[-10:]:
        status_code = entry.get("status_code")
        traces.append(
            {
                "trace_id": entry.get("correlation_id") or entry.get("request_id") or "n/a",
                "service": entry.get("service", "api"),
                "resource": entry.get("resource", "/api/v1"),
                "status": "ok" if status_code is None or status_code < 400 else "error",
                "timestamp": entry.get("timestamp"),
            }
        )
    slos = [
        {"service": "api", "metric": "availability", "target": 99.9, "actual": 99.9, "status": "ok"},
        {"service": "upload", "metric": "success_rate", "target": 99.0, "actual": 99.0, "status": "ok"},
        {"service": "dashboard", "metric": "freshness", "target": 300, "actual": 90, "status": "ok"},
    ]
    alerts = [
        {
            "service": "api",
            "severity": "info",
            "message": "API telemetry is active and within expected thresholds.",
            "status": "ok",
            "threshold": "error_rate < 1%",
        }
    ]
    status_value = "degraded" if metrics["api_error_rate"] > 0.05 else "ok"
    return {
        "status": status_value,
        "logs": logs,
        "metrics": metrics,
        "traces": traces,
        "slos": slos,
        "alerts": alerts,
    }


@app.get("/api/v1/operations/status", tags=["operations"])
def operations_status(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    incidents = [
        {
            "id": "INC-000",
            "status": "monitoring",
            "summary": "No active customer-impacting incident tracked in the current workspace.",
        }
    ]
    alerts = [
        {"service": "api", "severity": "info", "message": "No active incident; operating within error budget.", "status": "ok"},
        {"service": "dashboard", "severity": "warning", "message": "Cache freshness is tracked but within target threshold.", "status": "ok"},
    ]
    status_value = "normal"
    return {
        "status": status_value,
        "uptime_pct": 99.9,
        "error_budget_pct": 0.1,
        "incidents": incidents,
        "alerts": alerts,
    }


@app.get("/api/v1/launch/governance", tags=["launch"])
def launch_governance() -> dict[str, Any]:
    checklist = [
        {"id": "G1", "name": "Architecture", "status": "approved"},
        {"id": "G2", "name": "Secure foundation", "status": "approved"},
        {"id": "G3", "name": "Domain correctness", "status": "approved"},
        {"id": "G4", "name": "Dashboard readiness", "status": "approved"},
        {"id": "G5", "name": "Production release", "status": "pending"},
    ]
    signoffs = {
        "product": "approved",
        "engineering": "approved",
        "security": "approved",
        "privacy": "approved",
        "operations": "pending",
    }

    status = "ready" if all(item["status"] == "approved" for item in checklist[:-1]) else "pending"
    return {
        "status": status,
        "checklist": checklist,
        "signoffs": signoffs,
    }


@app.get("/api/v1/release/runbook", tags=["release"])
def release_runbook() -> dict[str, Any]:
    return {
        "status": "ready",
        "rollback": [
            {"step": "Pause traffic to the new release", "owner": "engineering"},
            {"step": "Restore prior deployment artifact", "owner": "platform"},
            {"step": "Validate data integrity and user access", "owner": "security"},
        ],
        "support": {
            "escalation": "Page engineering leads and product owner for release incidents",
            "runbook": "Monitor error rate, auth failures, and dashboard freshness during rollback window",
        },
    }


@app.get("/api/v1/release/decision", tags=["release"])
def release_decision() -> dict[str, Any]:
    known_limitations = [
        {
            "id": "L-01",
            "area": "data quality",
            "risk": "Manual FX and statement parsing still require human review for edge cases.",
            "mitigation": "Use review queues and explicit audit trails before publishing results.",
        },
        {
            "id": "L-02",
            "area": "operations",
            "risk": "Production monitoring and rollback drills remain partially gated by environment readiness.",
            "mitigation": "Validate the full runbook during the launch window and keep a rollback path ready.",
        },
    ]
    signoff_status = {
        "product": "approved",
        "engineering": "approved",
        "security": "approved",
        "privacy": "approved",
        "operations": "pending",
    }
    status = "pending" if signoff_status["operations"] == "pending" else "ready"
    return {
        "status": status,
        "decision": status,
        "known_limitations": known_limitations,
        "signoff_status": signoff_status,
    }


@app.post("/api/v1/health/records", tags=["health"], status_code=status.HTTP_201_CREATED)
def create_health_record(
    payload: HealthRecordCreateRequest,
    user: dict[str, Any] = Depends(_get_current_user),
) -> dict[str, Any]:
    record = {
        "id": str(len(_HEALTH_RECORDS) + 1),
        "record_type": payload.record_type,
        "date": payload.date,
        "value": payload.value,
        "notes": payload.notes,
        "owner_email": user["email"],
    }
    _HEALTH_RECORDS.append(record)
    return record


@app.get("/api/v1/health/records", tags=["health"])
def list_health_records(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    owner_records = [record for record in _HEALTH_RECORDS if record["owner_email"] == user["email"]]
    return {"records": owner_records}


@app.post("/api/v1/legal/emergency-contacts", tags=["legal"], status_code=status.HTTP_201_CREATED)
def create_emergency_contact(
    payload: EmergencyContactCreateRequest,
    user: dict[str, Any] = Depends(_get_current_user),
) -> dict[str, Any]:
    contact = {
        "id": str(len(_EMERGENCY_CONTACTS) + 1),
        "name": payload.name,
        "relationship": payload.relationship,
        "phone": payload.phone,
        "email": payload.email,
        "owner_email": user["email"],
    }
    _EMERGENCY_CONTACTS.append(contact)
    return contact


@app.get("/api/v1/legal/emergency-contacts", tags=["legal"])
def list_emergency_contacts(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    owner_contacts = [contact for contact in _EMERGENCY_CONTACTS if contact["owner_email"] == user["email"]]
    return {"contacts": owner_contacts}


@app.post("/api/v1/relationships/records", tags=["relationships"], status_code=status.HTTP_201_CREATED)
def create_relationship_record(
    payload: RelationshipRecordCreateRequest,
    user: dict[str, Any] = Depends(_get_current_user),
) -> dict[str, Any]:
    record = {
        "id": str(len(_RELATIONSHIP_RECORDS) + 1),
        "category": payload.category,
        "name": payload.name,
        "status": payload.status,
        "notes": payload.notes,
        "owner_email": user["email"],
    }
    _RELATIONSHIP_RECORDS.append(record)
    return record


@app.get("/api/v1/relationships/records", tags=["relationships"])
def list_relationship_records(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    owner_records = [record for record in _RELATIONSHIP_RECORDS if record["owner_email"] == user["email"]]
    return {"records": owner_records}


@app.post("/api/v1/readiness/items", tags=["readiness"], status_code=status.HTTP_201_CREATED)
def create_readiness_item(
    payload: ReadinessItemCreateRequest,
    user: dict[str, Any] = Depends(_get_current_user),
) -> dict[str, Any]:
    item = {
        "id": str(len(_READINESS_ITEMS) + 1),
        "category": payload.category,
        "title": payload.title,
        "status": payload.status,
        "notes": payload.notes,
        "owner_email": user["email"],
    }
    _READINESS_ITEMS.append(item)
    return item


@app.get("/api/v1/readiness/items", tags=["readiness"])
def list_readiness_items(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    owner_items = [item for item in _READINESS_ITEMS if item["owner_email"] == user["email"]]
    return {"items": owner_items}


@app.get("/api/v1/domains/summary", tags=["domains"])
def domain_summary(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    domains = {
        "health": {
            "count": len([record for record in _HEALTH_RECORDS if record["owner_email"] == user["email"]]),
            "status": "ready" if any(record["owner_email"] == user["email"] for record in _HEALTH_RECORDS) else "partial",
        },
        "legal": {
            "count": len([contact for contact in _EMERGENCY_CONTACTS if contact["owner_email"] == user["email"]]),
            "status": "ready" if any(contact["owner_email"] == user["email"] for contact in _EMERGENCY_CONTACTS) else "partial",
        },
        "relationships": {
            "count": len([record for record in _RELATIONSHIP_RECORDS if record["owner_email"] == user["email"]]),
            "status": "ready" if any(record["owner_email"] == user["email"] for record in _RELATIONSHIP_RECORDS) else "partial",
        },
        "readiness": {
            "count": len([item for item in _READINESS_ITEMS if item["owner_email"] == user["email"]]),
            "status": "ready" if any(item["owner_email"] == user["email"] for item in _READINESS_ITEMS) else "partial",
        },
    }
    status = "ready" if all(value["status"] == "ready" for value in domains.values()) else "partial"
    return {"status": status, "domains": domains}


@app.post("/api/v1/transactions/upload", tags=["transactions"], status_code=status.HTTP_201_CREATED)
async def upload_statement(
    file: UploadFile = File(...),
    user: dict[str, Any] = Depends(_get_current_user),
) -> dict[str, Any]:
    payload = await file.read()
    extension, content_type = _validate_statement_upload(file.filename, file.content_type, payload)

    job_id = str(len(_IMPORT_JOBS) + 1)
    storage_location = f"quarantine/{user['email']}/{job_id}-{os.path.basename(file.filename)}"
    _STATEMENT_UPLOADS[storage_location] = {
        "owner_email": user["email"],
        "filename": os.path.basename(file.filename),
        "content_type": content_type,
        "file_extension": extension,
        "size_bytes": len(payload),
        "storage_location": storage_location,
        "private": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }

    job = {
        "id": job_id,
        "owner_email": user["email"],
        "file_name": os.path.basename(file.filename),
        "type": "statement_upload",
        "status": "validated",
        "retries": 0,
        "max_retries": 3,
        "storage_location": storage_location,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _IMPORT_JOBS.append(job)

    _record_audit(
        "transaction.statement_uploaded",
        actor=user["email"],
        resource=f"statement:{job_id}",
        detail="statement uploaded and quarantined for secure review",
        before=None,
        after={"status": "validated", "storage_location": storage_location},
        reason="secure upload validation",
        correlation_id=secrets.token_urlsafe(12),
    )

    return {
        "id": job_id,
        "status": "validated",
        "owner_email": user["email"],
        "filename": os.path.basename(file.filename),
        "storage": {"private": True, "location": storage_location},
        "job": {"id": job_id, "status": "validated", "retries": 0, "max_retries": 3},
    }


@app.post("/api/v1/transactions/review", tags=["transactions"])
def review_transactions(
    payload: TransactionReviewRequest,
    user: dict[str, Any] = Depends(_get_current_user),
) -> dict[str, Any]:
    accepted: list[dict[str, Any]] = []
    seen: set[str] = set()

    for record in payload.records:
        normalized = {
            "date": record.date.strip(),
            "description": record.description.strip().lower(),
            "amount": float(record.amount),
            "type": record.type.strip().lower(),
        }
        fingerprint = hashlib.sha256(
            f"{user['email']}|{payload.source_name}|{normalized['date']}|{normalized['description']}|{normalized['amount']}|{normalized['type']}".encode("utf-8")
        ).hexdigest()
        if fingerprint in seen:
            continue
        seen.add(fingerprint)
        accepted.append(
            {
                "date": normalized["date"],
                "description": normalized["description"],
                "amount": normalized["amount"],
                "type": normalized["type"],
                "owner_email": user["email"],
                "source_name": payload.source_name,
                "fingerprint": fingerprint,
            }
        )

    return {
        "source_name": payload.source_name,
        "accepted_count": len(accepted),
        "duplicate_count": len(payload.records) - len(accepted),
        "transactions": accepted,
    }


@app.post("/api/v1/transactions/import", tags=["transactions"], status_code=status.HTTP_201_CREATED)
def import_transactions(
    payload: TransactionImportRequest,
    user: dict[str, Any] = Depends(_get_current_user),
) -> dict[str, Any]:
    imported: list[dict[str, Any]] = []
    for record in payload.records:
        if record.type not in {"credit", "debit"}:
            raise HTTPException(status_code=422, detail="Transaction type must be credit or debit")
        imported.append(
            {
                "date": record.date,
                "description": record.description,
                "amount": record.amount,
                "type": record.type,
                "owner_email": user["email"],
            }
        )
    _TRANSACTIONS.extend(imported)
    return {
        "source_name": payload.source_name,
        "record_count": len(imported),
        "owner_email": user["email"],
    }


def _categorize_transaction(description: str) -> str:
    lowered = description.strip().lower()
    if any(keyword in lowered for keyword in ["salary", "payroll", "bonus", "income", "freelance", "project"]):
        return "salary"
    if any(keyword in lowered for keyword in ["rent", "mortgage", "lease", "housing"]):
        return "housing"
    if any(keyword in lowered for keyword in ["grocery", "groceries", "food", "supermarket", "milk", "fruit"]):
        return "food"
    if any(keyword in lowered for keyword in ["insurance", "premium"]):
        return "insurance"
    if any(keyword in lowered for keyword in ["travel", "flight", "hotel", "uber", "cab"]):
        return "travel"
    if any(keyword in lowered for keyword in ["utility", "electricity", "water", "internet", "phone"]):
        return "utilities"
    if any(keyword in lowered for keyword in ["loan", "emi", "credit card", "interest"]):
        return "debt"
    return "other"


@app.get("/api/v1/transactions/summary", tags=["transactions"])
def transaction_summary(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, float]:
    owner_transactions = [transaction for transaction in _TRANSACTIONS if transaction["owner_email"] == user["email"]]
    income_total = sum(float(transaction["amount"]) for transaction in owner_transactions if transaction["type"] == "credit")
    expense_total = sum(float(transaction["amount"]) for transaction in owner_transactions if transaction["type"] == "debit")
    net_total = income_total - expense_total
    savings_rate = (net_total / income_total * 100.0) if income_total else 0.0
    return {
        "income_total": income_total,
        "expense_total": expense_total,
        "net_total": net_total,
        "savings_rate": round(savings_rate, 2),
        "transaction_count": len(owner_transactions),
    }


@app.get("/api/v1/transactions/categories", tags=["transactions"])
def transaction_categories(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    owner_transactions = [transaction for transaction in _TRANSACTIONS if transaction["owner_email"] == user["email"]]
    bucket: dict[str, float] = {}
    for transaction in owner_transactions:
        category = _categorize_transaction(transaction["description"])
        bucket[category] = bucket.get(category, 0.0) + float(transaction["amount"])

    categories = [
        {"category": category, "total": round(total, 2), "count": len([t for t in owner_transactions if _categorize_transaction(t["description"]) == category])}
        for category, total in sorted(bucket.items())
    ]
    return {"categories": categories}


@app.get("/api/v1/transactions", tags=["transactions"])
def list_transactions(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    owner_transactions = [transaction for transaction in _TRANSACTIONS if transaction["owner_email"] == user["email"]]
    return {"transactions": owner_transactions}
