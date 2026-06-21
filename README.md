# ☀️ Solar Copilot

Agentowy asystent dla energetyki słonecznej. Zadajesz pytanie po polsku
(„Porównaj Gliwice i Kraków dla 10 kWp na najbliższy tydzień"), a agent —
w pętli tool-use na Anthropic API — sam geokoduje lokalizacje, pobiera prognozę
nasłonecznienia z Open-Meteo i szacuje uzysk z instalacji fotowoltaicznej.
Każde wywołanie narzędzia jest widoczne na żywo w panelu transparentności.

**Live:** _(do uzupełnienia po wdrożeniu na Vercel)_

## Dlaczego to ciekawe

To **dual-surface**: te same narzędzia działają w dwóch światach naraz —
jako web-agent z czatem i streamingiem oraz jako serwer **MCP** podłączany do
Claude Desktop / Claude Code. Logika narzędzi jest zdefiniowana **raz**
(`lib/tools/`) i nie jest duplikowana.

## Stack

- **Next.js 15** (App Router) + **TypeScript** (strict) + **React 19**
- **@anthropic-ai/sdk** — pętla tool-use, model `claude-sonnet-4-6`, streaming
- **@modelcontextprotocol/sdk** (v1.x) — serwer MCP, transport stdio
- **Zod** — schematy wejścia narzędzi (jedno źródło prawdy → JSON Schema dla
  Anthropic oraz `registerTool` dla MCP)
- **Open-Meteo** — geokoder + prognoza, darmowe, bez klucza API
- UI: **czysty CSS** (CSS Modules + zmienne) — bez Tailwina, świadomy design

## Narzędzia (wspólne dla web-agenta i MCP)

| Narzędzie | Co robi |
| --- | --- |
| `geocode_location` | nazwa → `{lat, lon, name, country, timezone, elevation}` |
| `get_weather_forecast` | dzienna temperatura, zachmurzenie (%), opady |
| `get_solar_forecast` | dzienne `shortwave_radiation_sum` (MJ/m²) + usłonecznienie (h) |
| `estimate_solar_yield` | szacowany uzysk **kWh** — `kWh = (MJ/3.6) × kWp × PR` |
| `compare_sites` | ranking lokalizacji po tygodniowym uzysku (komponuje 1+3+4) |

Konwersja **MJ → kWh (÷3,6)** jest wbudowana w `estimate_solar_yield` i obowiązkowa.

## Architektura (dual-surface)

```
                  ┌──────────────────────────────────┐
                  │        lib/tools/  (rejestr)       │  ← jedno źródło prawdy
                  │  geocode · weather · solar         │
                  │  yield · compare  (Zod + execute)  │
                  └───────┬───────────────────┬────────┘
        anthropic-tools.ts│                   │ registerTool(...)
        (Zod → JSON Schema)│                   │
                          ▼                   ▼
            ┌───────────────────────┐   ┌──────────────────────┐
            │  Web-agent            │   │  Serwer MCP (stdio)  │
            │  lib/agent.ts         │   │  mcp-server/server.ts│
            │  pętla tool-use (≤6)  │   │  → Claude Desktop    │
            └───────────┬───────────┘   └──────────────────────┘
                        │ SSE
            ┌───────────▼───────────┐
            │  app/api/chat/route   │
            └───────────┬───────────┘
                        │
            ┌───────────▼───────────┐
            │  UI czatu (React)     │
            │  + ToolCallCard       │
            └───────────────────────┘

         Dane: Open-Meteo (geokoder + forecast) — bez klucza API.
```

## Uruchomienie lokalne (web)

```bash
npm install

# klucz tylko po stronie serwera — nie trafia do przeglądarki ani do repo
cp .env.example .env.local
# wpisz prawdziwy ANTHROPIC_API_KEY w .env.local

npm run dev
# http://localhost:3000
```

Przykład end-to-end: _„Porównaj Gliwice i Kraków dla 10 kWp na najbliższy
tydzień"_ → agent wykonuje geokodowanie, prognozę nasłonecznienia i szacowanie
uzysku, a w panelu transparentności widać każdą rundę z argumentami i wynikiem.

## Uruchomienie serwera MCP

```bash
npm run build:mcp          # → mcp-server/dist/server.js (samowystarczalny CJS)
npm run mcp                # start na stdio
```

Pełna instrukcja podłączenia do Claude Desktop: [`mcp-server/README.md`](./mcp-server/README.md).
Serwer MCP to **proces lokalny** (stdio) — nie jest wdrażany na Vercel.

## Deploy

Web-app jest przeznaczona na **Vercel** (zmienna `ANTHROPIC_API_KEY` w ustawieniach
projektu). Runtime endpointu to `nodejs`. Serwer MCP zostaje lokalny.

## Jak korzystałem z AI („How I used AI")

AI (Claude Code) było realnym współpracownikiem przy tym projekcie — ale
kierunek i kluczowe decyzje pozostały moje. Kilka konkretów:

- **Weryfikacja zamiast założeń.** Zanim napisałem narzędzia, sprawdziłem na
  żywo odpowiedzi Open-Meteo — m.in. że `cloud_cover_mean` jest dostępne jako
  zmienna dzienna (nie musiałem agregować godzinowych) i że radiacja przychodzi
  w MJ/m². AI chętnie „wiedziało", jak wygląda API; ja wolałem to potwierdzić curl-em.
- **Konwersja MJ → kWh.** Wymusiłem jawny dzielnik ÷3,6 jako twardą regułę
  w `estimate_solar_yield` i zostawiłem wzór w odpowiedzi narzędzia — żeby wynik
  był audytowalny, a nie „magiczną liczbą".
- **Limit rund tool-use.** Pętla agentowa ma twardy limit 6 rund. To moja decyzja
  inżynierska przeciw zapętleniu i niekontrolowanym kosztom — domyślnie agent
  potrafiłby kręcić się dłużej.
- **Jedno źródło prawdy.** Uparłem się, żeby narzędzia żyły w `lib/tools/`
  i były tylko *rejestrowane* przez web-agenta i serwer MCP — zero duplikacji
  logiki. To kosztowało trochę dodatkowej abstrakcji (Zod → JSON Schema vs
  `registerTool`), ale opłaciło się spójnością.
- **Świadomy stack UI.** Odrzuciłem propozycję cięższych zależności (Tailwind /
  biblioteki UI) na rzecz czystego CSS z własnym, intencjonalnym motywem —
  zgodnie z zasadą „bez zbędnych zależności".
- **Higiena commitów.** Atomowe commity w Conventional Commits, każdy krok osobno,
  bez zbiorczych „wip/fix". Historia repo ma być częścią opowieści o procesie.

## Atrybucja

Dane pogodowe i nasłonecznienia: [Open-Meteo.com](https://open-meteo.com/) —
licencja [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
