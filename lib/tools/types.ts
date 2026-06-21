import type { z } from "zod";

/**
 * Pojedyncza definicja narzędzia — JEDNO źródło prawdy, używane jednocześnie
 * przez web-agenta (pętla tool-use Anthropic) i serwer MCP.
 *
 * `inputSchema` trzymamy jako Zod `ZodObject`, bo:
 *   - serwer MCP rejestruje narzędzia po surowym kształcie (`schema.shape`),
 *   - mapper Anthropic konwertuje ten sam schemat na JSON Schema.
 *
 * `execute` NIGDY nie rzuca — w razie błędu zwraca obiekt z polem `error`,
 * żeby agent mógł zareagować zamiast przerywać całą rundę.
 */
export interface ToolDefinition<
  Schema extends z.ZodObject<z.ZodRawShape> = z.ZodObject<z.ZodRawShape>,
> {
  name: string;
  description: string;
  inputSchema: Schema;
  execute(args: z.infer<Schema>): Promise<ToolResult>;
}

/** Wynik narzędzia: dane (dowolny obiekt) albo czytelny komunikat błędu. */
export type ToolResult = Record<string, unknown> | ToolError;

export interface ToolError {
  error: string;
}

export function isToolError(result: ToolResult): result is ToolError {
  return typeof (result as ToolError).error === "string";
}
