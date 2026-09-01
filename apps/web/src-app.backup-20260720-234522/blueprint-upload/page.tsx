"use client";

import AppShell from "@/components/AppShell";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function BlueprintUploadPage() {
  const [status, setStatus] = useState("");

  async function uploadBlueprint(file: File) {
    setStatus("Uploading...");

    const safeName = file.name.replaceAll(" ", "-").toLowerCase();
    const path = `blueprints/${Date.now()}-${safeName}`;

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

    setStatus(`Uploaded: ${path}`);
  }

  return (
    <AppShell>
      <section className="acp-card acp-glow rounded-[2rem] p-6">
        <h1 className="text-4xl font-black text-yellow-300">Blueprint Uploads</h1>
        <p className="mt-3 text-yellow-100/80">Upload PDF, PNG, or JPG blueprint files.</p>

        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) uploadBlueprint(file);
          }}
          className="mt-6 w-full rounded-2xl bg-black/30 p-4"
        />

        {status && <p className="mt-4 text-yellow-300">{status}</p>}
      </section>
    </AppShell>
  );
}
