from sqlalchemy import text

from app.db import ensure_currency_tables, get_engine


def test_currency_bootstrap_is_idempotent_and_seeds_catalog(monkeypatch, tmp_path) -> None:
    database_path = tmp_path / "currency-bootstrap.db"
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{database_path}")
    monkeypatch.setenv("APP_ENV", "test")

    ensure_currency_tables()
    ensure_currency_tables()

    with get_engine().connect() as connection:
        currencies = connection.execute(
            text("SELECT currency_code, is_base FROM currency_master ORDER BY currency_code")
        ).all()
        rates = connection.execute(
            text("SELECT COUNT(*) FROM currency_conversion_rates")
        ).scalar_one()

    assert len(currencies) == 17
    assert sum(1 for code, is_base in currencies if code == "USD" and is_base == 1) == 1
    assert rates == 17