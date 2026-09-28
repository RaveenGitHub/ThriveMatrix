from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal, InvalidOperation


class CurrencyValidationError(ValueError):
    """Raised when a currency code or rate is invalid."""


class CurrencyRateUnavailableError(ValueError):
    """Raised when a conversion needs a missing or inactive rate."""


@dataclass(frozen=True)
class CurrencyDefinition:
    code: str
    name: str
    decimal_places: int = 2
    is_active: bool = True


@dataclass(frozen=True)
class ConversionResult:
    raw_amount: Decimal
    source_currency: str
    display_amount: Decimal
    display_currency: str
    conversion_status: str


SUPPORTED_CURRENCIES: tuple[CurrencyDefinition, ...] = (
    CurrencyDefinition("USD", "US Dollar"),
    CurrencyDefinition("INR", "Indian Rupee"),
    CurrencyDefinition("EUR", "Euro"),
    CurrencyDefinition("GBP", "Pound Sterling"),
    CurrencyDefinition("AED", "United Arab Emirates Dirham"),
    CurrencyDefinition("SGD", "Singapore Dollar"),
    CurrencyDefinition("AUD", "Australian Dollar"),
    CurrencyDefinition("CAD", "Canadian Dollar"),
    CurrencyDefinition("JPY", "Japanese Yen", decimal_places=0),
    CurrencyDefinition("CHF", "Swiss Franc"),
    CurrencyDefinition("CNY", "Chinese Yuan"),
    CurrencyDefinition("HKD", "Hong Kong Dollar"),
    CurrencyDefinition("ZAR", "South African Rand"),
    CurrencyDefinition("SAR", "Saudi Riyal"),
    CurrencyDefinition("QAR", "Qatari Riyal"),
    CurrencyDefinition("MYR", "Malaysian Ringgit"),
    CurrencyDefinition("THB", "Thai Baht"),
)


DEFAULT_USD_PER_UNIT_RATES: Mapping[str, Decimal] = {
    "USD": Decimal("1"),
    "INR": Decimal("0.012"),
    "EUR": Decimal("1.08"),
    "GBP": Decimal("1.27"),
    "AED": Decimal("0.272294"),
    "SGD": Decimal("0.74"),
    "AUD": Decimal("0.66"),
    "CAD": Decimal("0.74"),
    "JPY": Decimal("0.0067"),
    "CHF": Decimal("1.13"),
    "CNY": Decimal("0.14"),
    "HKD": Decimal("0.128"),
    "ZAR": Decimal("0.055"),
    "SAR": Decimal("0.266667"),
    "QAR": Decimal("0.274725"),
    "MYR": Decimal("0.21"),
    "THB": Decimal("0.028"),
}


class CurrencyService:
    def __init__(
        self,
        definitions: tuple[CurrencyDefinition, ...] = SUPPORTED_CURRENCIES,
        rates: Mapping[str, Decimal | str | int] = DEFAULT_USD_PER_UNIT_RATES,
    ) -> None:
        self._definitions = {definition.code: definition for definition in definitions}
        self._rates = {
            self.normalize_code(code): self._coerce_positive_rate(rate)
            for code, rate in rates.items()
        }
        self._validate_catalog()

    @staticmethod
    def normalize_code(code: str) -> str:
        normalized = code.strip().upper()
        if len(normalized) != 3 or not normalized.isascii() or not normalized.isalpha():
            raise CurrencyValidationError("Currency code must be a three-letter ISO-style code")
        return normalized

    @staticmethod
    def _coerce_positive_rate(rate: Decimal | str | int) -> Decimal:
        try:
            decimal_rate = Decimal(str(rate))
        except (InvalidOperation, ValueError) as exc:
            raise CurrencyValidationError("Currency rate must be a valid decimal") from exc
        if not decimal_rate.is_finite() or decimal_rate <= 0:
            raise CurrencyValidationError("Currency rate must be a positive finite decimal")
        return decimal_rate

    def _validate_catalog(self) -> None:
        if "USD" not in self._definitions or "USD" not in self._rates:
            raise CurrencyValidationError("USD must be present as the base currency")
        if self._rates["USD"] != Decimal("1"):
            raise CurrencyValidationError("USD must have a rate of 1")
        missing_rates = set(self._definitions) - set(self._rates)
        if missing_rates:
            missing = ", ".join(sorted(missing_rates))
            raise CurrencyValidationError(f"Missing currency rates: {missing}")

    def definitions(self, *, active_only: bool = False) -> tuple[CurrencyDefinition, ...]:
        values = tuple(self._definitions.values())
        if active_only:
            values = tuple(definition for definition in values if definition.is_active)
        return values

    def get_rate(self, code: str) -> Decimal:
        normalized = self.normalize_code(code)
        definition = self._definitions.get(normalized)
        if definition is None:
            raise CurrencyValidationError(f"Unsupported currency: {normalized}")
        if not definition.is_active:
            raise CurrencyRateUnavailableError(f"Currency disabled: {normalized}")
        return self._rates[normalized]

    def convert(
        self,
        amount: Decimal | str | int,
        source_currency: str,
        display_currency: str,
    ) -> ConversionResult:
        try:
            raw_amount = Decimal(str(amount))
        except (InvalidOperation, ValueError) as exc:
            raise CurrencyValidationError("Amount must be a valid decimal") from exc
        if not raw_amount.is_finite():
            raise CurrencyValidationError("Amount must be finite")

        source = self.normalize_code(source_currency)
        display = self.normalize_code(display_currency)
        if source == display:
            return ConversionResult(raw_amount, source, raw_amount, display, "same_currency")

        source_rate = self.get_rate(source)
        display_rate = self.get_rate(display)
        converted = (raw_amount * source_rate / display_rate).quantize(
            self._quantum(display), rounding=ROUND_HALF_UP
        )
        return ConversionResult(raw_amount, source, converted, display, "converted")

    def _quantum(self, code: str) -> Decimal:
        definition = self._definitions[code]
        return Decimal(1).scaleb(-definition.decimal_places)