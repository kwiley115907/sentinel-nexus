"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useState } from "react";

type Item = {
  id: string;
  title: string;
  status: string;
  notes: string;
};

export default function EnterpriseModule({
  storageKey,
  title,
  subtitle,
  fields,
}: {
  storageKey: string;
  title: string;
  subtitle: string;
  fields: string[];
}) {
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    setItems(JSON.parse(localStorage.getItem(storageKey) || "[]"));
  }, [storageKey]);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(items));
  }, [items, storageKey]);

  function addItem() {
    setItems([
      ...items,
      {
        id: Math.random().toString(36).substring(2, 15),
        title: `New ${title} Item`,
        status: "OPEN",
        notes: "",
      },
    ]);
  }

  return (
    <AppShell>
      <section className="rounded-[2rem] acp-card p-8 backdrop-blur-md">
        <p className="font-bold uppercase tracking-[0.3em] text-yellow-300">
          Sentinel Nexus
        </p>
        <h1 className="mt-3 text-4xl font-black">{title}</h1>
        <p className="mt-3 text-yellow-100/80">{subtitle}</p>
      </section>

      <button
        onClick={addItem}
        className="mt-6 rounded-xl acp-button px-5 py-3 font-black text-[#3a2418]"
      >
        Add Item
      </button>

      <section className="mt-6 grid gap-4">
        {items.map((item) => (
          <div key={item.id} className="rounded-[2rem] acp-card p-5 backdrop-blur-md">
            <input
              value={item.title}
              onChange={(event) =>
                setItems(items.map((x) =>
                  x.id === item.id ? { ...x, title: event.target.value } : x
                ))
              }
              className="w-full rounded-xl bg-black/5 p-3 text-xl font-bold"
            />

            <select
              value={item.status}
              onChange={(event) =>
                setItems(items.map((x) =>
                  x.id === item.id ? { ...x, status: event.target.value } : x
                ))
              }
              className="mt-3 w-full rounded-xl bg-black/5 p-3"
            >
              <option>OPEN</option>
              <option>IN_PROGRESS</option>
              <option>WAITING</option>
              <option>COMPLETE</option>
            </select>

            <textarea
              value={item.notes}
              onChange={(event) =>
                setItems(items.map((x) =>
                  x.id === item.id ? { ...x, notes: event.target.value } : x
                ))
              }
              placeholder={fields.join(", ")}
              className="mt-3 w-full rounded-xl bg-black/5 p-3"
            />

            <button
              onClick={() => setItems(items.filter((x) => x.id !== item.id))}
              className="mt-3 rounded-xl acp-danger px-4 py-2 font-bold"
            >
              Delete
            </button>
          </div>
        ))}
      </section>
    </AppShell>
  );
}
