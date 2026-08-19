import hashlib
import hmac
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Literal

from fastapi import Depends, FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, Field

app = FastAPI(title="ThriveMatrix API", version="0.1.0", docs_url="/docs")
security = HTTPBearer(auto_error=False)

_USERS: dict[str, dict[str, Any]] = {}
_ACCESS_TOKENS: dict[str, dict[str, Any]] = {}
_REFRESH_TOKENS: dict[str, dict[str, Any]] = {}
_AUDIT_LOGS: list[dict[str, Any]] = []


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=8)
    role: Literal["user", "admin"] = "user"


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenRefreshRequest(BaseModel):
    refresh_token: str


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
    required = ["APP_SECRET", "DATABASE_URL"]
    missing = [name for name in required if not config.get(name)]
    return missing


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


def _record_audit(event: str, *, actor: str | None, resource: str, detail: str) -> None:
    _AUDIT_LOGS.append(
        {
            "event": event,
            "actor": actor,
            "resource": resource,
            "detail": detail,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


def _hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    password_salt = salt or secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        password_salt.encode("utf-8"),
        100_000,
    )
    return password_salt, digest.hex()


def _validate_email(email: str) -> bool:
    if "@" not in email:
        return False
    local, domain = email.rsplit("@", 1)
    return bool(local) and "." in domain and domain.count(".") >= 1


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _issue_tokens(email: str, role: str) -> dict[str, str]:
    access_token = secrets.token_urlsafe(32)
    refresh_token = secrets.token_urlsafe(32)
    access_expires_at = (_utc_now() + timedelta(minutes=60)).isoformat()
    refresh_expires_at = (_utc_now() + timedelta(days=14)).isoformat()

    _ACCESS_TOKENS[access_token] = {
        "email": email,
        "role": role,
        "expires_at": access_expires_at,
    }
    _REFRESH_TOKENS[refresh_token] = {
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


def _get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict[str, Any]:
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    session = _ACCESS_TOKENS.get(token)
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    expires_at = datetime.fromisoformat(session["expires_at"])
    if expires_at <= _utc_now():
        del _ACCESS_TOKENS[token]
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return _USERS[session["email"]]


def _require_admin(user: dict[str, Any], resource: str) -> None:
    if user["role"] != "admin":
        _record_audit(
            "authorization.denied",
            actor=user["email"],
            resource=resource,
            detail="admin role required",
        )
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = request.headers.get("x-request-id", "stage0-local")
    response = await call_next(request)
    response.headers["x-request-id"] = request_id
    response.headers["x-content-type-options"] = "nosniff"
    response.headers["x-frame-options"] = "DENY"
    response.headers["referrer-policy"] = "no-referrer"
    return response


@app.get("/health/live", tags=["operations"])
def liveness() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/ready", tags=["operations"])
def readiness() -> JSONResponse:
    return JSONResponse(
        {"status": "not_ready", "dependencies": "not-configured"},
        status_code=503,
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


@app.post("/api/v1/auth/register", tags=["auth"], status_code=status.HTTP_201_CREATED)
def register_user(payload: RegisterRequest) -> dict[str, object]:
    if not _validate_email(payload.email):
        raise HTTPException(status_code=422, detail="Invalid email")

    email = payload.email.lower().strip()
    if email in _USERS:
        raise HTTPException(status_code=409, detail="User already exists")

    salt, password_hash = _hash_password(payload.password)
    _USERS[email] = {
        "email": email,
        "role": payload.role,
        "password_hash": password_hash,
        "password_salt": salt,
    }

    return {
        "user": {"email": email, "role": payload.role},
        "message": "Registration successful",
    }


@app.post("/api/v1/auth/login", tags=["auth"])
def login_user(payload: LoginRequest) -> dict[str, str]:
    email = payload.email.lower().strip()
    user = _USERS.get(email)

    if user is None:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    _, expected_hash = _hash_password(payload.password, user["password_salt"])
    if not hmac.compare_digest(expected_hash, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    tokens = _issue_tokens(email, user["role"])
    return tokens


@app.post("/api/v1/auth/refresh", tags=["auth"])
def refresh_token(payload: TokenRefreshRequest) -> dict[str, str]:
    session = _REFRESH_TOKENS.get(payload.refresh_token)
    if session is None:
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    expires_at = datetime.fromisoformat(session["expires_at"])
    if expires_at <= _utc_now():
        del _REFRESH_TOKENS[payload.refresh_token]
        raise HTTPException(status_code=401, detail="Invalid refresh token")

    new_tokens = _issue_tokens(session["email"], session["role"])
    del _REFRESH_TOKENS[payload.refresh_token]
    return new_tokens


@app.post("/api/v1/auth/logout", tags=["auth"])
def logout_user(credentials: HTTPAuthorizationCredentials | None = Depends(security)) -> dict[str, str]:
    if credentials is None:
        return {"status": "ok"}

    token = credentials.credentials
    _ACCESS_TOKENS.pop(token, None)
    return {"status": "ok"}


@app.get("/api/v1/auth/me", tags=["auth"])
def get_current_profile(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, str]:
    return {"email": user["email"], "role": user["role"]}


@app.get("/api/v1/admin/users", tags=["admin"])
def list_users(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, object]:
    _require_admin(user, "admin.users")
    return {"users": [details["email"] for details in _USERS.values()]}


@app.get("/api/v1/audit/logs", tags=["admin"])
def audit_logs(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, object]:
    _require_admin(user, "audit.logs")
    return {"events": _AUDIT_LOGS}
