"use client";

type TreeItem = {
  id: string;
  label: string;
  type: string;
};

export default function ObjectTree({
  items,
  selectedId,
  onSelect,
}: {
  items: TreeItem[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-yellow-400/30 bg-black/20 p-4">
      <h2 className="text-xl font-black text-yellow-300">Object Tree</h2>

      <div className="mt-4 grid gap-2">
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onSelect(item.id)}
            className={`rounded-xl p-3 text-left font-bold ${
              selectedId === item.id ? "bg-yellow-400 text-black" : "bg-black/30 text-yellow-100"
            }`}
          >
            {item.type}: {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
