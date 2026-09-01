"use client";

import AppShell from "@/components/AppShell";
import {
  Camera,
  Flame,
  PanelTop,
  Radio,
  ShieldAlert,
  Upload,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

type Layer = "FIRE_ALARM" | "CAMERA";

type Device = {
  id: string;
  sheetId: string;
  tag: string;
  type: string;
  layer: Layer;
  x: number;
  y: number;
  notes: string;
};

type WireRun = {
  id: string;
  sheetId: string;
  label: string;
  cableType: string;
  fromId: string;
  toId: string;
  bendX?: number;
  bendY?: number;
};

type Sheet = {
  id: string;
  name: string;
  blueprint: string;
};

type Project = {
  sheets: Sheet[];
  devices: Device[];
  wireRuns: WireRun[];
  feetPerUnit: number;
  activeSheetId: string;
};

const fireAlarmDevices = [
  "SMOKE_DETECTOR",
  "HEAT_DETECTOR",
  "PULL_STATION",
  "HORN_STROBE",
  "STROBE",
  "DUCT_DETECTOR",
];

const modules = [
  "MONITOR_MODULE",
  "RELAY_MODULE",
  "CONTROL_MODULE",
  "ISOLATOR_MODULE",
];

const panels = [
  "FIRE_PANEL",
  "NAC_PANEL",
  "POWER_SUPPLY",
  "ANNUNCIATOR",
];

const cameraDevices = [
  "CAMERA",
  "DOME_CAMERA",
  "BULLET_CAMERA",
  "PTZ_CAMERA",
  "NVR",
  "NETWORK_SWITCH",
];

export default function BlueprintViewerPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const [project, setProject] = useState<Project>({
    sheets: [],
    devices: [],
    wireRuns: [],
    feetPerUnit: 2,
    activeSheetId: "",
  });

  const [selectedDeviceType, setSelectedDeviceType] = useState("SMOKE_DETECTOR");
  const [selectedLayer, setSelectedLayer] = useState<Layer>("FIRE_ALARM");
  const [selectedCableType, setSelectedCableType] = useState("18/2 FPLP");
  const [draggingDeviceId, setDraggingDeviceId] = useState("");
  const [draggingWireId, setDraggingWireId] = useState("");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  const activeSheet = project.sheets.find((sheet) => sheet.id === project.activeSheetId);
  const activeDevices = project.devices.filter((device) => device.sheetId === project.activeSheetId);
  const activeWireRuns = project.wireRuns.filter((run) => run.sheetId === project.activeSheetId);

  const deviceMap = useMemo(
    () => new Map(project.devices.map((device) => [device.id, device])),
    [project.devices],
  );

  useEffect(() => {
    const saved = localStorage.getItem("alarm-core-project");
    if (saved) setProject(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("alarm-core-project", JSON.stringify(project));
  }, [project]);

  function updateProject(next: Project) {
    setProject(next);
    localStorage.setItem("alarm-core-project", JSON.stringify(next));
  }

  function uploadBlueprint(file: File) {
    const reader = new FileReader();

    reader.onload = () => {
      const sheetId = Math.random().toString(36).substring(2, 15);

      updateProject({
        ...project,
        activeSheetId: sheetId,
        sheets: [
          ...project.sheets,
          {
            id: sheetId,
            name: file.name,
            blueprint: String(reader.result),
          },
        ],
      });
    };

    reader.readAsDataURL(file);
  }

  function addDevice() {
    if (!project.activeSheetId) return;

    const count = activeDevices.length + 1;
    const layer = selectedLayer;

    updateProject({
      ...project,
      devices: [
        ...project.devices,
        {
          id: Math.random().toString(36).substring(2, 15),
          sheetId: project.activeSheetId,
          tag: `${selectedDeviceType}-${count}`,
          type: selectedDeviceType,
          layer,
          x: 50,
          y: 50,
          notes: "",
        },
      ],
    });
  }

  function addWireRun() {
    if (activeDevices.length < 2) return;

    updateProject({
      ...project,
      wireRuns: [
        ...project.wireRuns,
        {
          id: Math.random().toString(36).substring(2, 15),
          sheetId: project.activeSheetId,
          label: `WR-${activeWireRuns.length + 1}`,
          cableType: selectedCableType,
          fromId: activeDevices[0].id,
          toId: activeDevices[1].id,
        },
      ],
    });
  }

  function moveWire(clientX: number, clientY: number) {
    if (!draggingWireId || !viewerRef.current) return;

    const box = viewerRef.current.getBoundingClientRect();
    const bendX = ((clientX - box.left - pan.x) / zoom / box.width) * 100;
    const bendY = ((clientY - box.top - pan.y) / zoom / box.height) * 100;

    updateProject({
      ...project,
      wireRuns: project.wireRuns.map((run) =>
        run.id === draggingWireId
          ? {
              ...run,
              bendX: Math.max(0, Math.min(100, bendX)),
              bendY: Math.max(0, Math.min(100, bendY)),
            }
          : run,
      ),
    });
  }

  function moveDevice(clientX: number, clientY: number) {
    if (!draggingDeviceId || !viewerRef.current) return;

    const box = viewerRef.current.getBoundingClientRect();
    const x = ((clientX - box.left - pan.x) / zoom / box.width) * 100;
    const y = ((clientY - box.top - pan.y) / zoom / box.height) * 100;

    updateProject({
      ...project,
      devices: project.devices.map((device) =>
        device.id === draggingDeviceId
          ? {
              ...device,
              x: Math.max(0, Math.min(100, x)),
              y: Math.max(0, Math.min(100, y)),
            }
          : device,
      ),
    });
  }

  function getWireFeet(from?: Device, to?: Device) {
    if (!from || !to) return 0;

    const dx = from.x - to.x;
    const dy = from.y - to.y;

    return Math.round(Math.sqrt(dx * dx + dy * dy) * project.feetPerUnit);
  }

  function exportCsv() {
    const rows = [
      ["Label", "Cable Type", "From", "To", "Feet"],
      ...project.wireRuns.map((run) => {
        const from = deviceMap.get(run.fromId);
        const to = deviceMap.get(run.toId);

        return [
          run.label,
          run.cableType,
          from?.tag || "",
          to?.tag || "",
          String(getWireFeet(from, to)),
        ];
      }),
    ];

    const csv = rows.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");

    link.href = url;
    link.download = "alarm-core-wire-schedule.csv";
    link.click();

    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <h1 className="text-4xl font-black text-yellow-300">Blueprint Viewer</h1>

      <section className="mt-6 rounded-[2rem] acp-card p-5 backdrop-blur-md">
        <h2 className="text-2xl font-black text-yellow-300">Blueprint Tool Menu</h2>

        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-xl acp-button p-3 font-black text-[#3a2418]"
          >
            <Upload size={18} />
            Upload Blueprint
          </button>

          <input
            ref={fileRef}
            hidden
            type="file"
            accept="image/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadBlueprint(file);
            }}
          />

          <button
            onClick={() => setZoom((value) => Math.min(3, value + 0.2))}
            className="flex items-center justify-center gap-2 rounded-xl acp-danger p-3 font-black"
          >
            <ZoomIn size={18} />
            Zoom In
          </button>

          <button
            onClick={() => setZoom((value) => Math.max(0.5, value - 0.2))}
            className="flex items-center justify-center gap-2 rounded-xl acp-danger p-3 font-black"
          >
            <ZoomOut size={18} />
            Zoom Out
          </button>

          <button
            onClick={() => setPan({ x: pan.x - 40, y: pan.y })}
            className="rounded-xl acp-card/60 p-3 font-black"
          >
            Pan Left
          </button>

          <button
            onClick={() => setPan({ x: pan.x + 40, y: pan.y })}
            className="rounded-xl acp-card/60 p-3 font-black"
          >
            Pan Right
          </button>

          <button
            onClick={() => setPan({ x: pan.x, y: pan.y - 40 })}
            className="rounded-xl acp-card/60 p-3 font-black"
          >
            Pan Up
          </button>

          <button
            onClick={() => setPan({ x: pan.x, y: pan.y + 40 })}
            className="rounded-xl acp-card/60 p-3 font-black"
          >
            Pan Down
          </button>

          <select
            value={selectedLayer}
            onChange={(event) => setSelectedLayer(event.target.value as Layer)}
            className="rounded-xl bg-[#2b1a12] p-3 font-bold"
          >
            <option value="FIRE_ALARM">Fire Alarm Layer</option>
            <option value="CAMERA">Camera Layer</option>
          </select>

          <select
            onChange={(event) => {
              if (!event.target.value) return;
              setSelectedDeviceType(event.target.value);
              setSelectedLayer("FIRE_ALARM");
            }}
            className="rounded-xl bg-[#2b1a12] p-3 font-bold"
            defaultValue=""
          >
            <option value="" disabled>Fire Alarm Devices</option>
            {fireAlarmDevices.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>

          <select
            onChange={(event) => {
              if (!event.target.value) return;
              setSelectedDeviceType(event.target.value);
              setSelectedLayer("FIRE_ALARM");
            }}
            className="rounded-xl bg-[#2b1a12] p-3 font-bold"
            defaultValue=""
          >
            <option value="" disabled>Modules</option>
            {modules.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>

          <select
            onChange={(event) => {
              if (!event.target.value) return;
              setSelectedDeviceType(event.target.value);
              setSelectedLayer("FIRE_ALARM");
            }}
            className="rounded-xl bg-[#2b1a12] p-3 font-bold"
            defaultValue=""
          >
            <option value="" disabled>Panels / Controls</option>
            {panels.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>

          <select
            onChange={(event) => {
              if (!event.target.value) return;
              setSelectedDeviceType(event.target.value);
              setSelectedLayer("CAMERA");
            }}
            className="rounded-xl bg-[#2b1a12] p-3 font-bold"
            defaultValue=""
          >
            <option value="" disabled>Camera / Security</option>
            {cameraDevices.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>

          <button
            onClick={addDevice}
            className="rounded-xl acp-button p-3 font-black text-[#3a2418]"
          >
            Add Device Marker
          </button>

          <select
            value={selectedCableType}
            onChange={(event) => setSelectedCableType(event.target.value)}
            className="rounded-xl bg-[#2b1a12] p-3 font-bold"
          >
            <option>18/2 FPLP</option>
            <option>18/4 FPLP</option>
            <option>16/2 FPLP</option>
            <option>CAT6</option>
            <option>RG6</option>
            <option>22/4 SECURITY</option>
          </select>

          <button
            onClick={addWireRun}
            className="rounded-xl acp-danger p-3 font-black"
          >
            Add Wire Run
          </button>

          <button
            onClick={exportCsv}
            className="rounded-xl acp-button p-3 font-black text-[#3a2418]"
          >
            Export Wire CSV
          </button>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div
          ref={viewerRef}
          onPointerMove={(event) => {
            moveDevice(event.clientX, event.clientY);
            moveWire(event.clientX, event.clientY);
          }}
          onPointerUp={() => {
            setDraggingDeviceId("");
            setDraggingWireId("");
          }}
          onPointerCancel={() => {
            setDraggingDeviceId("");
            setDraggingWireId("");
          }}
          className="relative min-h-[560px] touch-none overflow-hidden rounded-[2rem] bg-black/45"
        >
          <div
            className="absolute inset-0"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: "top left",
            }}
          >
            {activeSheet ? (
              <img
                src={activeSheet.blueprint}
                alt="Blueprint"
                className="h-full w-full object-contain"
              />
            ) : (
              <div className="flex h-[560px] items-center justify-center text-yellow-100/70">
                Click “Upload Blueprint” to start.
              </div>
            )}

            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
            >
              {activeWireRuns.map((run) => {
                const from = deviceMap.get(run.fromId);
                const to = deviceMap.get(run.toId);

                if (!from || !to) return null;

                const bendX = run.bendX ?? (from.x + to.x) / 2;
                const bendY = run.bendY ?? (from.y + to.y) / 2;

                return (
                  <g key={run.id}>
                    <polyline
                      points={`${from.x},${from.y} ${bendX},${bendY} ${to.x},${to.y}`}
                      fill="none"
                      stroke="#facc15"
                      strokeWidth="4"
                      strokeDasharray="8 6"
                      vectorEffect="non-scaling-stroke"
                    />

                    <circle
                      cx={`${bendX}%`}
                      cy={`${bendY}%`}
                      r="1.8%"
                      fill="#facc15"
                      stroke="#7f1d1d"
                      strokeWidth="2"
                      className="pointer-events-auto cursor-grab"
                      onPointerDown={(event) => {
                        event.currentTarget.setPointerCapture(event.pointerId);
                        setDraggingWireId(run.id);
                      }}
                    />
                  </g>
                );
              })}
            </svg>

            {activeDevices.map((device) => (
              <button
                key={device.id}
                onPointerDown={(event) => {
                  event.currentTarget.setPointerCapture(event.pointerId);
                  setDraggingDeviceId(device.id);
                }}
                className={`absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-xl ${
                  device.layer === "CAMERA"
                    ? "acp-button text-[#3a2418]"
                    : "acp-danger text-white"
                }`}
                style={{
                  left: `${device.x}%`,
                  top: `${device.y}%`,
                }}
              >
                <DeviceIcon type={device.type} />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <Panel title="Device List">
            {activeDevices.map((device) => (
              <div key={device.id} className="mb-3 rounded-2xl bg-black/45 p-4">
                <input
                  value={device.tag}
                  onChange={(event) =>
                    updateProject({
                      ...project,
                      devices: project.devices.map((item) =>
                        item.id === device.id
                          ? { ...item, tag: event.target.value }
                          : item,
                      ),
                    })
                  }
                  className="w-full rounded-xl bg-[#2b1a12] p-2"
                />

                <p className="mt-2 text-yellow-300">{device.type}</p>

                <button
                  onClick={() =>
                    updateProject({
                      ...project,
                      devices: project.devices.filter((item) => item.id !== device.id),
                    })
                  }
                  className="mt-3 rounded-xl acp-danger px-4 py-2 font-bold"
                >
                  Delete
                </button>
              </div>
            ))}
          </Panel>

          <Panel title="Wire Runs">
            {activeWireRuns.map((run) => {
              const from = deviceMap.get(run.fromId);
              const to = deviceMap.get(run.toId);

              return (
                <div key={run.id} className="mb-3 rounded-2xl bg-black/45 p-4">
                  <p className="font-black">{run.label}</p>
                  <p className="text-yellow-300">{run.cableType}</p>
                  <p>{from?.tag || "?"} → {to?.tag || "?"}</p>
                  <p className="font-black">{getWireFeet(from, to)} ft</p>
                </div>
              );
            })}
          </Panel>
        </div>
      </section>
    </AppShell>
  );
}

function DeviceIcon({ type }: { type: string }) {
  if (type.includes("CAMERA")) return <Camera size={14} />;
  if (type === "FIRE_PANEL") return <ShieldAlert size={14} />;
  if (type === "NVR") return <PanelTop size={14} />;
  if (type === "PULL_STATION") return <Flame size={14} />;
  return <Radio size={14} />;
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[2rem] acp-card p-5 backdrop-blur-md">
      <h2 className="mb-4 text-2xl font-black text-yellow-300">{title}</h2>
      {children}
    </div>
  );
}
