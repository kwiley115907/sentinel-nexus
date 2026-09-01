"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";

type Sheet = {
  id: string;
  name: string;
  blueprint: string;
};

type Project = {
  sheets?: Sheet[];
};

export default function BlueprintsPage() {
  const [project, setProject] = useState<Project>({ sheets: [] });

  useEffect(() => {
    setProject(JSON.parse(localStorage.getItem("alarm-core-project") || '{"sheets":[]}'));
  }, []);

  function save(next: Project) {
    setProject(next);
    localStorage.setItem("alarm-core-project", JSON.stringify(next));
  }

  return (
    <AppShell>
      <h1 className="text-4xl font-black text-yellow-300">Blueprints</h1>

      <a href="/blueprint-viewer" className="mt-6 inline-block rounded-xl acp-button px-5 py-3 font-black text-[#3a2418]">
        Open Blueprint Studio
      </a>

      <section className="mt-6 grid gap-4">
        {project.sheets?.map((sheet) => (
          <div key={sheet.id} className="rounded-[2rem] acp-card/85 p-5">
            <h2 className="text-2xl font-black">{sheet.name}</h2>
            <img src={sheet.blueprint} alt={sheet.name} className="mt-4 max-h-64 rounded-xl object-contain" />
            <button
              onClick={() => save({ ...project, sheets: project.sheets?.filter((item) => item.id !== sheet.id) || [] })}
              className="mt-4 rounded-xl acp-danger px-4 py-2 font-bold"
            >
              Delete
            </button>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
