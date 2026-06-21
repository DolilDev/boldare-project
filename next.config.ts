import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Przypinamy katalog projektu jako root śledzenia plików — w katalogu domowym
  // istnieje osierocony lockfile, przez który Next/Vercel mylnie wnioskowałby
  // root monorepo.
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
