"use client";

import {
  BadgeIcon,
  Box,
  Camera,
  Circle,
  Copy,
  DoorOpen,
  Eraser,
  Eye,
  FileText,
  Flame,
  Grid2X2,
  Home,
  Layers,
  Maximize,
  Move,
  Pencil,
  RotateCcw,
  Ruler,
  Scaling,
  Square,
  Type,
  Zap,
} from "lucide-react";
import { useState } from "react";

export type CadCommand =
  | "SELECT" | "LINE" | "POLYLINE" | "CIRCLE" | "ARC" | "RECTANGLE"
  | "MOVE" | "COPY" | "ROTATE" | "SCALE" | "OFFSET" | "TRIM" | "DELETE"
  | "TEXT" | "DIMENSION" | "LEADER" | "ROOM_LABEL" | "STAIRS"
  | "FENCE" | "GATE" | "TREE" | "SHRUB" | "FLOWER"
  | "SMOKE" | "HEAT" | "PULL" | "HORN_STROBE" | "CAMERA" | "CARD_READER" | "REX" | "DOOR_CONTACT"
  | "WIRE" | "HOMERUN" | "SLC_LOOP" | "NAC_CIRCUIT" | "CONDUIT"
  | "LAYER_MANAGER" | "PROPERTIES" | "BLOCKS"
  | "TOP_VIEW" | "FRONT_VIEW" | "SIDE_VIEW" | "RESET_VIEW"
  | "MATERIAL_LIST" | "EXPORT_PDF" | "AI_REVIEW";

type LayerState = {
  name: string;
  color: string;
  visible: boolean;
};

type RibbonButton = {
  label: string;
  command: CadCommand;
  icon: React.ComponentType<{ size?: number; className?: string }>;
};

type RibbonGroup = {
  title: string;
  commands: RibbonButton[];
};

const tabs: Record<string, RibbonGroup[]> = {
  Home: [
    {
      title: "Draw",
      commands: [
        { label: "Line", command: "LINE", icon: Pencil },
        { label: "Polyline", command: "POLYLINE", icon: Pencil },
        { label: "Circle", command: "CIRCLE", icon: Circle },
        { label: "Arc", command: "ARC", icon: RotateCcw },
        { label: "Rect", command: "RECTANGLE", icon: Square },
      ],
    },
    {
      title: "Modify",
      commands: [
        { label: "Move", command: "MOVE", icon: Move },
        { label: "Copy", command: "COPY", icon: Copy },
        { label: "Rotate", command: "ROTATE", icon: RotateCcw },
        { label: "Scale", command: "SCALE", icon: Scaling },
        { label: "Trim", command: "TRIM", icon: Eraser },
        { label: "Delete", command: "DELETE", icon: Eraser },
      ],
    },
  ],
  Insert: [
    {
      title: "Architecture",
      commands: [
        { label: "Wall", command: "LINE", icon: Home },
        { label: "Door", command: "RECTANGLE", icon: DoorOpen },
        { label: "Window", command: "RECTANGLE", icon: Grid2X2 },
        { label: "Blocks", command: "BLOCKS", icon: Box },
      ],
    },
  ],
  Annotate: [
    {
      title: "Annotations",
      commands: [
        { label: "Text", command: "TEXT", icon: Type },
        { label: "Dimension", command: "DIMENSION", icon: Ruler },
        { label: "Leader", command: "LEADER", icon: Pencil },
        { label: "Room", command: "ROOM_LABEL", icon: BadgeIcon },
      ],
    },
  ],
  Devices: [
    {
      title: "Fire Alarm",
      commands: [
        { label: "Smoke", command: "SMOKE", icon: Flame },
        { label: "Heat", command: "HEAT", icon: Flame },
        { label: "Pull", command: "PULL", icon: Square },
        { label: "Horn", command: "HORN_STROBE", icon: Zap },
      ],
    },
    {
      title: "Security",
      commands: [
        { label: "Camera", command: "CAMERA", icon: Camera },
        { label: "Reader", command: "CARD_READER", icon: BadgeIcon },
        { label: "REX", command: "REX", icon: DoorOpen },
        { label: "Contact", command: "DOOR_CONTACT", icon: Square },
      ],
    },
  ],
  Cabling: [
    {
      title: "Low Voltage",
      commands: [
        { label: "Wire", command: "WIRE", icon: Zap },
        { label: "Home Run", command: "HOMERUN", icon: Home },
        { label: "SLC Loop", command: "SLC_LOOP", icon: RotateCcw },
        { label: "NAC", command: "NAC_CIRCUIT", icon: Zap },
        { label: "Conduit", command: "CONDUIT", icon: Pencil },
      ],
    },
  ],
  View: [
    {
      title: "Camera",
      commands: [
        { label: "Top", command: "TOP_VIEW", icon: Eye },
        { label: "Front", command: "FRONT_VIEW", icon: Eye },
        { label: "Side", command: "SIDE_VIEW", icon: Eye },
        { label: "Reset", command: "RESET_VIEW", icon: Maximize },
      ],
    },
  ],
  Reports: [
    {
      title: "Output",
      commands: [
        { label: "Materials", command: "MATERIAL_LIST", icon: FileText },
        { label: "PDF", command: "EXPORT_PDF", icon: FileText },
        { label: "AI Review", command: "AI_REVIEW", icon: Zap },
      ],
    },
  ],
};

const defaultLayers: LayerState[] = [
  { name: "Architecture", color: "#ffffff", visible: true },
  { name: "Fire Alarm", color: "#ef4444", visible: true },
  { name: "CCTV", color: "#38bdf8", visible: true },
  { name: "Access", color: "#22c55e", visible: true },
  { name: "Security", color: "#facc15", visible: true },
];

export default function CadRibbon({
  activeCommand,
  onCommand,
}: {
  activeCommand: CadCommand;
  onCommand: (command: CadCommand) => void;
}) {
  const [activeTab, setActiveTab] = useState("Home");
  const [currentLayer, setCurrentLayer] = useState("Architecture");
  const [layers, setLayers] = useState(defaultLayers);

  return (
    <section className="overflow-hidden rounded-2xl border border-yellow-400/30 bg-[#171821]/95 shadow-2xl">
      <div className="flex overflow-x-auto border-b border-white/10 bg-[#202232]">
        {Object.keys(tabs).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-black ${
              activeTab === tab ? "bg-yellow-400 text-black" : "text-yellow-100"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex gap-3 overflow-x-auto p-3">
        <div className="min-w-[210px] border-r border-white/10 pr-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-black text-yellow-300">
            <Layers size={16} />
            Layer Controls
          </div>

          <select
            value={currentLayer}
            onChange={(event) => setCurrentLayer(event.target.value)}
            className="w-full rounded-lg bg-[#2a2d3d] p-2 text-sm font-bold text-yellow-100"
          >
            {layers.map((layer) => (
              <option key={layer.name} value={layer.name}>
                {layer.name}
              </option>
            ))}
          </select>

          <div className="mt-2 grid gap-1">
            {layers.map((layer) => (
              <button
                key={layer.name}
                type="button"
                onClick={() =>
                  setLayers((items) =>
                    items.map((item) =>
                      item.name === layer.name
                        ? { ...item, visible: !item.visible }
                        : item,
                    ),
                  )
                }
                className="flex items-center justify-between rounded-lg bg-[#2a2d3d] px-2 py-1 text-xs font-bold text-yellow-100"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: layer.color }}
                  />
                  {layer.name}
                </span>
                <span>{layer.visible ? "ON" : "OFF"}</span>
              </button>
            ))}
          </div>
        </div>

        {tabs[activeTab].map((group) => (
          <div key={group.title} className="min-w-fit border-r border-white/10 pr-3">
            <div className="grid grid-flow-col grid-rows-2 gap-2">
              {group.commands.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={`${group.title}-${item.command}-${item.label}`}
                    type="button"
                    onClick={() => onCommand(item.command)}
                    className={`flex h-16 w-20 flex-col items-center justify-center rounded-lg border text-[11px] font-black ${
                      activeCommand === item.command
                        ? "border-yellow-300 bg-yellow-400 text-black"
                        : "border-white/10 bg-[#2a2d3d] text-yellow-100 hover:bg-[#35394d]"
                    }`}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-center text-xs font-bold text-yellow-100/50">
              {group.title}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
