"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ApiResponse = {
  success?: boolean;
  error?: string;
  data?: {
    reply?: string;
    response?: string;
    message?: string;
    text?: string;
    answer?: string;
  };
};

function createMessage(
  role: ChatMessage["role"],
  content: string,
): ChatMessage {
  return {
    id:
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    role,
    content,
  };
}

function extractReply(result: ApiResponse): string {
  const data = result.data;

  if (!data) {
    return "The AI service returned an empty response.";
  }

  return (
    data.reply ??
    data.response ??
    data.message ??
    data.text ??
    data.answer ??
    "The AI service responded, but no reply text was found."
  );
}

export default function SentinelChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      "assistant",
      "Hello. I am Sentinel Nexus. How can I assist you?",
    ),
  ]);

  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const messageContainer = messagesRef.current;

    if (!messageContainer) {
      return;
    }

    /*
     * Scroll only the chat message box.
     * Do not use scrollIntoView(), because that can scroll the
     * entire website or sidebar.
     */
    messageContainer.scrollTo({
      top: messageContainer.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, isSending]);

  async function sendMessage() {
    const prompt = input.trim();

    if (!prompt || isSending) {
      return;
    }

    const userMessage = createMessage("user", prompt);

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt,
        }),
      });

      const result = (await response.json()) as ApiResponse;

      if (!response.ok || result.success === false) {
        throw new Error(
          result.error || `Request failed with status ${response.status}`,
        );
      }

      const reply = extractReply(result);

      setMessages((current) => [
        ...current,
        createMessage("assistant", reply),
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "An unknown error occurred.";

      setMessages((current) => [
        ...current,
        createMessage(
          "assistant",
          `I could not reach the Sentinel AI service. ${message}`,
        ),
      ]);
    } finally {
      setIsSending(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendMessage();
  }

  function handleKeyDown(
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    /*
     * Prevent Enter from inserting a newline, submitting through
     * the browser, or moving focus and scrolling the page.
     */
    event.preventDefault();
    event.stopPropagation();

    void sendMessage();
  }

  return (
    <section className="sentinel-chat">
      <header className="sentinel-chat__header">
        <div>
          <strong>Sentinel Nexus AI</strong>
          <p>{isSending ? "Thinking…" : "Online"}</p>
        </div>
      </header>

      <div ref={messagesRef} className="sentinel-chat__messages">
        {messages.map((message) => (
          <article
            key={message.id}
            className={`sentinel-chat__message sentinel-chat__message--${message.role}`}
          >
            <span>
              {message.role === "user" ? "You" : "Sentinel"}
            </span>

            <p>{message.content}</p>
          </article>
        ))}

        {isSending && (
          <article className="sentinel-chat__message sentinel-chat__message--assistant">
            <span>Sentinel</span>
            <p>Processing your request…</p>
          </article>
        )}

      </div>

      <form
        className="sentinel-chat__form"
        onSubmit={handleSubmit}
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Sentinel Nexus..."
          rows={3}
          disabled={isSending}
        />

        <button
          type="submit"
          disabled={isSending || !input.trim()}
        >
          {isSending ? "Sending…" : "Send"}
        </button>
      </form>
    </section>
  );
}
