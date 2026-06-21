import { z } from "zod";

/** Współdzielone pola wejściowe narzędzi operujących na współrzędnych. */

export const latField = z
  .number()
  .min(-90)
  .max(90)
  .describe("Szerokość geograficzna (lat), np. 50.29");

export const lonField = z
  .number()
  .min(-180)
  .max(180)
  .describe("Długość geograficzna (lon), np. 18.67");

export const daysField = z
  .number()
  .int()
  .min(1)
  .max(16)
  .default(7)
  .describe("Liczba dni prognozy (1–16, domyślnie 7)");

export const FORECAST_ENDPOINT = "https://api.open-meteo.com/v1/forecast";
