export const FALLBACK = "I don't have that information in Hassam's portfolio knowledge base.";
export const UNAVAILABLE = 'Hassam AI is temporarily unavailable. Please try again.';
export const MAX_MESSAGE = 1200;
export const MAX_HISTORY = 8;
export type Turn = { role: 'user' | 'assistant'; content: string };
export type ChatInput = { message: string; history: Turn[] };
export class RequestError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export function validateInput(value: unknown): ChatInput {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new RequestError(400, 'Send a JSON object.');
  const { message, history = [] } = value as Record<string, unknown>;
  if (typeof message !== 'string' || !message.trim() || message.length > MAX_MESSAGE)
    throw new RequestError(400, 'Enter a question of 1–1,200 characters.');
  if (!Array.isArray(history) || history.length > MAX_HISTORY) throw new RequestError(400, 'Conversation history is too long.');
  const turns: Turn[] = history.map((turn: unknown) => {
    if (!turn || typeof turn !== 'object') throw new RequestError(400, 'Invalid conversation history.');
    const { role, content } = turn as Record<string, unknown>;
    if ((role !== 'user' && role !== 'assistant') || typeof content !== 'string' || !content.trim() || content.length > 2400)
      throw new RequestError(400, 'Invalid conversation history.');
    return { role, content: content.trim() };
  });
  return { message: message.trim(), history: turns };
}
