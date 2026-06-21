import { z } from "zod";
import type { ToolDefinition } from "./types";
import { fetchJson, toErrorMessage } from "./http";

const inputSchema = z.object({
  name: z
    .string()
    .min(1)
    .describe("Nazwa miejscowości do geokodowania, np. 'Gliwice' lub 'Kraków'"),
});

interface GeocodingResponse {
  results?: Array<{
    latitude: number;
    longitude: number;
    name: string;
    country?: string;
    timezone?: string;
    elevation?: number;
  }>;
}

export const geocodeLocation: ToolDefinition<typeof inputSchema> = {
  name: "geocode_location",
  description:
    "Zamienia nazwę miejscowości na współrzędne geograficzne (lat, lon) wraz z krajem, strefą czasową i wysokością n.p.m. Korzysta z geokodera Open-Meteo. Użyj tego narzędzia, zanim pobierzesz prognozę pogody, nasłonecznienia lub oszacujesz uzysk — pozostałe narzędzia wymagają lat/lon.",
  inputSchema,
  async execute({ name }) {
    const url =
      "https://geocoding-api.open-meteo.com/v1/search?" +
      new URLSearchParams({
        name,
        count: "1",
        language: "pl",
        format: "json",
      }).toString();

    try {
      const data = await fetchJson<GeocodingResponse>(url);
      const hit = data.results?.[0];
      if (!hit) {
        return {
          error: `Nie znaleziono lokalizacji o nazwie "${name}". Sprawdź pisownię lub podaj większą pobliską miejscowość.`,
        };
      }
      return {
        lat: hit.latitude,
        lon: hit.longitude,
        name: hit.name,
        country: hit.country ?? null,
        timezone: hit.timezone ?? null,
        elevation: hit.elevation ?? null,
      };
    } catch (error) {
      return { error: `Geokodowanie nie powiodło się: ${toErrorMessage(error)}.` };
    }
  },
};
