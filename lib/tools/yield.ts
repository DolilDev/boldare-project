import { z } from "zod";
import type { ToolDefinition } from "./types";
import { isToolError } from "./types";
import { daysField, latField, lonField } from "./common";
import { getSolarForecast } from "./solar";

/** 1 kWh = 3,6 MJ — konwersja MJ/m² → kWh/m² jest obowiązkowa. */
const MJ_PER_KWH = 3.6;

const round2 = (value: number) => Math.round(value * 100) / 100;

const inputSchema = z.object({
  lat: latField,
  lon: lonField,
  panel_kwp: z
    .number()
    .positive()
    .describe("Moc instalacji fotowoltaicznej w kWp, np. 10"),
  performance_ratio: z
    .number()
    .min(0)
    .max(1)
    .default(0.78)
    .describe(
      "Performance Ratio (PR) — sprawność systemu uwzględniająca straty (kable, falownik, temperatura). Domyślnie 0.78.",
    ),
  days: daysField,
});

interface SolarForecastShape {
  timezone: string | null;
  solar: Array<{ date: string; radiation_mj_per_m2: number }>;
}

export const estimateSolarYield: ToolDefinition<typeof inputSchema> = {
  name: "estimate_solar_yield",
  description:
    "Szacuje uzysk energii (kWh) z instalacji fotowoltaicznej na podstawie prognozy nasłonecznienia. Wzór: kWh = (shortwave_radiation_sum_MJ / 3.6) × panel_kwp × performance_ratio. Konwersja MJ→kWh (÷3.6) jest wbudowana. Zwraca uzysk dzienny oraz sumę dla całego okresu. Najpierw uzyskaj lat/lon przez geocode_location.",
  inputSchema,
  async execute({ lat, lon, panel_kwp, performance_ratio, days }) {
    // Reużywamy get_solar_forecast zamiast duplikować pobieranie radiacji.
    const solarResult = await getSolarForecast.execute({ lat, lon, days });
    if (isToolError(solarResult)) {
      return solarResult;
    }

    const { solar, timezone } = solarResult as unknown as SolarForecastShape;

    const daily = solar.map((d) => {
      const kwh = (d.radiation_mj_per_m2 / MJ_PER_KWH) * panel_kwp * performance_ratio;
      return {
        date: d.date,
        radiation_mj_per_m2: d.radiation_mj_per_m2,
        estimated_kwh: round2(kwh),
      };
    });

    const totalKwh = round2(daily.reduce((sum, d) => sum + d.estimated_kwh, 0));

    return {
      latitude: lat,
      longitude: lon,
      timezone: timezone ?? null,
      panel_kwp,
      performance_ratio,
      formula: "kWh = (radiation_MJ / 3.6) × panel_kwp × performance_ratio",
      units: { energy: "kWh", radiation: "MJ/m²" },
      daily,
      total_kwh: totalKwh,
      average_daily_kwh: round2(totalKwh / (daily.length || 1)),
    };
  },
};
