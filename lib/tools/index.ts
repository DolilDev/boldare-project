import type { ToolDefinition } from "./types";
import { geocodeLocation } from "./geocode";
import { getWeatherForecast } from "./weather";

/**
 * Rejestr narzędzi — jedno źródło prawdy.
 * Web-agent (lib/agent.ts) i serwer MCP (mcp-server/server.ts) korzystają
 * dokładnie z tej samej listy, bez duplikowania logiki.
 */
export const tools: ToolDefinition[] = [geocodeLocation, getWeatherForecast];

export const toolsByName: Map<string, ToolDefinition> = new Map(
  tools.map((tool) => [tool.name, tool]),
);

export type { ToolDefinition, ToolResult } from "./types";
export { isToolError } from "./types";
