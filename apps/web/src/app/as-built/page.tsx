"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";

export default function AsBuiltPage() {
  const [project, setProject] = useState("");
  const [inspection, setInspection] = useState("");
  const [punchList, setPunchList] = useState("");

  useEffect(() => {
    setProject(localStorage.getItem("alarm-core-project") || "{}");
    setInspection(localStorage.getItem("alarm-core-inspection") || "[]");
    setPunchList(localStorage.getItem("alarm-core-punch-list") || "[]");
  }, []);

  function exportPackage() {
    const blob = new Blob([
      JSON.stringify({
        exportedAt: new Date().toISOString(),
        project: JSON.parse(project || "{}"),
        inspection: JSON.parse(inspection || "[]"),
        punchList: JSON.parse(punchList || "[]"),
      }, null, 2),
    ], { type: "application/json" });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "alarm-core-as-built-package.json";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <h1 className="text-4xl font-black text-yellow-300">As-Built Package</h1>
      <p className="mt-3 text-yellow-100/70">
        Export project data, device placements, wire runs, inspections, and punch list records.
      </p>

      <button onClick={exportPackage} className="mt-6 rounded-xl acp-button px-5 py-3 font-black text-[#3a2418]">
        Export As-Built Package
      </button>

      <pre className="mt-6 max-h-[600px] overflow-auto rounded-[2rem] bg-[#2b1a12]/80 p-5 text-sm text-yellow-100">
        {JSON.stringify({
          project: JSON.parse(project || "{}"),
          inspection: JSON.parse(inspection || "[]"),
          punchList: JSON.parse(punchList || "[]"),
        }, null, 2)}
      </pre>
    </AppShell>
  );
}
