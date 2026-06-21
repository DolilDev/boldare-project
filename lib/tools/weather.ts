import { z } from "zod";
import type { ToolDefinition } from "./types";
import { fetchJson, toErrorMessage } from "./http";
import { FORECAST_ENDPOINT, daysField, latField, lonField } from "./common";

const inputSchema = z.object({
  lat: latField,
  lon: lonField,
  days: daysField,
});

interface ForecastResponse {
  timezone?: string;
  daily?: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    cloud_cover_mean: number[];
  };
}

export const getWeatherForecast: ToolDefinition<typeof inputSchema> = {
  name: "get_weather_forecast",
  description:
    "Zwraca dzienną prognozę pogody dla zadanych współrzędnych: temperatura maksymalna i minimalna (°C), średnie zachmurzenie (%) oraz suma opadów (mm). Dane z Open-Meteo. Najpierw uzyskaj lat/lon przez geocode_location.",
  inputSchema,
  async execute({ lat, lon, days }) {
    const url =
      `${FORECAST_ENDPOINT}?` +
      new URLSearchParams({
        latitude: String(lat),
        longitude: String(lon),
        daily:
          "temperature_2m_max,temperature_2m_min,precipitation_sum,cloud_cover_mean",
        forecast_days: String(days),
        timezone: "auto",
      }).toString();

    try {
      const data = await fetchJson<ForecastResponse>(url);
      const d = data.daily;
      if (!d) {
        return { error: "Open-Meteo nie zwróciło danych dziennych pogody." };
      }
      const forecast = d.time.map((date, i) => ({
        date,
        temp_max: d.temperature_2m_max[i],
        temp_min: d.temperature_2m_min[i],
        cloud_cover_mean: d.cloud_cover_mean[i],
        precipitation_sum: d.precipitation_sum[i],
      }));
      return {
        latitude: lat,
        longitude: lon,
        timezone: data.timezone ?? null,
        units: { temperature: "°C", cloud_cover: "%", precipitation: "mm" },
        forecast,
      };
    } catch (error) {
      return {
        error: `Pobranie prognozy pogody nie powiodło się: ${toErrorMessage(error)}.`,
      };
    }
  },
};
