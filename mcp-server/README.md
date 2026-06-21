# Solar Copilot — serwer MCP

Lokalny serwer [MCP](https://modelcontextprotocol.io/) (transport **stdio**), który
wystawia te same 5 narzędzi co web-agent (`geocode_location`, `get_weather_forecast`,
`get_solar_forecast`, `estimate_solar_yield`, `compare_sites`). Logika narzędzi
pochodzi z `lib/tools/` — serwer jej nie duplikuje, tylko rejestruje przez
`server.registerTool(...)`.

Dzięki temu możesz korzystać z narzędzi Solar Copilot bezpośrednio w **Claude
Desktop** lub **Claude Code**.

## Wymagania

- Node.js ≥ 18
- Zainstalowane zależności: `npm install` (w katalogu głównym projektu)
- Połączenie z internetem (Open-Meteo) — **bez klucza API**

## Build i uruchomienie

```bash
# 1. Zbuduj samowystarczalny bundle CJS → mcp-server/dist/server.js
npm run build:mcp

# 2. (opcjonalnie) Uruchom ręcznie, aby sprawdzić start
npm run mcp
# => "Serwer MCP solar-copilot uruchomiony (stdio)." na stderr
```

Serwer komunikuje się po stdio (JSON-RPC) — sam w sobie nie ma UI. Podłączasz go do
klienta MCP, np. Claude Desktop.

## Podłączenie do Claude Desktop

Dodaj wpis do pliku konfiguracyjnego Claude Desktop:

- **Windows:** `%APPDATA%\Claude\claude_desktop_config.json`
- **macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "solar-copilot": {
      "command": "node",
      "args": [
        "C:\\Users\\Dolil\\Documents\\Projekty\\boldare-project\\mcp-server\\dist\\server.js"
      ]
    }
  }
}
```

> Podaj **bezwzględną** ścieżkę do zbudowanego `dist/server.js` (na macOS/Linux np.
> `/Users/ty/boldare-project/mcp-server/dist/server.js`). Po edycji configu zrestartuj
> Claude Desktop — narzędzia Solar Copilot pojawią się na liście dostępnych narzędzi.

Przykładowe zapytania w Claude Desktop po podłączeniu:

- „Geokoduj Gliwice i oszacuj tygodniowy uzysk z 10 kWp."
- „Porównaj Kraków i Gdańsk pod kątem fotowoltaiki 8 kWp."

## Uwaga o architekturze

To **lokalny proces** uruchamiany przez klienta MCP przez stdio — **nie** jest to
usługa hostowana w chmurze. Serwer MCP **nie** jest wdrażany na Vercel; tam działa
wyłącznie web-app. Serwer MCP to element lokalny/desktopowy.

<!-- Miejsce na screenshot lub nagranie z Claude Desktop pokazujące działające narzędzia. -->
