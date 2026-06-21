"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentEvent } from "@/lib/agent";
import type {
  AssistantPart,
  ChatMessage,
  TextPart,
  ToolPart,
} from "./types";
import { Message } from "./Message";
import styles from "./Chat.module.css";

const EXAMPLES = [
  "Porównaj Gliwice i Kraków dla 10 kWp na najbliższy tydzień",
  "Ile prądu uzyskam z 8 kWp w Gdańsku w ciągu 5 dni?",
  "Jaka będzie pogoda i nasłonecznienie w Zakopanem?",
];

/** Z historii UI buduje payload dla /api/chat (same pary user/asystent jako tekst). */
function toApiMessages(messages: ChatMessage[]) {
  return messages
    .map((m) =>
      m.role === "user"
        ? { role: "user" as const, content: m.text }
        : {
            role: "assistant" as const,
            content: m.parts
              .filter((p): p is TextPart => p.kind === "text")
              .map((p) => p.text)
              .join(""),
          },
    )
    .filter((m) => m.content.trim().length > 0);
}

export function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages]);

  const applyEvent = useCallback((event: AgentEvent) => {
    setMessages((prev) => {
      const next = [...prev];
      const last = next[next.length - 1];
      if (!last || last.role !== "assistant") return prev;
      const parts: AssistantPart[] = [...last.parts];

      switch (event.type) {
        case "text": {
          const tail = parts[parts.length - 1];
          if (tail && tail.kind === "text") {
            parts[parts.length - 1] = { ...tail, text: tail.text + event.text };
          } else {
            parts.push({ kind: "text", text: event.text });
          }
          break;
        }
        case "tool_use":
          parts.push({
            kind: "tool",
            id: event.id,
            name: event.name,
            input: event.input,
            status: "running",
          });
          break;
        case "tool_result": {
          const idx = parts.findIndex(
            (p) => p.kind === "tool" && p.id === event.id,
          );
          if (idx !== -1) {
            const tp = parts[idx] as ToolPart;
            parts[idx] = {
              ...tp,
              result: event.result,
              status: event.isError ? "error" : "done",
            };
          }
          break;
        }
        case "error":
          parts.push({ kind: "text", text: `\n\n⚠️ ${event.message}` });
          break;
        case "done":
          break;
      }

      next[next.length - 1] = { role: "assistant", parts };
      return next;
    });
  }, []);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || isStreaming) return;

      const history: ChatMessage[] = [
        ...messages,
        { role: "user", text: trimmed },
      ];
      setMessages([...history, { role: "assistant", parts: [] }]);
      setInput("");
      setError(null);
      setIsStreaming(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: toApiMessages(history) }),
        });

        if (!res.ok || !res.body) {
          const data = (await res.json().catch(() => null)) as {
            error?: string;
          } | null;
          throw new Error(data?.error ?? `Błąd serwera (${res.status}).`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const blocks = buffer.split("\n\n");
          buffer = blocks.pop() ?? "";
          for (const block of blocks) {
            const line = block
              .split("\n")
              .find((l) => l.startsWith("data:"));
            if (!line) continue;
            try {
              applyEvent(JSON.parse(line.slice(5).trim()) as AgentEvent);
            } catch {
              // niekompletny/nieparsowalny fragment — pomijamy
            }
          }
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setIsStreaming(false);
      }
    },
    [applyEvent, isStreaming, messages],
  );

  const isEmpty = messages.length === 0;

  return (
    <div className={styles.chat}>
      <div className={styles.scroll} ref={scrollRef}>
        {isEmpty ? (
          <div className={styles.empty}>
            <p className={styles.emptyLead}>
              Zapytaj o nasłonecznienie, prognozę uzysku lub porównaj
              lokalizacje pod fotowoltaikę.
            </p>
            <div className={styles.examples}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  className={styles.example}
                  onClick={() => send(ex)}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={styles.messages}>
            {messages.map((m, i) => (
              <Message key={i} message={m} />
            ))}
          </div>
        )}
      </div>

      {error && <div className={styles.error}>⚠️ {error}</div>}

      <form
        className={styles.composer}
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <textarea
          className={styles.textarea}
          value={input}
          placeholder="Napisz wiadomość… (np. Gliwice vs Kraków, 10 kWp)"
          rows={1}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send(input);
            }
          }}
          disabled={isStreaming}
        />
        <button
          type="submit"
          className={styles.send}
          disabled={isStreaming || input.trim().length === 0}
          aria-label="Wyślij"
        >
          {isStreaming ? "…" : "Wyślij"}
        </button>
      </form>
    </div>
  );
}
