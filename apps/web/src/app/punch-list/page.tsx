"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";

type PunchItem = {
  id: string;
  title: string;
  deviceTag: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "OPEN" | "IN_PROGRESS" | "DONE";
  notes: string;
};

export default function PunchListPage() {
  const [items, setItems] = useState<PunchItem[]>([]);

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem("alarm-core-punch-list") || "[]"));
  }, []);

  useEffect(() => {
    localStorage.setItem("alarm-core-punch-list", JSON.stringify(items));
  }, [items]);

  function addItem() {
    setItems([
      ...items,
      {
        id: Math.random().toString(36).substring(2, 15),
        title: "New punch item",
        deviceTag: "",
        priority: "MEDIUM",
        status: "OPEN",
        notes: "",
      },
    ]);
  }

  return (
    <AppShell>
      <h1 className="text-4xl font-black text-yellow-300">Punch List</h1>

      <button onClick={addItem} className="mt-6 rounded-xl acp-button px-5 py-3 font-black text-[#3a2418]">
        Add Punch Item
      </button>

      <section className="mt-6 grid gap-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-[2rem] acp-card/85 p-5">
            <input value={item.title} onChange={(e) => setItems(items.map((x) => x.id === item.id ? { ...x, title: e.target.value } : x))} className="w-full rounded-xl bg-[#2b1a12]/80 p-3 text-xl font-bold" />
            <input value={item.deviceTag} placeholder="Device tag" onChange={(e) => setItems(items.map((x) => x.id === item.id ? { ...x, deviceTag: e.target.value } : x))} className="mt-3 w-full rounded-xl bg-[#2b1a12]/80 p-3" />

            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <select value={item.priority} onChange={(e) => setItems(items.map((x) => x.id === item.id ? { ...x, priority: e.target.value as PunchItem["priority"] } : x))} className="rounded-xl bg-[#2b1a12]/80 p-3">
                <option>LOW</option><option>MEDIUM</option><option>HIGH</option>
              </select>
              <select value={item.status} onChange={(e) => setItems(items.map((x) => x.id === item.id ? { ...x, status: e.target.value as PunchItem["status"] } : x))} className="rounded-xl bg-[#2b1a12]/80 p-3">
                <option>OPEN</option><option>IN_PROGRESS</option><option>DONE</option>
              </select>
            </div>

            <textarea value={item.notes} placeholder="Notes" onChange={(e) => setItems(items.map((x) => x.id === item.id ? { ...x, notes: e.target.value } : x))} className="mt-3 w-full rounded-xl bg-[#2b1a12]/80 p-3" />

            <button onClick={() => setItems(items.filter((x) => x.id !== item.id))} className="mt-3 rounded-xl acp-danger px-4 py-2 font-bold">
              Delete
            </button>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
