import { z } from "zod";
import type { AgentMessage } from "@/lib/agent";

export const runtime = "nodejs";

const requestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .min(1),
});

export async function POST(req: Request) {
  const json = await req.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) {
    return Response.json(
      { error: "Nieprawidłowe żądanie: oczekiwano { messages: [...] }." },
      { status: 400 },
    );
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "Serwer nie ma skonfigurowanego ANTHROPIC_API_KEY." },
      { status: 500 },
    );
  }

  // Dynamiczny import dopiero po sprawdzeniu klucza — klient Anthropic
  // tworzony jest po stronie serwera i nigdy nie trafia do przeglądarki.
  const { runAgent } = await import("@/lib/agent");
  const messages: AgentMessage[] = parsed.data.messages;

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: unknown) =>
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`),
        );
      try {
        for await (const event of runAgent(messages, { signal: req.signal })) {
          send(event);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        send({ type: "error", message: `Błąd agenta: ${message}` });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
