import Anthropic from "@anthropic-ai/sdk";
import { anthropicTools } from "./anthropic-tools";
import { isToolError, toolsByName } from "./tools";

/** Aktualny Claude Sonnet. */
export const MODEL = "claude-sonnet-4-6";

/** Twardy limit rund tool-use — zabezpiecza przed zapętleniem agenta. */
export const MAX_ROUNDS = 6;

const MAX_TOKENS = 2048;

const SYSTEM_PROMPT = `Jesteś „Solar Copilot" — asystentem energetyki słonecznej. Pomagasz oszacować potencjał instalacji fotowoltaicznej dla lokalizacji w oparciu o darmowe dane Open-Meteo.

Zasady działania:
- Gdy potrzebujesz współrzędnych, NAJPIERW użyj geocode_location — pozostałe narzędzia wymagają lat/lon.
- Do oszacowania uzysku energii używaj estimate_solar_yield (zwraca kWh), a do porównania kilku miejsc compare_sites.
- Promieniowanie jest podawane w MJ/m², a uzysk w kWh — nie przeliczaj jednostek ręcznie, narzędzia robią to za Ciebie (kWh = MJ/3,6 × kWp × PR).
- Odpowiadaj zwięźle po polsku. Podawaj konkretne liczby z jednostkami i krótko interpretuj wynik (np. która lokalizacja wygrywa i o ile).
- Jeśli narzędzie zwróci pole "error", wyjaśnij użytkownikowi problem i zaproponuj rozwiązanie zamiast zgadywać dane.`;

/** Zdarzenia strumieniowane do klienta (mapowane na SSE w /api/chat). */
export type AgentEvent =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; id: string; name: string; result: unknown; isError: boolean }
  | { type: "error"; message: string }
  | { type: "done" };

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

const client = new Anthropic();

/**
 * Pętla tool-use: wysyła wiadomości + definicje narzędzi do Anthropic,
 * wykonuje żądane narzędzia, dokłada tool_result i powtarza — aż model
 * przestanie prosić o narzędzia lub do wyczerpania limitu rund.
 *
 * Zwraca async-generator zdarzeń, które route handler zamienia na SSE.
 */
export async function* runAgent(
  history: AgentMessage[],
  options: { signal?: AbortSignal } = {},
): AsyncGenerator<AgentEvent> {
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const stream = client.messages.stream(
      {
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: SYSTEM_PROMPT,
        tools: anthropicTools,
        messages,
      },
      { signal: options.signal },
    );

    // Strumieniujemy fragmenty tekstu na żywo.
    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        yield { type: "text", text: event.delta.text };
      }
    }

    const final = await stream.finalMessage();
    messages.push({ role: "assistant", content: final.content });

    const toolUses = final.content.filter(
      (block): block is Anthropic.ToolUseBlock => block.type === "tool_use",
    );

    if (final.stop_reason !== "tool_use" || toolUses.length === 0) {
      yield { type: "done" };
      return;
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUses) {
      yield {
        type: "tool_use",
        id: toolUse.id,
        name: toolUse.name,
        input: toolUse.input,
      };

      const result = await executeTool(toolUse.name, toolUse.input);
      const errored = isToolError(result);

      yield {
        type: "tool_result",
        id: toolUse.id,
        name: toolUse.name,
        result,
        isError: errored,
      };

      toolResults.push({
        type: "tool_result",
        tool_use_id: toolUse.id,
        content: JSON.stringify(result),
        is_error: errored,
      });
    }

    messages.push({ role: "user", content: toolResults });
  }

  yield {
    type: "error",
    message: `Przekroczono limit ${MAX_ROUNDS} rund tool-use — przerwano, aby uniknąć zapętlenia.`,
  };
}

async function executeTool(name: string, input: unknown) {
  const tool = toolsByName.get(name);
  if (!tool) {
    return { error: `Nieznane narzędzie: ${name}.` };
  }
  try {
    const args = tool.inputSchema.parse(input);
    return await tool.execute(args);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { error: `Nieprawidłowe argumenty narzędzia ${name}: ${message}.` };
  }
}
