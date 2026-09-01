"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";

export default function AiProjectAssistantPage() {
  const [project, setProject] = useState<unknown>({});
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("alarm-core-project");
    setProject(saved ? JSON.parse(saved) : {});
  }, []);

  async function askAi() {
    setLoading(true);
    setAnswer("");

    const response = await fetch("/api/ai/project-assistant", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, project }),
    });

    const data = await response.json();

    setAnswer(data.answer || data.error || "No AI response.");
    setLoading(false);
  }

  function setQuickPrompt(prompt: string) {
    setQuestion(prompt);
  }

  return (
    <AppShell>
      <section className="acp-card acp-glow rounded-[2rem] p-6">
        <p className="font-black uppercase tracking-[0.3em] text-yellow-300">
          Sentinel Nexus AI
        </p>

        <h1 className="mt-3 text-4xl font-black">
          AI Project Assistant
        </h1>

        <p className="mt-3 text-yellow-100/80">
          Ask questions about your blueprints, devices, wire runs, inspections, punch lists, and reports.
        </p>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <PromptButton text="Generate a device schedule from this project." onClick={setQuickPrompt} />
        <PromptButton text="Summarize wire runs and estimate total footage." onClick={setQuickPrompt} />
        <PromptButton text="Create a professional inspection report." onClick={setQuickPrompt} />
        <PromptButton text="List missing project information before closeout." onClick={setQuickPrompt} />
      </section>

      <section className="acp-card mt-6 rounded-[2rem] p-6">
        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask Sentinel Nexus AI about this project..."
          className="min-h-40 w-full rounded-2xl bg-black/60 p-4 text-white outline-none"
        />

        <button
          type="button"
          onClick={askAi}
          disabled={loading || question.trim().length < 3}
          className="mt-4 w-full cursor-pointer rounded-2xl bg-yellow-400 p-4 font-black text-black disabled:opacity-50"
        >
          {loading ? "Thinking..." : "Ask AI"}
        </button>

        {answer && (
          <pre className="mt-6 whitespace-pre-wrap rounded-2xl bg-black/60 p-5 text-yellow-100">
            {answer}
          </pre>
        )}
      </section>
    </AppShell>
  );
}

function PromptButton({
  text,
  onClick,
}: {
  text: string;
  onClick: (value: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onClick(text)}
      className="acp-card cursor-pointer rounded-[2rem] p-4 text-left font-bold text-yellow-100 hover:text-yellow-300"
    >
      {text}
    </button>
  );
}
