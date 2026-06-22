/** Model danych interfejsu czatu (po stronie klienta). */

export interface TextPart {
  kind: "text";
  text: string;
}

/** Odpowiedź asystenta składa się wyłącznie z fragmentów tekstu (Markdown). */
export type AssistantPart = TextPart;

export interface UserMessage {
  role: "user";
  text: string;
}

export interface AssistantMessage {
  role: "assistant";
  parts: AssistantPart[];
}

export type ChatMessage = UserMessage | AssistantMessage;
