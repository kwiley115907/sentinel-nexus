"use client";

import {
  FormEvent,
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { convertAiBlueprintToCad } from "@/components/cad/importers/AiImporter";
import {
  recallLastDevices,
  rememberLastDevices,
  stashPendingBuilding,
  stashWireRunProject,
} from "@/lib/aiHandoff";

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

type ChatIntent = "BUILD_BUILDING" | "BUILD_WIRE_RUN" | "CHAT";

// The chat is meant to work from anywhere (it's in the sidebar on every
// page), not just while already inside the 3D Builder - so a request to
// build something or wire something up is detected here and handed off to
// the tool that actually does it (see @/lib/aiHandoff), rather than only
// answering conversationally. Anything that doesn't match either pattern
// falls through to the normal chat API unchanged.
function detectIntent(prompt: string): ChatIntent {
  const text = prompt.toLowerCase();

  const wireRunTerm = /\b(wire|wiring|slc|nac|circuit|cable)\b/;
  const wireRunAction = /\b(wire up|hook up|connect|run wire|wire run)\b/;
  if (wireRunTerm.test(text) && wireRunAction.test(text)) {
    return "BUILD_WIRE_RUN";
  }

  const buildingAction = /\b(build|design|create|generate|make me|draw)\b/;
  const buildingNoun = /\b(building|school|hospital|office|warehouse|house|apartment|hotel|restaurant|mall|shopping center|retail|stores?|stor(y|ies)|floor plan|blueprint)\b/;
  if (buildingAction.test(text) && buildingNoun.test(text)) {
    return "BUILD_BUILDING";
  }

  return "CHAT";
}

export default function SentinelChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([
    createMessage(
      "assistant",
      "Hello. I am Sentinel Nexus. Ask me a question, tell me to build a building (e.g. \"build a 2 story school\"), or ask me to wire one up once it's built.",
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

    const intent = detectIntent(prompt);

    if (intent === "BUILD_BUILDING") {
      setIsSending(true);

      const model = convertAiBlueprintToCad({ prompt });
      stashPendingBuilding(model, prompt);
      rememberLastDevices(model.devices);

      setMessages((current) => [
        ...current,
        createMessage(
          "assistant",
          `Building it now - opening the 3D Builder with ${model.rooms.length} room(s), ${model.doors.length} door(s), and ${model.devices.length} fire alarm device(s). You can keep editing it there, or come back here for more.`,
        ),
      ]);

      setTimeout(() => router.push("/blueprint-3d"), 700);
      setIsSending(false);
      return;
    }

    if (intent === "BUILD_WIRE_RUN") {
      const devices = recallLastDevices();

      if (!devices || devices.length === 0) {
        setMessages((current) => [
          ...current,
          createMessage(
            "assistant",
            "I don't have a building to wire yet - ask me to build one first (for example \"build a 2 story school\"), then ask me to wire it up.",
          ),
        ]);
        return;
      }

      setIsSending(true);
      const runCount = stashWireRunProject(devices);

      setMessages((current) => [
        ...current,
        createMessage(
          "assistant",
          `Wired it up - created ${runCount} run(s), devices of the same type chained together on one loop. Opening Wire Runs...`,
        ),
      ]);

      setTimeout(() => router.push("/wire-runs"), 700);
      setIsSending(false);
      return;
    }

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
