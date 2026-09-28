from decimal import Decimal

import pytest

from app.services.currency_service import (
    CurrencyRateUnavailableError,
    CurrencyService,
    CurrencyValidationError,
)


def test_catalog_contains_required_currencies_and_usd_base_rate() -> None:
    service = CurrencyService()

    assert {definition.code for definition in service.definitions()} >= {
        "USD",
        "INR",
        "EUR",
        "AED",
        "JPY",
    }
    assert service.get_rate("usd") == Decimal("1")


def test_conversion_uses_usd_base_rates_and_target_precision() -> None:
    service = CurrencyService(
        rates={
            "USD": "1",
            "EUR": "2",
            "INR": "0.5",
            "JPY": "0.01",
            "AED": "0.25",
            "GBP": "1",
            "SGD": "1",
            "AUD": "1",
            "CAD": "1",
            "CHF": "1",
            "CNY": "1",
            "HKD": "1",
            "ZAR": "1",
            "SAR": "1",
            "QAR": "1",
            "MYR": "1",
            "THB": "1",
        }
    )

    result = service.convert("10", "EUR", "INR")

    assert result.raw_amount == Decimal("10")
    assert result.display_amount == Decimal("40.00")
    assert result.display_currency == "INR"
    assert result.conversion_status == "converted"


def test_same_currency_does_not_require_rate_conversion() -> None:
    service = CurrencyService()

    result = service.convert("12.345", "inr", "INR")

    assert result.display_amount == Decimal("12.345")
    assert result.conversion_status == "same_currency"


def test_invalid_amount_and_code_are_rejected() -> None:
    service = CurrencyService()

    with pytest.raises(CurrencyValidationError):
        service.convert("not-a-number", "USD", "INR")
    with pytest.raises(CurrencyValidationError):
        service.convert("10", "US", "INR")
    with pytest.raises(CurrencyValidationError):
        service.convert("10", "USD", "XXX")


def test_invalid_base_rate_is_rejected() -> None:
    with pytest.raises(CurrencyValidationError, match="USD must have a rate of 1"):
        CurrencyService(rates={"USD": "2"})


def test_disabled_currency_cannot_be_used_for_conversion() -> None:
    definitions = list(CurrencyService().definitions())
    definitions[1] = definitions[1].__class__("INR", "Indian Rupee", is_active=False)
    service = CurrencyService(tuple(definitions))

    with pytest.raises(CurrencyRateUnavailableError, match="Currency disabled: INR"):
        service.convert("10", "USD", "INR")