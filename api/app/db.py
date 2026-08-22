import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, exc, text
from sqlalchemy.engine import Engine, URL
from sqlalchemy.engine.url import make_url


def normalize_db_datetime(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.replace("Z", "+00:00")
    try:
        dt = datetime.fromisoformat(cleaned)
    except ValueError:
        return value
    if dt.tzinfo is not None:
        dt = dt.astimezone(timezone.utc).replace(tzinfo=None)
    return dt.strftime("%Y-%m-%d %H:%M:%S")


def get_database_url() -> str:
    return os.environ.get("DATABASE_URL", "sqlite:///api/data/thrivematrix_sessions.db")


def uses_mysql() -> bool:
    url = get_database_url().lower()
    return url.startswith("mysql") or url.startswith("mariadb")


def get_engine() -> Engine:
    database_url = get_database_url()
    connect_args: dict[str, Any] = {}
    if database_url.startswith("sqlite"):
        database_path = database_url.replace("sqlite:///", "", 1)
        Path(database_path).parent.mkdir(parents=True, exist_ok=True)
    return create_engine(database_url, future=True, pool_pre_ping=True, connect_args=connect_args)


def ensure_database_ready() -> None:
    database_url = get_database_url()

    if not uses_mysql():
        engine = get_engine()
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return

    parsed = make_url(database_url)
    database_name = parsed.database
    if not database_name:
        engine = get_engine()
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return

    try:
        engine = get_engine()
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return
    except exc.OperationalError as exc_info:
        message = str(exc_info.orig).lower()
        if "unknown database" not in message and "does not exist" not in message and "1049" not in message:
            raise

    server_url = parsed.set(database=None)
    server_engine = create_engine(str(server_url), future=True, pool_pre_ping=True)
    with server_engine.begin() as connection:
        connection.execute(text(f"CREATE DATABASE IF NOT EXISTS `{database_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))

    engine = get_engine()
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))


def ensure_auth_sessions_table() -> None:
    engine = get_engine()
    if uses_mysql():
        ddl = """
            CREATE TABLE IF NOT EXISTS auth_sessions (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                user_email VARCHAR(255) NOT NULL,
                role VARCHAR(64) NOT NULL,
                access_token_hash VARCHAR(255),
                refresh_token_hash VARCHAR(255),
                access_expires_at VARCHAR(255),
                refresh_expires_at VARCHAR(255),
                status VARCHAR(32) NOT NULL DEFAULT 'active',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """
    else:
        ddl = """
            CREATE TABLE IF NOT EXISTS auth_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_email TEXT NOT NULL,
                role TEXT NOT NULL,
                access_token_hash TEXT,
                refresh_token_hash TEXT,
                access_expires_at TEXT,
                refresh_expires_at TEXT,
                status TEXT NOT NULL DEFAULT 'active',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
        """
    with engine.begin() as connection:
        connection.execute(text(ddl))


def ensure_migration_bootstrap_tables() -> None:
    engine = get_engine()
    if uses_mysql():
        ddl_statements = [
            """
            CREATE TABLE IF NOT EXISTS users (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                email VARCHAR(255) NULL,
                phone VARCHAR(32) NULL,
                username VARCHAR(120) NOT NULL,
                role VARCHAR(32) NOT NULL DEFAULT 'user',
                name VARCHAR(120) NULL,
                status VARCHAR(32) NOT NULL DEFAULT 'active',
                verified BOOLEAN NOT NULL DEFAULT FALSE,
                password_hash VARCHAR(255) NOT NULL,
                password_salt VARCHAR(255) NOT NULL,
                preferred_currency CHAR(3) NOT NULL DEFAULT 'INR',
                otp_code VARCHAR(16) NULL,
                otp_expires_at DATETIME NULL,
                otp_attempts INT NOT NULL DEFAULT 0,
                failed_login_attempts INT NOT NULL DEFAULT 0,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE KEY uq_users_email (email),
                UNIQUE KEY uq_users_username (username)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS user_sessions (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                user_id BIGINT NOT NULL,
                access_token_hash VARCHAR(255) NOT NULL,
                refresh_token_hash VARCHAR(255) NOT NULL,
                access_expires_at DATETIME NOT NULL,
                refresh_expires_at DATETIME NOT NULL,
                status VARCHAR(32) NOT NULL DEFAULT 'active',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS audit_logs (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                event_name VARCHAR(200) NOT NULL,
                actor_email VARCHAR(255) NULL,
                resource VARCHAR(255) NOT NULL,
                detail LONGTEXT NULL,
                before_payload JSON NULL,
                after_payload JSON NULL,
                reason VARCHAR(255) NULL,
                correlation_id VARCHAR(120) NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_audit_actor (actor_email),
                INDEX idx_audit_resource (resource),
                INDEX idx_audit_correlation (correlation_id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS event_outbox (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                event_name VARCHAR(200) NOT NULL,
                actor_email VARCHAR(255) NULL,
                resource VARCHAR(255) NOT NULL,
                payload JSON NULL,
                status VARCHAR(32) NOT NULL DEFAULT 'queued',
                correlation_id VARCHAR(120) NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_outbox_status (status),
                INDEX idx_outbox_correlation (correlation_id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS goals (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                owner_email VARCHAR(255) NOT NULL,
                name VARCHAR(200) NOT NULL,
                category VARCHAR(100) NOT NULL,
                target_amount DECIMAL(18,4) NOT NULL,
                target_currency CHAR(3) NOT NULL DEFAULT 'INR',
                target_date DATETIME NOT NULL,
                status VARCHAR(32) NOT NULL DEFAULT 'active',
                priority VARCHAR(16) NOT NULL DEFAULT 'medium',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_goals_owner (owner_email),
                INDEX idx_goals_status (status)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS investments (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                owner_email VARCHAR(255) NOT NULL,
                goal_id BIGINT NULL,
                name VARCHAR(200) NOT NULL,
                asset_class VARCHAR(100) NOT NULL,
                amount_invested DECIMAL(18,4) NOT NULL,
                current_asset_value DECIMAL(18,4) NOT NULL,
                current_unit_value DECIMAL(18,4) NOT NULL,
                units DECIMAL(18,6) NOT NULL,
                currency CHAR(3) NOT NULL DEFAULT 'INR',
                idempotency_key VARCHAR(255) NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_investments_owner (owner_email),
                INDEX idx_investments_goal (goal_id),
                UNIQUE KEY uq_investment_idempotency (idempotency_key)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS transactions (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                owner_email VARCHAR(255) NOT NULL,
                description VARCHAR(255) NOT NULL,
                type VARCHAR(16) NOT NULL,
                amount DECIMAL(18,4) NOT NULL,
                currency CHAR(3) NOT NULL DEFAULT 'INR',
                transaction_date DATETIME NOT NULL,
                category VARCHAR(100) NOT NULL,
                source VARCHAR(120) NULL,
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_transactions_owner (owner_email),
                INDEX idx_transactions_date (transaction_date)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS insurance_policies (
                id BIGINT PRIMARY KEY AUTO_INCREMENT,
                owner_email VARCHAR(255) NOT NULL,
                policy_name VARCHAR(200) NOT NULL,
                policy_type VARCHAR(100) NOT NULL,
                insurer VARCHAR(150) NOT NULL,
                premium_amount DECIMAL(18,4) NOT NULL,
                policy_currency CHAR(3) NOT NULL DEFAULT 'INR',
                coverage_amount DECIMAL(18,4) NOT NULL,
                start_date DATETIME NOT NULL,
                end_date DATETIME NULL,
                status VARCHAR(32) NOT NULL DEFAULT 'active',
                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_policies_owner (owner_email),
                INDEX idx_policies_status (status)
            )
            """,
        ]
    else:
        ddl_statements = [
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NULL,
                phone TEXT NULL,
                username TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                name TEXT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                verified INTEGER NOT NULL DEFAULT 0,
                password_hash TEXT NOT NULL,
                password_salt TEXT NOT NULL,
                preferred_currency TEXT NOT NULL DEFAULT 'INR',
                otp_code TEXT NULL,
                otp_expires_at TEXT NULL,
                otp_attempts INTEGER NOT NULL DEFAULT 0,
                failed_login_attempts INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                access_token_hash TEXT NOT NULL,
                refresh_token_hash TEXT NOT NULL,
                access_expires_at TEXT NOT NULL,
                refresh_expires_at TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_name TEXT NOT NULL,
                actor_email TEXT NULL,
                resource TEXT NOT NULL,
                detail TEXT NULL,
                before_payload TEXT NULL,
                after_payload TEXT NULL,
                reason TEXT NULL,
                correlation_id TEXT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS event_outbox (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                event_name TEXT NOT NULL,
                actor_email TEXT NULL,
                resource TEXT NOT NULL,
                payload TEXT NULL,
                status TEXT NOT NULL DEFAULT 'queued',
                correlation_id TEXT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS goals (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_email TEXT NOT NULL,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                target_amount REAL NOT NULL,
                target_currency TEXT NOT NULL DEFAULT 'INR',
                target_date TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                priority TEXT NOT NULL DEFAULT 'medium',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS investments (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_email TEXT NOT NULL,
                goal_id INTEGER NULL,
                name TEXT NOT NULL,
                asset_class TEXT NOT NULL,
                amount_invested REAL NOT NULL,
                current_asset_value REAL NOT NULL,
                current_unit_value REAL NOT NULL,
                units REAL NOT NULL,
                currency TEXT NOT NULL DEFAULT 'INR',
                idempotency_key TEXT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_email TEXT NOT NULL,
                description TEXT NOT NULL,
                type TEXT NOT NULL,
                amount REAL NOT NULL,
                currency TEXT NOT NULL DEFAULT 'INR',
                transaction_date TEXT NOT NULL,
                category TEXT NOT NULL,
                source TEXT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """,
            """
            CREATE TABLE IF NOT EXISTS insurance_policies (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                owner_email TEXT NOT NULL,
                policy_name TEXT NOT NULL,
                policy_type TEXT NOT NULL,
                insurer TEXT NOT NULL,
                premium_amount REAL NOT NULL,
                policy_currency TEXT NOT NULL DEFAULT 'INR',
                coverage_amount REAL NOT NULL,
                start_date TEXT NOT NULL,
                end_date TEXT NULL,
                status TEXT NOT NULL DEFAULT 'active',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """,
        ]

    with engine.begin() as connection:
        for ddl in ddl_statements:
            connection.execute(text(ddl))


def get_db_connection() -> Any:
    return get_engine().connect()
