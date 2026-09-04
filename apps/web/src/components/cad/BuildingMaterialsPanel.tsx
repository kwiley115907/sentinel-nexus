"use client";

import type { ExteriorMaterial, InteriorFinish, WallSide } from "@/components/cad/renderers/InteriorWallRenderer";

const SIDES: { side: WallSide; label: string }[] = [
  { side: "NORTH", label: "North" },
  { side: "SOUTH", label: "South" },
  { side: "EAST", label: "East" },
  { side: "WEST", label: "West" },
];

const EXTERIOR_OPTIONS: { value: ExteriorMaterial; label: string }[] = [
  { value: "SIDING", label: "Siding" },
  { value: "STUCCO", label: "Stucco" },
  { value: "BRICK", label: "Brick" },
];

const INTERIOR_OPTIONS: { value: InteriorFinish; label: string }[] = [
  { value: "SHEETROCK", label: "Sheetrock" },
  { value: "TILE", label: "Tile" },
];

export default function BuildingMaterialsPanel({
  exteriorMaterials,
  onExteriorChange,
  interiorFinish,
  onInteriorChange,
}: {
  exteriorMaterials: Record<WallSide, ExteriorMaterial>;
  onExteriorChange: (side: WallSide, material: ExteriorMaterial) => void;
  interiorFinish: InteriorFinish;
  onInteriorChange: (finish: InteriorFinish) => void;
}) {
  return (
    <div className="rounded-2xl border border-yellow-400/30 bg-black/20 p-4">
      <h2 className="text-lg font-black text-yellow-300">Building Materials</h2>

      <p className="mt-1 text-xs text-yellow-100/60">
        Choose exterior siding per side and an interior wall finish.
      </p>

      <div className="mt-4 space-y-3">
        {SIDES.map(({ side, label }) => (
          <div key={side}>
            <p className="mb-1 text-xs font-bold uppercase tracking-wide text-yellow-100/70">
              {label} Exterior
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {EXTERIOR_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onExteriorChange(side, option.value)}
                  className={`rounded-lg px-2 py-1.5 text-xs font-bold ${
                    exteriorMaterials[side] === option.value
                      ? "bg-yellow-400 text-black"
                      : "bg-white/10 text-yellow-100 hover:bg-white/20"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-yellow-400/20 pt-4">
        <p className="mb-1 text-xs font-bold uppercase tracking-wide text-yellow-100/70">
          Interior Walls
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {INTERIOR_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onInteriorChange(option.value)}
              className={`rounded-lg px-2 py-1.5 text-xs font-bold ${
                interiorFinish === option.value
                  ? "bg-yellow-400 text-black"
                  : "bg-white/10 text-yellow-100 hover:bg-white/20"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
