import { zodToJsonSchema } from "zod-to-json-schema";
import type Anthropic from "@anthropic-ai/sdk";
import { tools } from "./tools";

/**
 * Mapuje wspólny rejestr narzędzi (lib/tools) na format tool-use Anthropic.
 * Schemat Zod każdego narzędzia jest konwertowany na JSON Schema —
 * dzięki temu definicja narzędzia żyje w jednym miejscu.
 */
function toInputSchema(
  schema: (typeof tools)[number]["inputSchema"],
): Anthropic.Tool.InputSchema {
  const json = zodToJsonSchema(schema, { $refStrategy: "none" }) as Record<
    string,
    unknown
  >;
  // JSON Schema dodaje "$schema"; Anthropic tego nie potrzebuje.
  delete json.$schema;
  return json as Anthropic.Tool.InputSchema;
}

export const anthropicTools: Anthropic.Tool[] = tools.map((tool) => ({
  name: tool.name,
  description: tool.description,
  input_schema: toInputSchema(tool.inputSchema),
}));
