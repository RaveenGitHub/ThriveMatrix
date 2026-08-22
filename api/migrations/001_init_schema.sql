CREATE DATABASE IF NOT EXISTS thrivematrix;
USE thrivematrix;

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
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_email (email),
    UNIQUE KEY uq_users_username (username)
);

CREATE TABLE IF NOT EXISTS user_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    access_token_hash VARCHAR(255) NOT NULL,
    refresh_token_hash VARCHAR(255) NOT NULL,
    access_expires_at DATETIME NOT NULL,
    refresh_expires_at DATETIME NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'active',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_sessions_user FOREIGN KEY (user_id) REFERENCES users(id)
);

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
);

CREATE TABLE IF NOT EXISTS event_outbox (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    event_name VARCHAR(200) NOT NULL,
    actor_email VARCHAR(255) NULL,
    resource VARCHAR(255) NOT NULL,
    payload JSON NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'queued',
    correlation_id VARCHAR(120) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_outbox_status (status),
    INDEX idx_outbox_correlation (correlation_id)
);

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
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_goals_owner (owner_email),
    INDEX idx_goals_status (status)
);

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
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_investments_owner (owner_email),
    INDEX idx_investments_goal (goal_id),
    UNIQUE KEY uq_investment_idempotency (idempotency_key)
);

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
);

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
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_policies_owner (owner_email),
    INDEX idx_policies_status (status)
);
