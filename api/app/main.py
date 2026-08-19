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
_USER_PREFERENCES: dict[str, dict[str, Any]] = {}


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3)
    password: str = Field(min_length=8)
    role: Literal["user", "admin"] = "user"


class LoginRequest(BaseModel):
    email: str
    password: str


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


class InvestmentCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    asset_class: str = Field(min_length=1, max_length=100)
    currency: str = Field(min_length=3, max_length=3)
    amount_invested: float = Field(gt=0)
    units: float = Field(gt=0)
    unit_value: float = Field(gt=0)
    valuation_source: str = Field(min_length=1, max_length=100)
    valuation_timestamp: str


class TransactionRecord(BaseModel):
    date: str
    description: str = Field(min_length=1, max_length=200)
    amount: float = Field(gt=0)
    type: str


class TransactionImportRequest(BaseModel):
    source_name: str = Field(min_length=1, max_length=200)
    records: list[TransactionRecord]


class InsurancePolicyCreateRequest(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    policy_type: Literal["health", "life", "disability", "critical_illness", "auto", "home", "liability"]
    premium_amount: float = Field(gt=0)
    coverage_amount: float = Field(gt=0)
    start_date: str
    end_date: str

    @property
    def dates_valid(self) -> bool:
        try:
            start = datetime.fromisoformat(self.start_date)
            end = datetime.fromisoformat(self.end_date)
            return end > start
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
        "status": "active",
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

    if user is None or user.get("status") == "deleted":
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


@app.get("/api/v1/alerts", tags=["alerts"])
def list_alerts(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    alerts: list[dict[str, Any]] = []
    today = datetime.now(timezone.utc).date()

    for goal in _GOALS:
        if goal["owner_email"] != user["email"]:
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

    for policy in _INSURANCE_POLICIES:
        if policy["owner_email"] != user["email"]:
            continue
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


def _get_user_policies(user_email: str) -> list[dict[str, Any]]:
    return [policy for policy in _INSURANCE_POLICIES if policy["owner_email"] == user_email]


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


@app.post("/api/v1/goals", tags=["goals"], status_code=status.HTTP_201_CREATED)
def create_goal(
    payload: GoalCreateRequest,
    user: dict[str, Any] = Depends(_get_current_user),
) -> dict[str, Any]:
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
    }
    _GOALS.append(goal)
    return goal


@app.get("/api/v1/goals", tags=["goals"])
def list_goals(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    owner_goals = [goal for goal in _GOALS if goal["owner_email"] == user["email"]]
    return {"goals": owner_goals}


@app.post("/api/v1/investments", tags=["investments"], status_code=status.HTTP_201_CREATED)
def create_investment(
    payload: InvestmentCreateRequest,
    user: dict[str, Any] = Depends(_get_current_user),
) -> dict[str, Any]:
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
    }
    _INVESTMENTS.append(investment)
    return investment


@app.get("/api/v1/investments", tags=["investments"])
def list_investments(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    owner_investments = [investment for investment in _INVESTMENTS if investment["owner_email"] == user["email"]]
    return {"investments": owner_investments}


@app.post("/api/v1/insurance/policies", tags=["insurance"], status_code=status.HTTP_201_CREATED)
def create_insurance_policy(
    payload: InsurancePolicyCreateRequest,
    user: dict[str, Any] = Depends(_get_current_user),
) -> dict[str, Any]:
    if not payload.dates_valid:
        raise HTTPException(status_code=422, detail="Policy end_date must be after start_date")

    policy = {
        "id": str(len(_INSURANCE_POLICIES) + 1),
        "name": payload.name,
        "policy_type": payload.policy_type,
        "premium_amount": payload.premium_amount,
        "coverage_amount": payload.coverage_amount,
        "start_date": payload.start_date,
        "end_date": payload.end_date,
        "owner_email": user["email"],
    }
    _INSURANCE_POLICIES.append(policy)
    return policy


@app.get("/api/v1/insurance/policies", tags=["insurance"])
def list_insurance_policies(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    owner_policies = [policy for policy in _INSURANCE_POLICIES if policy["owner_email"] == user["email"]]
    return {"policies": owner_policies}


@app.get("/api/v1/insurance/coverage-score", tags=["insurance"])
def insurance_coverage_score(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    policies = _get_user_policies(user["email"])
    coverage_amount = sum(float(policy["coverage_amount"]) for policy in policies)
    score = _calculate_coverage_score(user["email"])
    return {
        "score": score,
        "provider": "basic-vision-v1",
        "policy_count": len(policies),
        "coverage_amount": coverage_amount,
    }


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


@app.get("/api/v1/dashboard/summary", tags=["dashboard"])
def dashboard_summary(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, Any]:
    owner_goals = [goal for goal in _GOALS if goal["owner_email"] == user["email"]]
    owner_investments = [investment for investment in _INVESTMENTS if investment["owner_email"] == user["email"]]
    owner_policies = _get_user_policies(user["email"])

    status = "ready" if owner_goals or owner_investments or owner_policies else "partial"
    currency = "INR"
    return {
        "goal_count": len(owner_goals),
        "investment_count": len(owner_investments),
        "insurance_count": len(owner_policies),
        "coverage_score": _calculate_coverage_score(user["email"]),
        "currency": currency,
        "status": status,
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
        "goal_count": len(_GOALS),
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


@app.get("/api/v1/transactions", tags=["transactions"])
def list_transactions(user: dict[str, Any] = Depends(_get_current_user)) -> dict[str, list[dict[str, Any]]]:
    owner_transactions = [transaction for transaction in _TRANSACTIONS if transaction["owner_email"] == user["email"]]
    return {"transactions": owner_transactions}
