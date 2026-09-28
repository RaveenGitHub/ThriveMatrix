export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  (typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://localhost:8000");

export async function ravApiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  headers.set("Accept", "application/json");

  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await response.json().catch(() => null)
    : null;

  if (!response.ok) {
    const details = payload?.error?.details;
    const fieldMessage = Array.isArray(details)
      ? details
          .map((entry) => entry?.msg)
          .find(
            (msg): msg is string => typeof msg === "string" && msg.length > 0,
          )
      : undefined;

    const message = (
      fieldMessage ??
      payload?.detail ??
      payload?.error?.message ??
      `Request failed with status ${response.status}`
    )
      .toString()
      .replace(/^Value error,\s*/i, "");

    throw new Error(message);
  }

  return (payload ?? undefined) as T;
}

export const apiFetch = ravApiFetch;

export { ravApiFetch as apiRequest };

export type CurrencyOption = {
  currency_code: string;
  currency_name: string;
  symbol?: string | null;
  decimal_places: number;
  is_active: boolean | number;
  is_base: boolean | number;
};

export async function getCurrencies() {
  return ravApiFetch<{ currencies: CurrencyOption[] }>("/api/v1/currencies");
}

export async function updatePreferredCurrency(preferred_currency: string) {
  return ravApiFetch<{ preferred_currency: string }>(
    "/api/v1/profile/currency",
    {
      method: "PUT",
      body: JSON.stringify({ preferred_currency }),
    },
  );
}
