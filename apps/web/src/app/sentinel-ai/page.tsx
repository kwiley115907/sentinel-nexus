"use client";

import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function SentinelAiPage() {
  const [files, setFiles] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState("");

  async function uploadFile(file: File) {
    setStatus("Uploading file...");

    const safeName = file.name.replaceAll(" ", "-").toLowerCase();
    const path = `sentinel-ai/${Date.now()}-${safeName}`;

    const { error } = await supabase.storage
      .from("blueprints")
      .upload(path, file, {
        contentType: file.type,
        upsert: true,
      });

    if (error) {
      setStatus(error.message);
      return;
    }

    setFiles((current) => [...current, path]);
    setStatus("File uploaded.");
  }

  async function askAi() {
    setStatus("Sentinel AI is thinking...");
    setAnswer("");

    const response = await fetch("/api/sentinel-ai", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ question, notes, files }),
    });

    const data = await response.json();

    setAnswer(data.answer || data.error || "No response.");
    setStatus("");
  }

  return (
    <AppShell>
      <section className="rounded-[2rem] border border-yellow-400/30 bg-black/10 p-6 backdrop-blur-sm">
        <p className="font-black uppercase tracking-[0.3em] text-yellow-300">
          Sentinel AI
        </p>
        <h1 className="mt-3 text-4xl font-black">
          Blueprint & Low-Voltage AI Assistant
        </h1>
        <p className="mt-3 text-yellow-100/80">
          Upload plans, paste notes, and ask for device schedules, wire schedules, inspections, reports, and estimates.
        </p>
      </section>

      <section className="mt-6 rounded-[2rem] border border-yellow-400/30 bg-black/10 p-6 backdrop-blur-sm">
        <h2 className="text-2xl font-black text-yellow-300">Upload Files</h2>

        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
          className="mt-4 w-full rounded-xl bg-black/20 p-4"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) uploadFile(file);
          }}
        />

        {files.length > 0 && (
          <ul className="mt-4 space-y-2 text-yellow-100/80">
            {files.map((file) => (
              <li key={file}>{file}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-[2rem] border border-yellow-400/30 bg-black/10 p-6 backdrop-blur-sm">
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Paste project notes, device list, wire notes, inspection notes, or blueprint notes here..."
          className="min-h-40 w-full rounded-xl bg-black/20 p-4 text-white"
        />

        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask Sentinel AI a question..."
          className="mt-4 min-h-32 w-full rounded-xl bg-black/20 p-4 text-white"
        />

        <button
          type="button"
          onClick={askAi}
          disabled={question.trim().length < 3}
          className="mt-4 w-full rounded-xl bg-yellow-400 p-4 font-black text-black disabled:opacity-50"
        >
          Ask Sentinel AI
        </button>

        {status && <p className="mt-4 text-yellow-300">{status}</p>}

        {answer && (
          <pre className="mt-6 whitespace-pre-wrap rounded-xl bg-black/20 p-5 text-yellow-100">
            {answer}
          </pre>
        )}
      </section>
    </AppShell>
  );
}
