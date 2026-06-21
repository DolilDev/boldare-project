import type { ToolPart, ToolStatus } from "./types";
import styles from "./ToolCallCard.module.css";

/** Przyjazne etykiety narzędzi (transparentność „jak agent myśli"). */
const LABELS: Record<string, string> = {
  geocode_location: "Geokodowanie lokalizacji",
  get_weather_forecast: "Prognoza pogody",
  get_solar_forecast: "Prognoza nasłonecznienia",
  estimate_solar_yield: "Szacowanie uzysku PV",
  compare_sites: "Porównanie lokalizacji",
};

const STATUS_TEXT: Record<ToolStatus, string> = {
  running: "wykonywanie…",
  done: "gotowe",
  error: "błąd",
};

function pretty(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function ToolCallCard({ part }: { part: ToolPart }) {
  const label = LABELS[part.name] ?? part.name;
  const showResult = part.status !== "running" && part.result !== undefined;

  return (
    <div className={`${styles.card} ${styles[part.status]}`}>
      <div className={styles.head}>
        <span className={`${styles.dot} ${styles[part.status]}`} />
        <span className={styles.label}>{label}</span>
        <code className={styles.name}>{part.name}</code>
        <span className={styles.statusText}>{STATUS_TEXT[part.status]}</span>
      </div>

      <div className={styles.body}>
        <div className={styles.section}>
          <span className={styles.caption}>argumenty</span>
          <pre className={styles.code}>{pretty(part.input)}</pre>
        </div>

        {showResult && (
          <div className={styles.section}>
            <span className={styles.caption}>
              {part.status === "error" ? "błąd" : "wynik"}
            </span>
            <pre
              className={`${styles.code} ${
                part.status === "error" ? styles.codeError : ""
              }`}
            >
              {pretty(part.result)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
