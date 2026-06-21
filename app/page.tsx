import { Chat } from "@/components/Chat";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.app}>
      <header className={styles.header}>
        <span className={styles.logo} aria-hidden>
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4.2" />
            <path d="M12 2.5v2.4M12 19.1v2.4M4.2 4.2l1.7 1.7M18.1 18.1l1.7 1.7M2.5 12h2.4M19.1 12h2.4M4.2 19.8l1.7-1.7M18.1 5.9l1.7-1.7" />
          </svg>
        </span>
        <div className={styles.heading}>
          <h1 className={styles.title}>Solar Copilot</h1>
          <p className={styles.subtitle}>
            Agentowy asystent fotowoltaiki na danych Open-Meteo
          </p>
        </div>
      </header>

      <Chat />

      <footer className={styles.footer}>
        Dane pogodowe i nasłonecznienia:{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
          Open-Meteo.com
        </a>{" "}
        ·{" "}
        <a
          href="https://creativecommons.org/licenses/by/4.0/"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC&nbsp;BY&nbsp;4.0
        </a>
      </footer>
    </div>
  );
}
