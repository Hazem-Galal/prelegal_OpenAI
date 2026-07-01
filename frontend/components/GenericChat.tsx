"use client";

import { useState, type FormEvent } from "react";
import type { FieldValues } from "@/lib/genericDocument";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type Props = {
  documentId: string | null;
  greeting: string;
  onDocumentIdChange: (documentId: string) => void;
  onFieldsUpdate: (fields: FieldValues) => void;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

const ERROR_REPLY: ChatMessage = {
  role: "assistant",
  content: "Sorry, something went wrong reaching the assistant. Please try again.",
};

export default function GenericChat({ documentId, greeting, onDocumentIdChange, onFieldsUpdate }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([{ role: "assistant", content: greeting }]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || isSending) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/generic`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId, messages: nextMessages }),
      });
      if (!response.ok) throw new Error(`Chat request failed: ${response.status}`);

      const data: { documentId: string | null; reply: string; fields: FieldValues } = await response.json();
      setMessages((current) => [...current, { role: "assistant", content: data.reply }]);
      if (data.documentId) onDocumentIdChange(data.documentId);
      onFieldsUpdate(data.fields);
    } catch {
      setMessages((current) => [...current, ERROR_REPLY]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex h-full flex-col gap-4 rounded-xl border border-neutral-100 bg-white p-5 shadow-xs dark:border-neutral-700 dark:bg-neutral-900/40">
      <div className="flex max-h-[60vh] flex-1 flex-col gap-3 overflow-y-auto">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              message.role === "user"
                ? "self-end bg-primary text-primary-foreground"
                : "self-start bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
            }`}
          >
            {message.content}
          </div>
        ))}
        {isSending && (
          <div className="self-start rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
            Thinking…
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type your answer…"
          disabled={isSending}
          className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm shadow-xs transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-100"
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:bg-neutral-400"
        >
          Send
        </button>
      </form>
    </div>
  );
}
