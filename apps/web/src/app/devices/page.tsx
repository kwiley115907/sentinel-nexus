"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";

type Device = {
  id: string;
  tag: string;
  type: string;
  status?: string;
  notes?: string;
};

type Project = {
  devices?: Device[];
};

export default function DevicesPage() {
  const [project, setProject] = useState<Project>({ devices: [] });

  useEffect(() => {
    setProject(JSON.parse(localStorage.getItem("alarm-core-project") || '{"devices":[]}'));
  }, []);

  function saveDevices(devices: Device[]) {
    const next = { ...project, devices };
    setProject(next);
    localStorage.setItem("alarm-core-project", JSON.stringify(next));
  }

  return (
    <AppShell>
      <h1 className="text-4xl font-black text-yellow-300">Devices</h1>

      <section className="mt-6 grid gap-4">
        {project.devices?.map((device) => (
          <div key={device.id} className="rounded-[2rem] acp-card/85 p-5">
            <input
              value={device.tag}
              onChange={(event) =>
                saveDevices(project.devices?.map((item) =>
                  item.id === device.id ? { ...item, tag: event.target.value } : item
                ) || [])
              }
              className="w-full rounded-xl bg-[#2b1a12]/80 p-3 text-xl font-bold"
            />

            <p className="mt-2 text-yellow-300">{device.type}</p>
            <p className="text-yellow-100/70">Status: {device.status || "PLANNED"}</p>

            <textarea
              value={device.notes || ""}
              onChange={(event) =>
                saveDevices(project.devices?.map((item) =>
                  item.id === device.id ? { ...item, notes: event.target.value } : item
                ) || [])
              }
              placeholder="Notes"
              className="mt-3 w-full rounded-xl bg-[#2b1a12]/80 p-3"
            />

            <button
              onClick={() => saveDevices(project.devices?.filter((item) => item.id !== device.id) || [])}
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
