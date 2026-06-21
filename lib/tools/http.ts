/** Wspólny klient HTTP dla Open-Meteo: twardy timeout + czytelne błędy. */

const DEFAULT_TIMEOUT_MS = 10_000;

export async function fetchJson<T>(
  url: string,
  timeoutMs: number = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      throw new Error(`odpowiedź HTTP ${res.status} ${res.statusText}`.trim());
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/** Zamienia dowolny wyjątek na zwięzły, czytelny komunikat po polsku. */
export function toErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "przekroczono limit czasu zapytania do Open-Meteo";
  }
  if (error instanceof Error) return error.message;
  return String(error);
}
