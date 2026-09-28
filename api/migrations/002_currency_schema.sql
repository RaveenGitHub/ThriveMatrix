CREATE TABLE IF NOT EXISTS currency_master (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    currency_code CHAR(3) NOT NULL UNIQUE,
    currency_name VARCHAR(120) NOT NULL,
    symbol VARCHAR(16) NULL,
    decimal_places SMALLINT NOT NULL DEFAULT 2,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_base BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS currency_conversion_rates (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    currency_code CHAR(3) NOT NULL,
    base_currency_code CHAR(3) NOT NULL DEFAULT 'USD',
    usd_per_unit DECIMAL(24,12) NOT NULL,
    effective_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_currency_current_rate (currency_code, base_currency_code),
    CONSTRAINT fk_currency_rate_currency FOREIGN KEY (currency_code) REFERENCES currency_master(currency_code)
);