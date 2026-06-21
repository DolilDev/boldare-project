import { z } from "zod";
import type { ToolDefinition } from "./types";
import { fetchJson, toErrorMessage } from "./http";
import { FORECAST_ENDPOINT, daysField, latField, lonField } from "./common";

const inputSchema = z.object({
  lat: latField,
  lon: lonField,
  days: daysField,
});

interface SolarResponse {
  timezone?: string;
  daily?: {
    time: string[];
    shortwave_radiation_sum: number[];
    sunshine_duration: number[];
  };
}

export const getSolarForecast: ToolDefinition<typeof inputSchema> = {
  name: "get_solar_forecast",
  description:
    "Zwraca dzienną prognozę nasłonecznienia dla zadanych współrzędnych: sumę promieniowania krótkofalowego (shortwave_radiation_sum, w MJ/m²) oraz czas usłonecznienia (godziny). To kluczowy wsad do oszacowania uzysku z fotowoltaiki. Dane z Open-Meteo. Najpierw uzyskaj lat/lon przez geocode_location.",
  inputSchema,
  async execute({ lat, lon, days }) {
    const url =
      `${FORECAST_ENDPOINT}?` +
      new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        daily: "shortwave_radiation_sum,sunshine_duration",
        forecast_days: String(days),
        timezone: "auto",
      }).toString();

    try {
      const data = await fetchJson<SolarResponse>(url);
      const d = data.daily;
      if (!d) {
        return { error: "Open-Meteo nie zwróciło danych nasłonecznienia." };
      }
      const solar = d.time.map((date, i) => ({
        date,
        radiation_mj_per_m2: d.shortwave_radiation_sum[i],
        sunshine_hours:
          Math.round((d.sunshine_duration[i] / 3600) * 100) / 100,
      }));
      return {
        latitude: lat,
        longitude: lon,
        timezone: data.timezone ?? null,
        units: { radiation: "MJ/m²", sunshine: "h" },
        solar,
      };
    } catch (error) {
      return {
        error: `Pobranie prognozy nasłonecznienia nie powiodło się: ${toErrorMessage(error)}.`,
      };
    }
  },
};
