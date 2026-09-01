"use client";

import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function SyncPage() {
  const [status, setStatus] = useState("");

  async function uploadProject() {
    const project = localStorage.getItem("alarm-core-project") || "{}";

    const { error } = await supabase.from("projects").insert({
      name: "Sentinel Nexusject",
      data: JSON.parse(project),
    });

    setStatus(error ? error.message : "Project uploaded to Supabase.");
  }

  async function downloadLatestProject() {
    const { data, error } = await supabase
      .from("projects")
      .select("data")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (error) {
      setStatus(error.message);
      return;
    }

    localStorage.setItem("alarm-core-project", JSON.stringify(data.data));
    setStatus("Latest project downloaded. Refresh the viewer.");
  }

  return (
    <AppShell>
      <h1 className="text-4xl font-black text-yellow-300">Cloud Sync</h1>

      <div className="mt-6 flex flex-wrap gap-3">
        <button onClick={uploadProject} className="rounded-xl acp-button px-5 py-3 font-black text-[#3a2418]">
          Upload Project
        </button>
        <button onClick={downloadLatestProject} className="rounded-xl acp-danger px-5 py-3 font-black">
          Download Latest
        </button>
      </div>

      <p className="mt-5 text-yellow-100">{status}</p>
    </AppShell>
  );
}
