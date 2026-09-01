"use client";

import AppShell from "@/components/AppShell";
import { Camera, FileImage, Network, ShieldAlert } from "lucide-react";
import { useEffect, useState } from "react";

type Project = {
  sheets?: unknown[];
  devices?: unknown[];
  wireRuns?: unknown[];
};

export default function DashboardPage() {
  const [project, setProject] = useState<Project>({
    sheets: [],
    devices: [],
    wireRuns: [],
  });

  useEffect(() => {
    const saved = localStorage.getItem("alarm-core-project");
    setProject(saved ? JSON.parse(saved) : { sheets: [], devices: [], wireRuns: [] });
  }, []);

  return (
    <AppShell>
      <section
        className="relative overflow-hidden rounded-[2.5rem] border border-yellow-400/25 p-8 shadow-2xl"
        style={{
          backgroundImage: `
            linear-gradient(120deg, rgba(0,0,0,0.32), rgba(70,15,10,0.22)),
            url("/app-background.png")
          `,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(250,204,21,0.22),transparent_28%)]" />

        <div className="relative z-10 max-w-4xl">
          <p className="font-black uppercase tracking-[0.35em] text-yellow-300">
            Sentinel Nexus
          </p>

          <h2 className="mt-4 text-5xl font-black leading-tight text-white">
            Low-Voltage Command Center
          </h2>

          <p className="mt-4 max-w-3xl text-lg text-yellow-100/90">
            A purpose-built operating system for low-voltage design, wiring, inspections,
            punch lists, reports, field work, and as-built closeout.
          </p>
        </div>
      </section>

      <section className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <Stat title="Blueprint Sheets" value={project.sheets?.length || 0} icon={<FileImage />} />
        <Stat title="Devices" value={project.devices?.length || 0} icon={<Camera />} />
        <Stat title="Wire Runs" value={project.wireRuns?.length || 0} icon={<Network />} />
        <Stat title="Inspection Items" value={0} icon={<ShieldAlert />} />
      </section>
    </AppShell>
  );
}

function Stat({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="acp-card acp-glow rounded-[2rem] p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-yellow-100/60">{title}</p>
          <p className="mt-2 text-5xl font-black text-yellow-300">{value}</p>
        </div>

        <div className="rounded-2xl bg-red-700/70 p-4 text-yellow-200">
          {icon}
        </div>
      </div>
    </div>
  );
}
