"use client";

export default function FloorSelector({
  stories,
  activeFloor,
  onChange,
}: {
  stories: number;
  activeFloor: number | "ALL";
  onChange: (floor: number | "ALL") => void;
}) {
  return (
    <div className="absolute right-4 top-4 z-30 flex flex-wrap gap-2 rounded-xl border border-yellow-400/40 bg-black/85 p-3">
      <button
        type="button"
        onClick={() => onChange("ALL")}
        className={`rounded-lg px-3 py-2 text-xs font-black ${
          activeFloor === "ALL"
            ? "bg-yellow-400 text-black"
            : "bg-white/10 text-white"
        }`}
      >
        All
      </button>

      {Array.from({ length: Math.max(1, stories) }).map((_, index) => {
        const floor = index + 1;

        return (
          <button
            key={floor}
            type="button"
            onClick={() => onChange(floor)}
            className={`rounded-lg px-3 py-2 text-xs font-black ${
              activeFloor === floor
                ? "bg-yellow-400 text-black"
                : "bg-white/10 text-white"
            }`}
          >
            Floor {floor}
          </button>
        );
      })}
    </div>
  );
}
