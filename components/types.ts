/** Model danych interfejsu czatu (po stronie klienta). */

export type ToolStatus = "running" | "done" | "error";

export interface TextPart {
  kind: "text";
  text: string;
}

export interface ToolPart {
  kind: "tool";
  id: string;
  name: string;
  input: unknown;
  result?: unknown;
  status: ToolStatus;
}

export type AssistantPart = TextPart | ToolPart;

export interface UserMessage {
  role: "user";
  text: string;
}

export interface AssistantMessage {
  role: "assistant";
  parts: AssistantPart[];
}

export type ChatMessage = UserMessage | AssistantMessage;
