"use client";

import { Home, Minus, DoorOpen, Square, TrendingUp, Zap, Ruler, Trash2, Triangle, Trees, Flower2, Shrub, Fence, DoorClosed, Columns2 } from "lucide-react";
import type { CadCommand } from "@/components/cad/CadRibbon";

export default function CadObjectRail({
  onCommand,
  onStatus,
  showRoof,
  onToggleRoof,
  splitView,
  onToggleSplitView,
}: {
  onCommand: (command: CadCommand) => void;
  onStatus: (message: string) => void;
  showRoof?: boolean;
  onToggleRoof?: () => void;
  splitView?: boolean;
  onToggleSplitView?: () => void;
}) {
  const dim = "#9ca3af";

  const tools: Array<{ label: string; icon: any; onClick: () => void }> = [
    { label: "Add Room", icon: Home, onClick: () => onCommand("RECTANGLE") },
    { label: "Add Wall", icon: Minus, onClick: () => onCommand("LINE") },
    { label: "Add Door", icon: DoorOpen, onClick: () => onCommand("BLOCKS") },
    { label: "Add Window", icon: Square, onClick: () => onCommand("TEXT") },
    { label: "Add Stair", icon: TrendingUp, onClick: () => onCommand("STAIRS") },
    { label: "Add Device", icon: Zap, onClick: () => onCommand("SMOKE") },
    { label: "Dimension", icon: Ruler, onClick: () => onCommand("DIMENSION") },
    { label: "Fence", icon: Fence, onClick: () => onCommand("FENCE") },
    { label: "Gate", icon: DoorClosed, onClick: () => onCommand("GATE") },
    { label: "Tree", icon: Trees, onClick: () => onCommand("TREE") },
    { label: "Shrub", icon: Shrub, onClick: () => onCommand("SHRUB") },
    { label: "Flowers", icon: Flower2, onClick: () => onCommand("FLOWER") },
  ];

  return (
    <div className="absolute right-3 top-3 bottom-3 z-10 flex w-16 flex-col gap-1 overflow-y-auto rounded-2xl border border-yellow-400/30 bg-[#171821]/90 p-1.5 backdrop-blur-md">
      {tools.map((t) => {
        const Icon = t.icon;
        return (
          <button
            key={t.label}
            type="button"
            onClick={t.onClick}
            className="flex flex-col items-center justify-center rounded-xl py-2 hover:bg-white/5"
            style={{ color: dim }}
          >
            <Icon size={17} strokeWidth={1.8} />
            <span className="mt-1 text-center text-[8px] font-bold leading-tight">{t.label}</span>
          </button>
        );
      })}
      {onToggleRoof && (
        <button
          type="button"
          onClick={onToggleRoof}
          className="flex flex-col items-center justify-center rounded-xl py-2 hover:bg-white/5"
          style={{ color: showRoof === false ? "#9ca3af" : "#fde047" }}
        >
          <Triangle size={17} strokeWidth={1.8} />
          <span className="mt-1 text-[8px] font-bold">
            Roof {showRoof === false ? "Off" : "On"}
          </span>
        </button>
      )}

      {onToggleSplitView && (
        <button
          type="button"
          onClick={onToggleSplitView}
          className="flex flex-col items-center justify-center rounded-xl py-2 hover:bg-white/5"
          style={{ color: splitView ? "#fde047" : "#9ca3af" }}
        >
          <Columns2 size={17} strokeWidth={1.8} />
          <span className="mt-1 text-center text-[8px] font-bold leading-tight">
            Split {splitView ? "On" : "View"}
          </span>
        </button>
      )}

      <div className="flex-1" />
      <button
        type="button"
        onClick={() => onCommand("DELETE")}
        className="flex flex-col items-center justify-center rounded-xl py-2 hover:bg-red-500/10"
        style={{ color: "#f87171" }}
      >
        <Trash2 size={17} strokeWidth={1.8} />
        <span className="mt-1 text-[8px] font-bold">Clear All</span>
      </button>
    </div>
  );
}
