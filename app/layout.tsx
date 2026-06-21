import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Solar Copilot — agentowy asystent energetyki słonecznej",
  description:
    "Agent z pętlą tool-use, który geokoduje lokalizacje, pobiera prognozę nasłonecznienia z Open-Meteo i szacuje uzysk z instalacji fotowoltaicznej.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
