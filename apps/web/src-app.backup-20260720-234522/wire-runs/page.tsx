"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";

type Device = {
  id: string;
  tag: string;
  x: number;
  y: number;
};

type WireRun = {
  id: string;
  label: string;
  cableType: string;
  fromId: string;
  toId: string;
};

type Project = {
  devices?: Device[];
  wireRuns?: WireRun[];
  feetPerUnit?: number;
};

export default function WireRunsPage() {
  const [project, setProject] = useState<Project>({
    devices: [],
    wireRuns: [],
    feetPerUnit: 2,
  });

  useEffect(() => {
    setProject(JSON.parse(localStorage.getItem("alarm-core-project") || "{}"));
  }, []);

  const deviceMap = useMemo(
    () => new Map((project.devices || []).map((device) => [device.id, device])),
    [project.devices],
  );

  function getFeet(from?: Device, to?: Device) {
    if (!from || !to) return 0;

    const dx = from.x - to.x;
    const dy = from.y - to.y;

    return Math.round(Math.sqrt(dx * dx + dy * dy) * (project.feetPerUnit || 2));
  }

  return (
    <AppShell>
      <h1 className="text-4xl font-black text-yellow-300">Wire Runs</h1>

      {(project.wireRuns || []).length === 0 ? (
        <div className="mt-6 rounded-[2rem] acp-card p-6 backdrop-blur-md">
          <h2 className="text-2xl font-black">No wire runs yet</h2>
          <p className="mt-2 text-yellow-100/80">
            Go to Blueprint Viewer, upload or build a blueprint, add at least two devices, then click Add Wire Run.
          </p>
          <a href="/blueprint-viewer" className="mt-5 inline-block rounded-xl acp-button px-5 py-3 font-black text-[#3a2418]">
            Open Blueprint Viewer
          </a>
        </div>
      ) : (
        <section className="mt-6 grid gap-4">
          {project.wireRuns?.map((run) => {
            const from = deviceMap.get(run.fromId);
            const to = deviceMap.get(run.toId);

            return (
              <div key={run.id} className="rounded-[2rem] acp-card p-5 backdrop-blur-md">
                <h2 className="text-2xl font-black">{run.label}</h2>
                <p className="mt-2 text-yellow-300">{run.cableType}</p>
                <p className="mt-2">{from?.tag || "?"} → {to?.tag || "?"}</p>
                <p className="mt-2 text-xl font-black">{getFeet(from, to)} ft</p>
              </div>
            );
          })}
        </section>
      )}
    </AppShell>
  );
}
