"use client";

import AppShell from "@/components/AppShell";
import { useState } from "react";

export default function AiToolsPage() {
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");

  async function analyze() {
    const response = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    setResult(data.result || data.error || "No result");
  }

  return (
    <AppShell>
      <h1 className="text-4xl font-black text-yellow-300">AI Tools</h1>

      <textarea
        value={prompt}
        onChange={(event) => setPrompt(event.target.value)}
        placeholder="Ask for safe estimating, inspection, device schedule, or report help..."
        className="mt-6 h-40 w-full rounded-2xl bg-black/45 p-4"
      />

      <button onClick={analyze} className="mt-4 rounded-xl acp-button px-5 py-3 font-black text-[#3a2418]">
        Run AI
      </button>

      <pre className="mt-6 whitespace-pre-wrap rounded-[2rem] acp-card p-5 backdrop-blur-md">
        {result}
      </pre>
    </AppShell>
  );
}
