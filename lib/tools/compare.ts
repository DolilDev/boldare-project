import { z } from "zod";
import type { ToolDefinition } from "./types";
import { isToolError } from "./types";
import { geocodeLocation } from "./geocode";
import { estimateSolarYield } from "./yield";

const PERIOD_DAYS = 7;
const DEFAULT_PR = 0.78;

const inputSchema = z.object({
  locations: z
    .array(z.string().min(1))
    .min(2)
    .max(8)
    .describe(
      "Lista nazw miejscowości do porównania, np. ['Gliwice', 'Kraków']",
    ),
  panel_kwp: z
    .number()
    .positive()
    .describe("Moc instalacji w kWp, jednakowa dla wszystkich lokalizacji"),
});

interface SiteSuccess {
  location: string;
  country: string | null;
  lat: number;
  lon: number;
  total_kwh: number;
  average_daily_kwh: number;
}

interface SiteFailure {
  location: string;
  error: string;
}

type SiteResult = SiteSuccess | SiteFailure;

const isFailure = (r: SiteResult): r is SiteFailure =>
  (r as SiteFailure).error !== undefined;

export const compareSites: ToolDefinition<typeof inputSchema> = {
  name: "compare_sites",
  description:
    "Porównuje kilka lokalizacji pod kątem szacowanego tygodniowego uzysku z fotowoltaiki o zadanej mocy (kWp) i zwraca ranking od najlepszej. Komponuje geocode_location → get_solar_forecast → estimate_solar_yield. Użyj, gdy użytkownik chce porównać miejsca (np. 'Gliwice vs Kraków').",
  inputSchema,
  async execute({ locations, panel_kwp }) {
    const evaluated = await Promise.all<SiteResult>(
      locations.map(async (name) => {
        const geo = await geocodeLocation.execute({ name });
        if (isToolError(geo)) return { location: name, error: geo.error };
        const g = geo as unknown as {
          lat: number;
          lon: number;
          name: string;
          country: string | null;
        };

        const estimate = await estimateSolarYield.execute({
          lat: g.lat,
          lon: g.lon,
          panel_kwp,
          performance_ratio: DEFAULT_PR,
          days: PERIOD_DAYS,
        });
        if (isToolError(estimate)) {
          return { location: g.name, error: estimate.error };
        }
        const e = estimate as unknown as {
          total_kwh: number;
          average_daily_kwh: number;
        };

        return {
          location: g.name,
          country: g.country,
          lat: g.lat,
          lon: g.lon,
          total_kwh: e.total_kwh,
          average_daily_kwh: e.average_daily_kwh,
        };
      }),
    );

    const ranking = evaluated
      .filter((r): r is SiteSuccess => !isFailure(r))
      .sort((a, b) => b.total_kwh - a.total_kwh)
      .map((site, index) => ({ rank: index + 1, ...site }));

    const failed = evaluated.filter(isFailure);

    return {
      panel_kwp,
      period_days: PERIOD_DAYS,
      performance_ratio: DEFAULT_PR,
      units: { energy: "kWh" },
      ranking,
      ...(failed.length > 0 ? { failed } : {}),
    };
  },
};
