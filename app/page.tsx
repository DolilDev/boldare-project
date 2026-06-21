export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: 520, textAlign: "center" }}>
        <h1 style={{ fontSize: "1.6rem", marginBottom: ".5rem" }}>
          Solar Copilot
        </h1>
        <p style={{ color: "var(--muted)" }}>
          Szkielet projektu zainicjalizowany. Interfejs czatu i agent tool-use
          pojawią się w kolejnych krokach.
        </p>
      </div>
    </main>
  );
}
