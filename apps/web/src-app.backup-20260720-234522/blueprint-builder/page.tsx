"use client";

import AppShell from "@/components/AppShell";
import BuilderUpgradePanel from "@/components/cad/BuilderUpgradePanel";
import SentinelAiPanel from "@/components/ai/SentinelAiPanel";
import CadRibbon, { CadCommand } from "@/components/cad/CadRibbon";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import { useEffect, useMemo, useRef, useState } from "react";

type Tool = "SELECT" | "ROOM" | "WALL" | "DOOR" | "WINDOW" | "DEVICE" | "WIRE";
type ViewMode = "2D" | "3D";
type Layer = "ARCHITECTURE" | "FIRE_ALARM" | "CCTV" | "SECURITY" | "ACCESS_CONTROL";
type DeviceType = "FACP" | "SMOKE" | "PULL" | "HORN_STROBE" | "DOME_CAMERA" | "DOOR_CONTACT" | "CARD_READER" | "REX";

type Room = { id: string; name: string; x: number; y: number; width: number; height: number; layer: Layer };
type LineItem = { id: string; type: "WALL" | "DOOR" | "WINDOW"; x1: number; y1: number; x2: number; y2: number; layer: Layer };
type Device = { id: string; type: DeviceType; label: string; x: number; y: number; notes: string; layer: Layer; size: number };
type WireRun = { id: string; fromDeviceId: string; toDeviceId: string; cableType: string; estimatedFeet: number };
type DraftPoint = { x: number; y: number };

type SupabaseDevice = {
  id: string;
  category: string;
  type: string;
  manufacturer: string | null;
  model: string | null;
  symbol: string | null;
};

const layers: Record<Layer, string> = {
  ARCHITECTURE: "Architecture",
  FIRE_ALARM: "Fire Alarm",
  CCTV: "CCTV",
  SECURITY: "Security",
  ACCESS_CONTROL: "Access Control",
};

const deviceLibrary: Record<DeviceType, { layer: Layer; label: string; symbol: string }> = {
  FACP: { layer: "FIRE_ALARM", label: "Fire Alarm Control Panel", symbol: "FACP" },
  SMOKE: { layer: "FIRE_ALARM", label: "Smoke Detector", symbol: "SD" },
  PULL: { layer: "FIRE_ALARM", label: "Pull Station", symbol: "PS" },
  HORN_STROBE: { layer: "FIRE_ALARM", label: "Horn/Strobe", symbol: "HS" },
  DOME_CAMERA: { layer: "CCTV", label: "Dome Camera", symbol: "CAM" },
  DOOR_CONTACT: { layer: "SECURITY", label: "Door Contact", symbol: "DC" },
  CARD_READER: { layer: "ACCESS_CONTROL", label: "Card Reader", symbol: "CR" },
  REX: { layer: "ACCESS_CONTROL", label: "Request To Exit", symbol: "REX" },
};

function makeId() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2);
}

function snap(value: number) {
  return Math.round(value / 2) * 2;
}

function distanceFeet(x1: number, y1: number, x2: number, y2: number, feetPerUnit: number) {
  return Math.round(Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2) * feetPerUnit);
}

export default function BlueprintBuilderPage() {
  const [builderFloor, setBuilderFloor] = useState(1);
  const [builderGridSize, setBuilderGridSize] = useState("12in");
  const [builderSnapEnabled, setBuilderSnapEnabled] = useState(true);

  const canvasRef = useRef<HTMLDivElement>(null);
  const [tool, setTool] = useState<Tool>("SELECT");
  const [ribbonCommand, setRibbonCommand] = useState<CadCommand>("SELECT");
  const [activeLayer, setActiveLayer] = useState<Layer>("ARCHITECTURE");
  const [deviceType, setDeviceType] = useState<DeviceType>("SMOKE");
  const [supabaseDevices, setSupabaseDevices] = useState<SupabaseDevice[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [lines, setLines] = useState<LineItem[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [wireRuns, setWireRuns] = useState<WireRun[]>([]);
  const [draftPoint, setDraftPoint] = useState<DraftPoint | null>(null);
  const [selectedId, setSelectedId] = useState("");
  const [selectedKind, setSelectedKind] = useState<"ROOM" | "DEVICE" | "">("");
  const [wireStartDeviceId, setWireStartDeviceId] = useState("");
  const [sheetName, setSheetName] = useState("Custom Blueprint");
  const [aiBuilderPrompt, setAiBuilderPrompt] = useState("");
  const [aiBuilderStatus, setAiBuilderStatus] = useState("");
  const [feetPerUnit, setFeetPerUnit] = useState(2);
  const [zoom, setZoom] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("2D");
  const [visibleLayers, setVisibleLayers] = useState<Record<Layer, boolean>>({
    ARCHITECTURE: true,
    FIRE_ALARM: true,
    CCTV: true,
    SECURITY: true,
    ACCESS_CONTROL: true,
  });

  const selectedRoom = rooms.find((room) => room.id === selectedId);
  const selectedDevice = devices.find((device) => device.id === selectedId);
  const filteredDevices = Object.entries(deviceLibrary).filter(([, item]) => item.layer === activeLayer);

  async function loadDeviceLibrary() {
    const { data, error } = await supabase
      .from("device_library")
      .select("*")
      .order("category");

    if (error) {
      alert(error.message);
      return;
    }

    setSupabaseDevices(data || []);
  }

  useEffect(() => {
    loadDeviceLibrary();
  }, []);

  const deviceCounts = useMemo(() => {
    return devices.reduce<Record<string, number>>((counts, device) => {
      const label = deviceLibrary[device.type].label;
      counts[label] = (counts[label] || 0) + 1;
      return counts;
    }, {});
  }, [devices]);

  function handleRibbonCommand(command: CadCommand) {
    setRibbonCommand(command);

    if (command === "SELECT") setTool("SELECT");
    if (command === "LINE" || command === "POLYLINE") setTool("WALL");
    if (command === "RECTANGLE" || command === "ROOM_LABEL") setTool("ROOM");
    if (command === "WIRE") setTool("WIRE");
    if (command === "SMOKE") {
      setDeviceType("SMOKE");
      setTool("DEVICE");
    }
    if (command === "HEAT") {
      setDeviceType("HEAT" as DeviceType);
      setTool("DEVICE");
    }
    if (command === "HORN_STROBE") {
      setDeviceType("HORN_STROBE");
      setTool("DEVICE");
    }
    if (command === "CAMERA") {
      setDeviceType("DOME_CAMERA");
      setTool("DEVICE");
    }
    if (command === "CARD_READER") {
      setDeviceType("CARD_READER");
      setTool("DEVICE");
    }
    if (command === "DELETE") {
      setRooms([]);
      setLines([]);
      setDevices([]);
      setWireRuns([]);
    }
  }

  function getPoint(clientX: number, clientY: number) {
    const box = canvasRef.current?.getBoundingClientRect();
    if (!box) return { x: 0, y: 0 };

    return {
      x: snap(Math.max(0, Math.min(100, ((clientX - box.left) / box.width) * 100))),
      y: snap(Math.max(0, Math.min(100, ((clientY - box.top) / box.height) * 100))),
    };
  }

  function handleCanvasClick(clientX: number, clientY: number) {
    const point = getPoint(clientX, clientY);

    if (tool === "SELECT" || tool === "WIRE") {
      setSelectedId("");
      setSelectedKind("");
      return;
    }

    if (tool === "ROOM") {
      setRooms((current) => [...current, { id: makeId(), name: `Room ${current.length + 1}`, x: point.x, y: point.y, width: 22, height: 16, layer: "ARCHITECTURE" }]);
      return;
    }

    if (tool === "DEVICE") {
      setDevices((current) => [...current, { id: makeId(), type: deviceType, label: `${deviceLibrary[deviceType].symbol}-${current.length + 1}`, x: point.x, y: point.y, notes: "", layer: deviceLibrary[deviceType].layer, size: 48 }]);
      return;
    }

    if (!draftPoint) {
      setDraftPoint(point);
      return;
    }

    setLines((current) => [...current, { id: makeId(), type: tool, x1: draftPoint.x, y1: draftPoint.y, x2: point.x, y2: point.y, layer: "ARCHITECTURE" }]);
    setDraftPoint(null);
  }

  function handleDeviceClick(device: Device) {
    if (tool === "WIRE") {
      if (!wireStartDeviceId) {
        setWireStartDeviceId(device.id);
        return;
      }

      if (wireStartDeviceId === device.id) {
        setWireStartDeviceId("");
        return;
      }

      const start = devices.find((item) => item.id === wireStartDeviceId);
      if (!start) return;

      setWireRuns((current) => [
        ...current,
        {
          id: makeId(),
          fromDeviceId: start.id,
          toDeviceId: device.id,
          cableType: "FPLP / CAT6 / Low-Voltage",
          estimatedFeet: distanceFeet(start.x, start.y, device.x, device.y, feetPerUnit),
        },
      ]);

      setWireStartDeviceId("");
      return;
    }

    setSelectedId(device.id);
    setSelectedKind("DEVICE");
  }

  function buildDoorSwingPath(line: LineItem) {
    const dx = line.x2 - line.x1;
    const dy = line.y2 - line.y1;
    const length = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
    const unitX = dx / length;
    const unitY = dy / length;
    const radius = Math.min(length, 10);
    const endX = line.x1 + unitX * radius;
    const endY = line.y1 + unitY * radius;
    const swingX = line.x1 - unitY * radius;
    const swingY = line.y1 + unitX * radius;

    return `M ${endX} ${endY} Q ${swingX} ${swingY} ${line.x1} ${line.y1}`;
  }

  function buildSvg() {
    return `
      <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100" viewBox="0 0 100 100">
        <rect width="100" height="100" fill="white"/>
        <defs><pattern id="grid" width="2" height="2" patternUnits="userSpaceOnUse"><path d="M 2 0 L 0 0 0 2" fill="none" stroke="#e5e7eb" stroke-width="0.08"/></pattern></defs>
        <rect width="100" height="100" fill="url(#grid)"/>

        ${rooms.map((room) => `<rect x="${room.x}" y="${room.y}" width="${room.width}" height="${room.height}" fill="none" stroke="black" stroke-width="0.45"/><text x="${room.x + 1.5}" y="${room.y + 4}" font-size="2.2" fill="black">${escapeSvg(room.name)}</text>`).join("")}

        ${lines.map((line) => line.type === "DOOR"
          ? `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="#92400e" stroke-width="0.45"/><path d="${buildDoorSwingPath(line)}" fill="none" stroke="#92400e" stroke-width="0.3"/>`
          : `<line x1="${line.x1}" y1="${line.y1}" x2="${line.x2}" y2="${line.y2}" stroke="${line.type === "WALL" ? "black" : "#2563eb"}" stroke-width="${line.type === "WALL" ? "0.7" : "0.45"}" ${line.type === "WINDOW" ? 'stroke-dasharray="1 0.7"' : ""}/>`).join("")}

        ${wireRuns.map((wire) => {
          const from = devices.find((device) => device.id === wire.fromDeviceId);
          const to = devices.find((device) => device.id === wire.toDeviceId);
          if (!from || !to) return "";
          const midX = (from.x + to.x) / 2;
          const midY = (from.y + to.y) / 2;
          return `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="#16a34a" stroke-width="0.35" stroke-dasharray="1 0.6"/><text x="${midX}" y="${midY}" font-size="1.4" fill="#166534">${wire.estimatedFeet} ft</text>`;
        }).join("")}

        ${devices.map((device) => `<circle cx="${device.x}" cy="${device.y}" r="${Math.max(1.2, device.size / 18)}" fill="#fde047" stroke="black" stroke-width="0.35"/><text x="${device.x - 1.8}" y="${device.y + 0.5}" font-size="1.2" font-weight="bold" fill="black">${deviceLibrary[device.type].symbol}</text>`).join("")}
      </svg>
    `;
  }

  function saveToViewer() {
    const sheetId = makeId();
    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(buildSvg())}`;
    const currentProject = JSON.parse(localStorage.getItem("alarm-core-project") || "{}");

    localStorage.setItem("alarm-core-project", JSON.stringify({
      ...currentProject,
      feetPerUnit,
      activeSheetId: sheetId,
      sheets: [...(currentProject.sheets || []), { id: sheetId, name: sheetName, blueprint: dataUrl }],
      devices: [...(currentProject.devices || []), ...devices],
      wireRuns: [...(currentProject.wireRuns || []), ...wireRuns],
    }));

    window.location.href = "/blueprint-viewer";
  }

  function exportSvg() {
    const url = URL.createObjectURL(new Blob([buildSvg()], { type: "image/svg+xml" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${sheetName || "blueprint"}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    const pdf = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
    const svg = buildSvg();
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

    const image = new Image();
    image.onload = () => {
      pdf.setFontSize(22);
      pdf.text(sheetName, 40, 40);

      pdf.setFontSize(11);
      pdf.text(`Scale: ${feetPerUnit} feet per grid unit`, 40, 62);

      pdf.addImage(image, "PNG", 40, 80, 700, 480);
      pdf.save(`${sheetName || "blueprint"}.pdf`);
    };

    image.src = svgUrl;
  }


  function parseFeetInches(value: string) {
    const text = value.trim();

    if (!text) return 0;

    const feetInches = text.match(/^(\d+(?:\.\d+)?)'\s*-?\s*(\d+(?:\.\d+)?)?"?$/);

    if (feetInches) {
      return Number(feetInches[1]) + Number(feetInches[2] || 0) / 12;
    }

    const inches = text.match(/^(\d+(?:\.\d+)?)\s*(in|inch|inches|")$/i);

    if (inches) {
      return Number(inches[1]) / 12;
    }

    return Number(text);
  }

  function updateSelectedRoom(field: "width" | "height", rawValue?: string) {
    if (!rawValue || selectedKind !== "ROOM") return;

    const value = parseFeetInches(rawValue);

    if (!value || value <= 0) return;

    setRooms((current) =>
      current.map((room) =>
        room.id === selectedId ? { ...room, [field]: value } : room,
      ),
    );
  }

  function updateSelectedLineLength(rawValue?: string) {
    if (!rawValue) return;

    const value = parseFeetInches(rawValue);

    if (!value || value <= 0) return;

    setLines((current) =>
      current.map((line) => {
        if (line.id !== selectedId) return line;

        const dx = line.x2 - line.x1;
        const dy = line.y2 - line.y1;
        const currentLength = Math.sqrt(dx * dx + dy * dy) || 1;
        const unitX = dx / currentLength;
        const unitY = dy / currentLength;

        return {
          ...line,
          x2: line.x1 + unitX * value,
          y2: line.y1 + unitY * value,
        };
      }),
    );
  }

  async function generateBuilderWithAi() {
    try {
      setAiBuilderStatus("Generating blueprint...");

      const response = await fetch("/api/sentinel-ai/gateway", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestType: "blueprint-generator",
          prompt: aiBuilderPrompt,
          projectContext: {
            sheetName,
            feetPerUnit,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "AI blueprint generation failed.");
      }

      if (!Array.isArray(data.rooms)) {
        throw new Error("AI did not return rooms.");
      }

      setRooms((current) => [...current, ...data.rooms]);
      setAiBuilderStatus(`Added ${data.rooms.length} AI room(s).`);
    } catch (error) {
      setAiBuilderStatus(
        error instanceof Error ? error.message : "AI generation failed.",
      );
    }
  }


    if (wireRuns.length) return setWireRuns((current) => current.slice(0, -1));
    if (devices.length) return setDevices((current) => current.slice(0, -1));
    if (lines.length) return setLines((current) => current.slice(0, -1));
    if (rooms.length) return setRooms((current) => current.slice(0, -1));


  function undoLast() {
    if (wireRuns.length) {
      setWireRuns((current) => current.slice(0, -1));
      return;
    }

    if (devices.length) {
      setDevices((current) => current.slice(0, -1));
      return;
    }

    if (lines.length) {
      setLines((current) => current.slice(0, -1));
      return;
    }

    if (rooms.length) {
      setRooms((current) => current.slice(0, -1));
    }
  }

  function handleBuilderUpgradeAction(action: string, value?: string) {
    if (action === "toggle-snap") {
      setBuilderSnapEnabled((current) => !current);
      return;
    }

    if (action === "grid-size" && value) {
      setBuilderGridSize(value);
      return;
    }

    if (action === "add-floor") {
      setBuilderFloor((current) => current + 1);
      return;
    }

    if (action === "remove-floor") {
      setBuilderFloor((current) => Math.max(1, current - 1));
      return;
    }

    if (action === "wizard" && value) {
      setTool("ROOM");
      return;
    }

    if (action === "set-width") {
      if (selectedKind === "ROOM") updateSelectedRoom("width", value);
      updateSelectedLineLength(value);
      return;
    }

    if (action === "set-depth" || action === "set-height") {
      updateSelectedRoom("height", value);
      return;
    }

    if (action === "clear") {
      setRooms([]);
      setLines([]);
      setDevices([]);
      setWireRuns([]);
      setSelectedId("");
      setSelectedKind("");
      return;
    }

    setTool(action.toUpperCase() as Tool);
  }

  return (
    <AppShell>
      
                <SentinelAiPanel
          blueprint={{
            rooms,
            lines,
            devices,
            wireRuns,
            feetPerUnit,
            sheetName,
          }}
          onRoomsGenerated={(generatedRooms) => {
            setRooms((current) => [...current, ...generatedRooms]);
          }}
        />

        <BuilderUpgradePanel
          selectedName={
            selectedKind === "ROOM"
              ? rooms.find((room) => room.id === selectedId)?.name || "Room"
              : selectedKind === "DEVICE"
                ? devices.find((device) => device.id === selectedId)?.type || "Device"
                : selectedId || ""
          }
          currentFloor={builderFloor}
          snapEnabled={builderSnapEnabled}
          gridSize={builderGridSize}
          onAction={handleBuilderUpgradeAction}
        />

        <section className="mb-4 rounded-[2rem] border border-yellow-400/30 bg-black/10 p-4 backdrop-blur-sm">
          <h2 className="text-xl font-black text-yellow-300">Sentinel Nexus AI Builder</h2>
          <textarea
            value={aiBuilderPrompt}
            onChange={(event) => setAiBuilderPrompt(event.target.value)}
            placeholder="Example: Create a 2 story school with classrooms, cafeteria, gym, office, and main lobby"
            className="mt-3 min-h-24 w-full rounded-xl bg-black/20 p-3 text-yellow-100"
          />
          <button
            type="button"
            onClick={generateBuilderWithAi}
            className="mt-3 w-full rounded-xl bg-yellow-400 p-3 font-black text-black"
          >
            Generate Blueprint
          </button>
          {aiBuilderStatus && (
            <p className="mt-2 text-sm font-bold text-yellow-200">{aiBuilderStatus}</p>
          )}
        </section>

      <div className="mb-4">
        <CadRibbon activeCommand={ribbonCommand} onCommand={handleRibbonCommand} />
      </div>

      <div className="grid min-h-[calc(100vh-8rem)] gap-4 xl:grid-cols-[220px_1fr_330px]">
        <aside className="rounded-[2rem] border border-yellow-400/30 bg-black/10 p-4 backdrop-blur-sm">
          <h2 className="text-xl font-black text-yellow-300">CAD Tools</h2>

          <div className="mt-4 grid gap-2">
            {(["SELECT", "ROOM", "WALL", "DOOR", "WINDOW", "DEVICE", "WIRE"] as Tool[]).map((item) => (
              <button key={item} onClick={() => { setTool(item); setDraftPoint(null); setWireStartDeviceId(""); }} className={`rounded-xl p-3 font-black ${tool === item ? "bg-yellow-400 text-black" : "bg-black/20 text-yellow-100"}`}>
                {item}
              </button>
            ))}
          </div>

          <h2 className="mt-6 text-xl font-black text-yellow-300">Layers</h2>
          <div className="mt-3 grid gap-2">
            {(Object.keys(layers) as Layer[]).map((layer) => (
              <button key={layer} onClick={() => setActiveLayer(layer)} className={`rounded-xl p-3 text-left font-bold ${activeLayer === layer ? "bg-yellow-400 text-black" : "bg-black/20 text-yellow-100"}`}>
                {layers[layer]}
              </button>
            ))}
          </div>
        </aside>

        <main>
          <section className="rounded-[2rem] border border-yellow-400/30 bg-black/10 p-4 backdrop-blur-sm">
            <div className="grid gap-3 md:grid-cols-6">
              <input value={sheetName} onChange={(event) => setSheetName(event.target.value)} className="rounded-xl bg-black/20 p-3" />
              <input type="number" value={feetPerUnit} onChange={(event) => setFeetPerUnit(Number(event.target.value))} className="rounded-xl bg-black/20 p-3" />
              <div className="md:col-span-2 grid grid-cols-2 gap-2 xl:grid-cols-4">
                {supabaseDevices.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setDeviceType(item.type as DeviceType);
                      setTool("DEVICE");
                    }}
                    className={`rounded-xl p-3 text-xs font-black ${
                      deviceType === item.type && tool === "DEVICE"
                        ? "bg-yellow-400 text-black"
                        : "bg-black/20 text-yellow-100"
                    }`}
                  >
                    {item.symbol || item.type}
                    <span className="block text-[10px] font-bold">
                      {item.model || item.type}
                    </span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setViewMode(viewMode === "2D" ? "3D" : "2D")}
                className="rounded-xl bg-purple-700 p-3 font-black text-white"
              >
                {viewMode} View
              </button>
              <button onClick={saveToViewer} className="rounded-xl bg-yellow-400 p-3 font-black text-black">Send To Viewer</button>
              <button onClick={exportSvg} className="rounded-xl bg-red-700 p-3 font-black text-white">Export SVG</button>
              <button onClick={exportPdf} className="rounded-xl bg-blue-700 p-3 font-black text-white">Export PDF</button>
            </div>
          </section>

          <div
            ref={canvasRef}
            onClick={(event) => handleCanvasClick(event.clientX, event.clientY)}
            className="relative mt-4 h-[720px] touch-none overflow-hidden rounded-[2rem] bg-white"
            style={{
              transform:
                viewMode === "3D"
                  ? `perspective(1000px) rotateX(55deg) rotateZ(-2deg) scale(${zoom})`
                  : `scale(${zoom})`,
              transformOrigin: "top center",
              boxShadow:
                viewMode === "3D"
                  ? "0 40px 80px rgba(0,0,0,0.45)"
                  : undefined,
            }}
          >
            <div className="absolute inset-0 bg-[linear-gradient(#ddd_1px,transparent_1px),linear-gradient(90deg,#ddd_1px,transparent_1px)] bg-[size:25px_25px]" />

            <svg className="absolute inset-0 h-full w-full">
              {lines.filter((line) => visibleLayers[line.layer]).map((line) => {
                const color = line.type === "WALL" ? "black" : line.type === "DOOR" ? "#92400e" : "#2563eb";
                const length = distanceFeet(line.x1, line.y1, line.x2, line.y2, feetPerUnit);
                const midX = (line.x1 + line.x2) / 2;
                const midY = (line.y1 + line.y2) / 2;

                if (line.type === "DOOR") {
                  return (
                    <g key={line.id}>
                      <line x1={`${line.x1}%`} y1={`${line.y1}%`} x2={`${line.x2}%`} y2={`${line.y2}%`} stroke={color} strokeWidth={3} />
                      <path d={buildDoorSwingPath(line)} fill="none" stroke={color} strokeWidth={2} />
                      <text x={`${midX}%`} y={`${midY}%`} fill="#111827" fontSize="14" fontWeight="bold">{length} ft</text>
                    </g>
                  );
                }

                return (
                  <g key={line.id}>
                    <line x1={`${line.x1}%`} y1={`${line.y1}%`} x2={`${line.x2}%`} y2={`${line.y2}%`} stroke={color} strokeWidth={line.type === "WALL" ? 5 : 3} strokeDasharray={line.type === "WINDOW" ? "8 6" : undefined} />
                    <text x={`${midX}%`} y={`${midY}%`} fill="#111827" fontSize="14" fontWeight="bold">{length} ft</text>
                  </g>
                );
              })}

              {wireRuns.map((wire) => {
                const from = devices.find((device) => device.id === wire.fromDeviceId);
                const to = devices.find((device) => device.id === wire.toDeviceId);
                if (!from || !to) return null;

                return (
                  <g key={wire.id}>
                    <line x1={`${from.x}%`} y1={`${from.y}%`} x2={`${to.x}%`} y2={`${to.y}%`} stroke="#16a34a" strokeWidth={3} strokeDasharray="8 6" />
                    <text x={`${(from.x + to.x) / 2}%`} y={`${(from.y + to.y) / 2}%`} fill="#166534" fontSize="14" fontWeight="bold">{wire.estimatedFeet} ft</text>
                  </g>
                );
              })}

              {draftPoint && <circle cx={`${draftPoint.x}%`} cy={`${draftPoint.y}%`} r="8" fill="#dc2626" />}
            </svg>

            {rooms.filter((room) => visibleLayers[room.layer]).map((room) => (
              <div
                key={room.id}
                draggable
                onDragEnd={(event) => {
                  const point = getPoint(event.clientX, event.clientY);
                  setRooms((items) => items.map((item) => item.id === room.id ? { ...item, x: Math.max(0, Math.min(100 - item.width, point.x)), y: Math.max(0, Math.min(100 - item.height, point.y)) } : item));
                }}
                onClick={(event) => { event.stopPropagation(); setSelectedId(room.id); setSelectedKind("ROOM"); }}
                className={`absolute border-4 bg-white/70 p-2 text-black ${selectedId === room.id ? "border-red-600" : "border-black"}`}
                style={{ left: `${room.x}%`, top: `${room.y}%`, width: `${room.width}%`, height: `${room.height}%` }}
              >
                <b>{room.name}</b>
              </div>
            ))}

            {devices.filter((device) => visibleLayers[device.layer]).map((device) => (
              <button
                key={device.id}
                draggable
                onDragEnd={(event) => {
                  const point = getPoint(event.clientX, event.clientY);
                  setDevices((items) => items.map((item) => item.id === device.id ? { ...item, x: point.x, y: point.y } : item));
                }}
                onClick={(event) => { event.stopPropagation(); handleDeviceClick(device); }}
                className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 bg-yellow-300 text-xs font-black text-black shadow-xl ${wireStartDeviceId === device.id || selectedId === device.id ? "border-red-600" : "border-black"}`}
                style={{ left: `${device.x}%`, top: `${device.y}%`, width: `${device.size}px`, height: `${device.size}px` }}
              >
                {deviceLibrary[device.type].symbol}
              </button>
            ))}
          </div>
        </main>

        <aside className="rounded-[2rem] border border-yellow-400/30 bg-black/10 p-4 backdrop-blur-sm">
          <h2 className="text-xl font-black text-yellow-300">Object Properties</h2>

          <label className="mt-4 block text-sm font-bold text-yellow-100/70">Canvas Zoom</label>
          <input type="range" min="0.75" max="1.5" step="0.05" value={zoom} onChange={(event) => setZoom(Number(event.target.value))} className="w-full" />

          {selectedKind === "ROOM" && selectedRoom && (
            <div className="mt-5 grid gap-3">
              <input value={selectedRoom.name} onChange={(event) => setRooms((items) => items.map((item) => item.id === selectedRoom.id ? { ...item, name: event.target.value } : item))} className="rounded-xl bg-black/20 p-3" />
              <button onClick={() => setRooms((items) => items.filter((item) => item.id !== selectedRoom.id))} className="rounded-xl bg-red-700 p-3 font-black text-white">Delete Room</button>
            </div>
          )}

          {selectedKind === "DEVICE" && selectedDevice && (
            <div className="mt-5 grid gap-3">
              <input value={selectedDevice.label} onChange={(event) => setDevices((items) => items.map((item) => item.id === selectedDevice.id ? { ...item, label: event.target.value } : item))} className="rounded-xl bg-black/20 p-3" />
              <label className="text-sm font-bold text-yellow-100/70">Device Size: {selectedDevice.size}px</label>
              <input type="range" min="24" max="82" step="2" value={selectedDevice.size} onChange={(event) => setDevices((items) => items.map((item) => item.id === selectedDevice.id ? { ...item, size: Number(event.target.value) } : item))} />
              <textarea value={selectedDevice.notes} onChange={(event) => setDevices((items) => items.map((item) => item.id === selectedDevice.id ? { ...item, notes: event.target.value } : item))} className="min-h-24 rounded-xl bg-black/20 p-3" placeholder="Device notes" />
              <button onClick={() => setDevices((items) => items.filter((item) => item.id !== selectedDevice.id))} className="rounded-xl bg-red-700 p-3 font-black text-white">Delete Device</button>
            </div>
          )}

          <h2 className="mt-8 text-xl font-black text-yellow-300">Wire Runs</h2>
          <div className="mt-3 grid gap-2">
            {wireRuns.map((wire) => (
              <div key={wire.id} className="rounded-xl bg-black/20 p-3">
                <b>{wire.estimatedFeet} ft</b>
                <p className="text-xs text-yellow-100/70">{wire.cableType}</p>
              </div>
            ))}
          </div>

          <h2 className="mt-8 text-xl font-black text-yellow-300">Material Count</h2>
          <div className="mt-3 grid gap-2">
            {Object.entries(deviceCounts).map(([label, count]) => (
              <div key={label} className="rounded-xl bg-black/20 p-3">{label}: <b>{count}</b></div>
            ))}
          </div>

          <div className="mt-6 grid gap-2">
            <button onClick={undoLast} className="rounded-xl bg-yellow-400 p-3 font-black text-black">Undo Last</button>
            <button onClick={() => { setRooms([]); setLines([]); setDevices([]); setWireRuns([]); }} className="rounded-xl bg-red-700 p-3 font-black text-white">Reset Drawing</button>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function escapeSvg(value: string) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}
