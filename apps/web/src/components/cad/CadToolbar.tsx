"use client";

import {
  MousePointer2, Move, RotateCw, Maximize2, Ruler, Footprints,
  Save, Download, ChevronUp, ChevronDown,
} from "lucide-react";
import type { CadCommand } from "@/components/cad/CadRibbon";
import type { UpgradeAction } from "@/components/cad/Cad3DUpgradePanel";

const LAYER_COLORS: Record<string, string> = {
  ARCHITECTURE: "#e5e7eb",
  FIRE_ALARM: "#ef4444",
  CCTV: "#38bdf8",
  SECURITY: "#facc15",
  ACCESS: "#a855f7",
};

const LABEL_OVERRIDES: Record<string, string> = {
  CCTV: "CCTV",
};

function layerLabel(key: string) {
  if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key];
  return key
    .toLowerCase()
    .split("_")
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

export default function CadToolbar({
  command,
  onCommand,
  gizmoMode,
  measureMode,
  walkMode,
  currentFloor,
  onUpgradeAction,
  visibleLayers,
  onToggleLayer,
  onSave,
  onExport,
}: {
  command: CadCommand;
  onCommand: (command: CadCommand) => void;
  gizmoMode: "MOVE" | "ROTATE" | "RESIZE";
  measureMode: boolean;
  walkMode: boolean;
  currentFloor: number;
  onUpgradeAction: (action: UpgradeAction) => void;
  visibleLayers: Record<string, boolean>;
  onToggleLayer: (layer: string) => void;
  onSave: () => void;
  onExport: () => void;
}) {
  const accent = "#fde047";
  const dim = "#9ca3af";

  const tools = [
    { id: "select", label: "Select", icon: MousePointer2, active: command === "SELECT", onClick: () => onCommand("SELECT") },
    { id: "move", label: "Move", icon: Move, active: gizmoMode === "MOVE", onClick: () => onUpgradeAction("MOVE_GIZMO") },
    { id: "rotate", label: "Rotate", icon: RotateCw, active: gizmoMode === "ROTATE", onClick: () => onUpgradeAction("ROTATE_GIZMO") },
    { id: "scale", label: "Scale", icon: Maximize2, active: gizmoMode === "RESIZE", onClick: () => onUpgradeAction("RESIZE_GIZMO") },
    { id: "measure", label: "Measure", icon: Ruler, active: measureMode, onClick: () => onUpgradeAction("MEASURE") },
    { id: "walk", label: "Walk", icon: Footprints, active: walkMode, onClick: () => onUpgradeAction("FIRST_PERSON") },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-yellow-400/30 bg-[#171821]/95 px-3 py-2 shadow-2xl">
      <div className="flex items-center gap-0.5">
        {tools.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              type="button"
              onClick={t.onClick}
              className="flex flex-col items-center justify-center rounded-lg px-2.5 py-1.5 transition-colors"
              style={{
                background: t.active ? "rgba(253,224,71,0.16)" : "transparent",
                color: t.active ? accent : dim,
              }}
            >
              <Icon size={16} strokeWidth={2} />
              <span className="mt-0.5 text-[9px] font-bold">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mx-1 h-8 w-px bg-white/10" />

      <button type="button" onClick={onSave} className="rounded-lg p-1.5 hover:bg-white/5" style={{ color: dim }} title="Save">
        <Save size={16} />
      </button>
      <button type="button" onClick={onExport} className="rounded-lg p-1.5 hover:bg-white/5" style={{ color: dim }} title="Export PDF">
        <Download size={16} />
      </button>

      <div className="mx-1 h-8 w-px bg-white/10" />

      <div className="flex items-center gap-1 rounded-lg border border-yellow-400/20 bg-black/30 px-2 py-1 text-xs font-bold" style={{ color: accent }}>
        Floor: {currentFloor}
        <div className="ml-1 flex flex-col">
          <button type="button" onClick={() => onUpgradeAction("FLOOR_UP")} className="leading-none" style={{ color: dim }}>
            <ChevronUp size={12} />
          </button>
          <button type="button" onClick={() => onUpgradeAction("FLOOR_DOWN")} className="leading-none" style={{ color: dim }}>
            <ChevronDown size={12} />
          </button>
        </div>
      </div>

      <div className="mx-1 h-8 w-px bg-white/10" />

      <div className="flex flex-wrap items-center gap-1">
        {Object.keys(visibleLayers).map((layer) => {
          const on = visibleLayers[layer];
          return (
            <button
              key={layer}
              type="button"
              onClick={() => onToggleLayer(layer)}
              className="flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-bold"
              style={{
                borderColor: on ? "rgba(253,224,71,0.35)" : "rgba(255,255,255,0.08)",
                background: on ? "rgba(253,224,71,0.08)" : "transparent",
                color: on ? "#e5e7eb" : "#6b7280",
              }}
              title={on ? "Visible — click to hide" : "Hidden — click to show"}
            >
              <span className="h-2 w-2 rounded-full" style={{ background: LAYER_COLORS[layer] ?? "#999999", opacity: on ? 1 : 0.35 }} />
              {layerLabel(layer)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
