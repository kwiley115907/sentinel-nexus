"use client";

import AppShell from "@/components/AppShell";
import { CadCommand } from "@/components/cad/CadRibbon";
import CadToolbar from "@/components/cad/CadToolbar";
import CadObjectRail from "@/components/cad/CadObjectRail";
import SentinelAiPanel from "@/components/ai/SentinelAiPanel";
import Cad3DUpgradePanel, { UpgradeAction } from "@/components/cad/Cad3DUpgradePanel";
import DeviceDragPalette from "@/components/cad/DeviceDragPalette";
import ObjectTree from "@/components/cad/ObjectTree";
import { exportCanvasPdf, parseImportedPlan } from "@/lib/cadImportExport";
import { supabase } from "@/lib/supabase";
import { OrbitControls, Text } from "@react-three/drei";
import { Canvas, ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import CadDimensionLine from "@/components/cad/CadDimensionLine";
import RoomRenderer from "@/components/cad/renderers/RoomRenderer";
import ExteriorWallRenderer, { getExteriorFootprintFromRooms } from "@/components/cad/renderers/ExteriorWallRenderer";
import InteriorWallRenderer, {
  generateInteriorWallsFromRooms,
  classifyWalls,
  dedupeSharedWalls,
  type ExteriorMaterial,
  type InteriorFinish,
  type WallSide,
} from "@/components/cad/renderers/InteriorWallRenderer";
import BuildingMaterialsPanel from "@/components/cad/BuildingMaterialsPanel";
import DoorRenderer from "@/components/cad/renderers/DoorRenderer";
import WindowRenderer from "@/components/cad/renderers/WindowRenderer";
import StairRenderer from "@/components/cad/renderers/StairRenderer";
import DeviceRenderer from "@/components/cad/renderers/DeviceRenderer";
import DimensionRenderer, { generateRoomDimensions } from "@/components/cad/renderers/DimensionRenderer";
import { convertAiBlueprintToCad } from "@/components/cad/importers/AiImporter";
import CadScene from "@/components/cad/renderers/CadScene";
import CadLegend from "@/components/cad/renderers/CadLegend";

import {
  feetToInches,
  formatFeet,
  formatFeetInches,
  parseFeetInches,
} from "@/lib/measurements";

type Layer = "ARCHITECTURE" | "FIRE_ALARM" | "CCTV" | "SECURITY" | "ACCESS";
type Vec2 = { x: number; z: number };
type Wall = {
  id: string;
  start: Vec2;
  end: Vec2;
  height: number;
  thickness?: number;
  label?: string;
  floor?: number;
  storyHeight?: number;
  layer: Layer;
};
type BuildingShape = "RECTANGLE" | "L_SHAPE" | "U_SHAPE" | "T_SHAPE" | "Y_SHAPE" | "DOUBLE_STACK" | "TRIPLE_STACK" | "TOWER";

type Room = {
  id: string;
  label: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  stories: number;
  shape: BuildingShape;
  layer: Layer;
  floor?: number;
  kind?: "SHELL" | "ROOM";
};
type Door = {
  id: string; x: number; z: number; layer: Layer; width?: number; height?: number; label?: string; floor?: number;
  side?: "NORTH" | "SOUTH" | "EAST" | "WEST"; rotation?: number; flip?: boolean; double?: boolean;
};
type WindowItem = {
  id: string; x: number; z: number; layer: Layer; width?: number; height?: number; label?: string; floor?: number;
  side?: "NORTH" | "SOUTH" | "EAST" | "WEST"; y?: number; rotation?: number;
};
type Device = { id: string; label: string; x: number; z: number; layer: Layer; floor?: number; y?: number };
type Wire = { id: string; fromId: string; toId: string; layer: Layer };
type FenceType = "CHAIN_LINK" | "PICKET" | "WOOD" | "WROUGHT_IRON";
type FenceItem = {
  id: string; x: number; z: number; layer: Layer; length?: number; height?: number; rotation?: number;
  type?: FenceType; isGate?: boolean; floor?: number; label?: string;
};
type PlantType = "TREE" | "SHRUB" | "FLOWER" | "GRASS";
type PlantItem = { id: string; x: number; z: number; layer: Layer; type?: PlantType; scale?: number; floor?: number; label?: string };

type BuildingBlock = {
  x: number;
  z: number;
  width: number;
  depth: number;
  rotation?: number;
};

type Saved3DModel = {
  id: string;
  name: string;
  model_data: {
    rooms?: Room[];
    walls?: Wall[];
    doors?: Door[];
    windows?: WindowItem[];
    devices?: Device[];
    wires?: Wire[];
    fences?: FenceItem[];
    plants?: PlantItem[];
    exteriorMaterials?: Record<WallSide, ExteriorMaterial>;
    interiorFinish?: InteriorFinish;
  };
};

const DEFAULT_EXTERIOR_MATERIALS: Record<WallSide, ExteriorMaterial> = {
  NORTH: "STUCCO",
  SOUTH: "STUCCO",
  EAST: "STUCCO",
  WEST: "STUCCO",
};

const layers: Record<Layer, string> = {
  ARCHITECTURE: "Architecture",
  FIRE_ALARM: "Fire Alarm",
  CCTV: "CCTV",
  SECURITY: "Security",
  ACCESS: "Access Control",
};

const devicePalette = [
  { label: "SD", name: "Smoke Detector", layer: "FIRE_ALARM" as Layer },
  { label: "HD", name: "Heat Detector", layer: "FIRE_ALARM" as Layer },
  { label: "PS", name: "Pull Station", layer: "FIRE_ALARM" as Layer },
  { label: "HS", name: "Horn Strobe", layer: "FIRE_ALARM" as Layer },
  { label: "CAM", name: "Camera", layer: "CCTV" as Layer },
  { label: "DC", name: "Door Contact", layer: "SECURITY" as Layer },
  { label: "CR", name: "Card Reader", layer: "ACCESS" as Layer },
  { label: "REX", name: "Request To Exit", layer: "ACCESS" as Layer },
];

function makeId() {
  return crypto.randomUUID?.() || Math.random().toString(36).slice(2);
}

function snap(value: number) {
  return Math.round(value * 2) / 2;
}

function pointFromEvent(event: ThreeEvent<PointerEvent>): Vec2 {
  return { x: snap(event.point.x), z: snap(event.point.z) };
}

// Doors/windows were previously dropped at the raw click point with no
// rotation and no relation to any specific wall - meaning most ended up
// embedded somewhere inside a solid wall's thickness (or floating well
// away from any wall entirely) rather than sitting flush on a wall face.
// Since walls are opaque, an embedded door/window was only visible when
// its containing wall happened to be selected (and briefly more
// transparent). Finds the nearest wall segment to a click point and
// returns where a door/window should actually sit: the closest point on
// that wall's centerline, which side of the wall the click was nearer
// to (so it mounts on whichever face the user clicked), and the wall's
// own angle so the object's rotation lines up with it.
function nearestWallPlacement(
  point: Vec2,
  wallList: Array<{ start: Vec2; end: Vec2; thickness?: number }>,
): { x: number; z: number; rotation: number; dist: number; nx: number; nz: number; thickness: number } | null {
  let best: { x: number; z: number; rotation: number; dist: number; nx: number; nz: number; thickness: number } | null = null;

  for (const wall of wallList) {
    const dx = wall.end.x - wall.start.x;
    const dz = wall.end.z - wall.start.z;
    const lenSq = dx * dx + dz * dz;
    if (lenSq < 1e-6) continue;

    let t = ((point.x - wall.start.x) * dx + (point.z - wall.start.z) * dz) / lenSq;
    t = Math.max(0.05, Math.min(0.95, t));
    const px = wall.start.x + dx * t;
    const pz = wall.start.z + dz * t;
    const dist = Math.hypot(point.x - px, point.z - pz);

    if (!best || dist < best.dist) {
      const len = Math.sqrt(lenSq);
      const nx = -dz / len;
      const nz = dx / len;
      const side = (point.x - px) * nx + (point.z - pz) * nz >= 0 ? 1 : -1;
      const angle = Math.atan2(dz, dx);
      best = { x: px, z: pz, rotation: -angle, dist, nx: nx * side, nz: nz * side, thickness: wall.thickness ?? 0.15 };
    }
  }

  return best;
}

function snapToWallFace(point: Vec2, wallList: Array<{ start: Vec2; end: Vec2; thickness?: number }>, objectThickness: number) {
  const hit = nearestWallPlacement(point, wallList);
  const SNAP_RADIUS = 3;

  if (!hit || hit.dist > SNAP_RADIUS) {
    return { x: point.x, z: point.z, rotation: 0 };
  }

  const offset = hit.thickness / 2 + objectThickness / 2 + 0.03;
  return {
    x: hit.x + hit.nx * offset,
    z: hit.z + hit.nz * offset,
    rotation: hit.rotation,
  };
}


export default function Blueprint3DPage() {
  const controlsRef = useRef<any>(null);
  const exteriorControlsRef = useRef<any>(null);
  const [command, setCommand] = useState<CadCommand>("SELECT");
  const [activeLayer, setActiveLayer] = useState<Layer>("ARCHITECTURE");
  const [selectedId, setSelectedId] = useState("");
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);
  const [selectedDimension, setSelectedDimension] = useState<"width" | "depth" | "height" | null>(null);
  const [showRoof, setShowRoof] = useState(true);
  const [roomPanelOpen, setRoomPanelOpen] = useState(false);
  const [dimensionInput, setDimensionInput] = useState("");
  const [selectedResizeSide, setSelectedResizeSide] = useState<"east" | "west" | "north" | "south" | null>(null);
  const [resizeDrag, setResizeDrag] = useState<{
    roomId: string;
    side: "east" | "west" | "north" | "south";
  } | null>(null);
  const [status, setStatus] = useState("Command: SELECT");
  const [wallStart, setWallStart] = useState<Vec2 | null>(null);
  const [wireStartId, setWireStartId] = useState("");
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [gizmoMode, setGizmoMode] = useState<"MOVE" | "ROTATE" | "RESIZE">("MOVE");
  const [measureMode, setMeasureMode] = useState(false);
  const [walkMode, setWalkMode] = useState(false);
  const [pendingDeviceLabel, setPendingDeviceLabel] = useState("");
  const [measureStart, setMeasureStart] = useState<Vec2 | null>(null);
  const [measureEnd, setMeasureEnd] = useState<Vec2 | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [draggingId, setDraggingId] = useState("");
  const [savedModels, setSavedModels] = useState<Saved3DModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("");
  const [modelName, setModelName] = useState("Sentinel Nexus 3D Model");
  const [exteriorMaterials, setExteriorMaterials] = useState<Record<WallSide, ExteriorMaterial>>(
    DEFAULT_EXTERIOR_MATERIALS
  );
  const [interiorFinish, setInteriorFinish] = useState<InteriorFinish>("SHEETROCK");

  const [visibleLayers, setVisibleLayers] = useState<Record<Layer, boolean>>({
    ARCHITECTURE: true,
    FIRE_ALARM: true,
    CCTV: true,
    SECURITY: true,
    ACCESS: true,
  });

  const [rooms, setRooms] = useState<Room[]>([
    { id: "office", label: "Office", x: 0, z: 0, width: 8, depth: 5, height: 2.8, stories: 1, shape: "RECTANGLE", layer: "ARCHITECTURE" },
  ]);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [doors, setDoors] = useState<Door[]>([]);
  const [windows, setWindows] = useState<WindowItem[]>([]);
  const [stairs, setStairs] = useState<any[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [wires, setWires] = useState<Wire[]>([]);
  const [fences, setFences] = useState<FenceItem[]>([]);
  const [plants, setPlants] = useState<PlantItem[]>([]);
  const [splitView, setSplitView] = useState(false);


  useEffect(() => {
    function handleCadKeyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        deselectAll();
        setCommand("SELECT");
        setPendingDeviceLabel("");
        setWallStart(null);
      }

      if (event.key === "Delete" || event.key === "Backspace") {
        if (!selectedId) return;

        setRooms((items) => items.filter((item) => item.id !== selectedId));
        setWalls((items) => items.filter((item) => item.id !== selectedId));
        setDoors((items) => items.filter((item) => item.id !== selectedId));
        setWindows((items) => items.filter((item) => item.id !== selectedId));
        setStairs((items) => items.filter((item) => item.id !== selectedId));
        setDevices((items) => items.filter((item) => item.id !== selectedId));
        setFences((items) => items.filter((item) => item.id !== selectedId));
        setPlants((items) => items.filter((item) => item.id !== selectedId));
        setWires((items) =>
          items.filter((item) => item.fromId !== selectedId && item.toId !== selectedId),
        );

        deselectAll();
        setStatus("Selected CAD object deleted.");
      }
    }

    window.addEventListener("keydown", handleCadKeyboard);
    return () => window.removeEventListener("keydown", handleCadKeyboard);
  }, [selectedId]);

  const selectedRoom = rooms.find((room) => room.id === selectedId);
  const selectedWall = walls.find((wall) => wall.id === selectedId);
  const selectedDevice = devices.find((device) => device.id === selectedId);
  const selectedDoor = doors.find((door) => door.id === selectedId);
  const selectedWindow = windows.find((windowItem) => windowItem.id === selectedId);
  const selectedFence = fences.find((fence) => fence.id === selectedId);
  const selectedPlant = plants.find((plant) => plant.id === selectedId);

  const measurementFeet =
    measureStart && measureEnd
      ? Math.sqrt(
          (measureEnd.x - measureStart.x) ** 2 +
            (measureEnd.z - measureStart.z) ** 2,
        )
      : 0;

  const materialCount = useMemo(() => {
    return devices.reduce<Record<string, number>>((count, device) => {
      count[device.label] = (count[device.label] || 0) + 1;
      return count;
    }, {});
  }, [devices]);

  // Every room automatically gets 4 walls around its perimeter (no more
  // rooms rendering as bare floor slabs), classified as exterior (using
  // the chosen siding for that side) or interior (using the chosen
  // finish) based on whether open air actually exists on that wall's
  // outward side - not just whether it touches the overall bounding
  // rectangle, which breaks for L-shaped/multi-wing buildings. Manually
  // drawn walls get the same treatment layered on top.
  const renderWalls = useMemo(() => {
    const realRooms = rooms.filter((room) => room.kind !== "SHELL");

    const autoWalls = dedupeSharedWalls(
      generateInteriorWallsFromRooms(realRooms).map((wall) => ({
        ...wall,
        layer: "ARCHITECTURE" as Layer,
      }))
    );

    return [
      ...classifyWalls(autoWalls, realRooms, exteriorMaterials, interiorFinish),
      ...classifyWalls(walls, realRooms, exteriorMaterials, interiorFinish),
    ];
  }, [rooms, walls, exteriorMaterials, interiorFinish]);

  async function loadSavedModels() {
    // No company_id filter needed - blueprint_3d_models is scoped by
    // user_id via RLS (blueprint_3d_models_owner_access: auth.uid() =
    // user_id), so this already only ever returns the caller's own rows.
    const { data, error } = await supabase
      .from("blueprint_3d_models")
      .select("id,name,model_data")
      .order("created_at", { ascending: false });

    if (error) {
      setStatus(error.message);
      return;
    }

    setSavedModels(data || []);
    if (!selectedModelId && data?.[0]) {
      setSelectedModelId(data[0].id);
    }
  }

  async function save3DModel() {
    const { error } = await supabase.from("blueprint_3d_models").insert({
      name: modelName || "Sentinel Nexus 3D Model",
      model_data: {
        rooms,
        walls,
        doors,
        windows,
        devices,
        wires,
        fences,
        plants,
        exteriorMaterials,
        interiorFinish,
      },
    });

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("3D model saved.");
    await loadSavedModels();
  }

  async function loadSelected3DModel() {
    const model = savedModels.find((item) => item.id === selectedModelId);

    if (!model) {
      setStatus("Select a saved 3D model first.");
      return;
    }

    setRooms(model.model_data?.rooms || []);
    setWalls(model.model_data?.walls || []);
    setDoors(model.model_data?.doors || []);
    setWindows(model.model_data?.windows || []);
    setDevices(model.model_data?.devices || []);
    setWires(model.model_data?.wires || []);
    setFences(model.model_data?.fences || []);
    setPlants(model.model_data?.plants || []);
    setExteriorMaterials(model.model_data?.exteriorMaterials || DEFAULT_EXTERIOR_MATERIALS);
    setInteriorFinish(model.model_data?.interiorFinish || "SHEETROCK");
    setModelName(model.name);
    setStatus(`Loaded ${model.name}`);
  }

  async function renameSelected3DModel() {
    if (!selectedModelId) {
      setStatus("Select a saved 3D model first.");
      return;
    }

    const { error } = await supabase
      .from("blueprint_3d_models")
      .update({ name: modelName || "Untitled 3D Model" })
      .eq("id", selectedModelId);

    if (error) {
      setStatus(error.message);
      return;
    }

    setStatus("3D model renamed.");
    await loadSavedModels();
  }

  async function deleteSelected3DModel() {
    if (!selectedModelId) {
      setStatus("Select a saved 3D model first.");
      return;
    }

    const confirmed = confirm("Delete this saved 3D model?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("blueprint_3d_models")
      .delete()
      .eq("id", selectedModelId);

    if (error) {
      setStatus(error.message);
      return;
    }

    setSelectedModelId("");
    setStatus("3D model deleted.");
    await loadSavedModels();
  }

  useEffect(() => {
    loadSavedModels();
  }, []);

  function deselectAll() {
    setSelectedId("");
    setSelectedBlockIndex(null);
    setDraggingId("");
    setWireStartId("");
    setStatus("Deselected.");
  }

  function setCamera(position: [number, number, number]) {
    const controls = controlsRef.current;
    if (!controls) return;
    controls.object.position.set(...position);
    controls.target.set(0, 0, 0);
    controls.update();
  }

  async function generateBuildingWithAi() {
    const prompt = aiPrompt.trim();

    if (prompt.length < 5) {
      setStatus("Type a building prompt first.");
      alert("Type a building prompt first.");
      return;
    }

    try {
      setStatus("AI is generating building...");

      const response = await fetch("/api/ai/building-generator", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus(data.error || "AI building generation failed.");
        alert(data.error || "AI building generation failed.");
        return;
      }

      setRooms(data.rooms || []);
      setSelectedId("");
      setSelectedBlockIndex(null);
      setStatus(`AI generated ${data.rooms?.length || 0} building section(s).`);
    } catch (error) {
      setStatus("AI request failed. Check API key or server logs.");
      alert("AI request failed. Check API key or server logs.");
    }
  }

  async function handleImportFile(file: File) {
    try {
      const result = await parseImportedPlan(file);
      console.log(result);
      setStatus(`Imported ${file.name}`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Import failed.");
    }
  }

  async function handleUpgradeAction(action: UpgradeAction) {
    if (action === "MOVE_GIZMO") {
      setGizmoMode("MOVE");
      setStatus("Move gizmo active.");
    }

    if (action === "ROTATE_GIZMO") {
      setGizmoMode("ROTATE");
      setStatus("Rotate gizmo active.");
    }

    if (action === "RESIZE_GIZMO") {
      setGizmoMode("RESIZE");
      setStatus("Resize gizmo active.");
    }

    if (action === "SNAP_TOGGLE") {
      setSnapEnabled((current) => !current);
      setStatus("Snap toggled.");
    }

    if (action === "FLOOR_UP") {
      setCurrentFloor((floor) => floor + 1);
      setStatus("Floor changed.");
    }

    if (action === "FLOOR_DOWN") {
      setCurrentFloor((floor) => Math.max(1, floor - 1));
      setStatus("Floor changed.");
    }

    if (action === "MEASURE") {
      setMeasureMode((current) => !current);
      setMeasureStart(null);
      setMeasureEnd(null);
      setStatus("Measurement mode toggled.");
    }

    if (action === "FIRST_PERSON") {
      setWalkMode((current) => !current);
      setStatus("Walkthrough mode toggled.");
    }

    if (action === "IMPORT_PLAN") {
      document.getElementById("plan-import-input")?.click();
    }
  }

  function handleCommand(nextCommand: CadCommand) {
    setCommand(nextCommand);
    setStatus(`Command: ${nextCommand}`);
    setWallStart(null);
    setWireStartId("");

    if (nextCommand === "TOP_VIEW") setCamera([0, 16, 0.01]);
    if (nextCommand === "FRONT_VIEW") setCamera([0, 5, 14]);
    if (nextCommand === "SIDE_VIEW") setCamera([14, 5, 0]);
    if (nextCommand === "RESET_VIEW") setCamera([9, 8, 9]);

    if (nextCommand === "DELETE") {
      setRooms([]);
      setWalls([]);
      setDoors([]);
      setWindows([]);
      setDevices([]);
      setWires([]);
      setFences([]);
      setPlants([]);
      setSelectedId("");
      setStatus("Command: drawing cleared");
    }
  }

  // Placement tools (door, window, stair, devices, walls, rooms, measure) need
  // clicks on the Floor plane itself, but RoomRenderer's own select/drag
  // handlers stopPropagation() before the ray ever reaches Floor. Gate those
  // handlers off whenever a placement tool is active so clicks fall through.
  // Kept in sync with the commands handleCanvasClick actually places on.
  const PLACEMENT_COMMANDS = new Set<CadCommand>([
    "LINE", "POLYLINE", "RECTANGLE", "ROOM_LABEL", "BLOCKS", "TEXT", "STAIRS",
    "FENCE", "GATE", "TREE", "SHRUB", "FLOWER", "GRASS",
    "SMOKE", "HEAT", "PULL", "HORN_STROBE", "CAMERA", "CARD_READER", "REX", "DOOR_CONTACT",
  ]);
  // Single-click placement tools (room, door, window, stair, fence/gate,
  // landscaping, devices) used to stay active forever once picked - every
  // further click anywhere on the canvas stamped down another copy, with
  // no way to get back to Select mode short of picking a *different* tool
  // (which just started stamping that one instead). Each of their branches
  // below now calls setCommand("SELECT") right after placing its one
  // object, snapping back to Select automatically - matching how every
  // other CAD tool behaves: click once, get one object, and you're back to
  // picking/moving things until you deliberately choose a placement tool
  // again. Wall drawing (LINE/POLYLINE) is the one exception left
  // continuous, since a wall chain naturally spans several clicks.
  const placementActive =
    measureMode || Boolean(pendingDeviceLabel) || PLACEMENT_COMMANDS.has(command);

  function handleCanvasClick(event: ThreeEvent<PointerEvent>) {
    event.stopPropagation();
    setSelectedId("");
    setSelectedBlockIndex(null);
    const point = pointFromEvent(event);

    if (measureMode) {
      if (!measureStart) {
        setMeasureStart(point);
        setMeasureEnd(null);
        setStatus("Measurement start picked. Pick end point.");
        return;
      }

      setMeasureEnd(point);
      setStatus(`Measurement: ${formatFeetInches(Math.sqrt((point.x - measureStart.x) ** 2 + (point.z - measureStart.z) ** 2))}`);
      return;
    }

    if (pendingDeviceLabel) {
      setDevices((current) => [
        ...current,
        {
          id: makeId(),
          label: pendingDeviceLabel,
          x: point.x,
          z: point.z,
          floor: currentFloor,
          layer: pendingDeviceLabel === "CAM" ? "CCTV" : pendingDeviceLabel === "CR" || pendingDeviceLabel === "REX" ? "ACCESS" : pendingDeviceLabel === "DC" ? "SECURITY" : "FIRE_ALARM",
        },
      ]);
      setStatus(`${pendingDeviceLabel} placed on floor ${currentFloor}.`);
      setPendingDeviceLabel("");
      return;
    }

    if (command === "LINE" || command === "POLYLINE") {
      if (!wallStart) {
        setWallStart(point);
        setStatus("Wall start picked. Pick end point.");
        return;
      }

      setWalls((current) => [...current, { id: makeId(), start: wallStart, end: point, height: 2.8, floor: currentFloor, layer: "ARCHITECTURE" }]);
      setWallStart(null);
      setStatus("Wall created.");
      return;
    }

    if (command === "RECTANGLE" || command === "ROOM_LABEL") {
      setRooms((current) => [
        ...current,
        { id: makeId(), label: `Building ${current.length + 1}`, x: point.x, z: point.z, width: 5, depth: 4, height: 2.8, stories: 1, shape: "RECTANGLE", layer: "ARCHITECTURE" },
      ]);
      setStatus("Room created.");
      setCommand("SELECT");
      return;
    }

    if (command === "BLOCKS") {
      const snapped = snapToWallFace(point, renderWalls, 0.15);
      setDoors((current) => [
        ...current,
        { id: makeId(), x: snapped.x, z: snapped.z, rotation: snapped.rotation, floor: currentFloor, layer: "ARCHITECTURE" },
      ]);
      setStatus(`Door placed on floor ${currentFloor}.`);
      setCommand("SELECT");
      return;
    }

    if (command === "TEXT") {
      const snapped = snapToWallFace(point, renderWalls, 0.12);
      setWindows((current) => [
        ...current,
        { id: makeId(), x: snapped.x, z: snapped.z, rotation: snapped.rotation, floor: currentFloor, layer: "ARCHITECTURE" },
      ]);
      setStatus(`Window placed on floor ${currentFloor}.`);
      setCommand("SELECT");
      return;
    }

    if (command === "STAIRS") {
      setStairs((current) => [...current, { id: makeId(), x: point.x, z: point.z, floor: currentFloor, layer: "ARCHITECTURE" }]);
      setStatus(
        rooms.some((room) => room.stories > 1)
          ? `Stair placed on floor ${currentFloor}.`
          : `Stair placed on floor ${currentFloor}. It won't be visible until the building has more than one story.`
      );
      setCommand("SELECT");
      return;
    }

    if (command === "FENCE" || command === "GATE") {
      setFences((current) => [
        ...current,
        { id: makeId(), x: point.x, z: point.z, floor: 1, layer: "ARCHITECTURE", type: "CHAIN_LINK", isGate: command === "GATE", length: 4, rotation: 0 },
      ]);
      setStatus(`${command === "GATE" ? "Gate" : "Fence"} placed. Pick it to change its type or make it a gate.`);
      setCommand("SELECT");
      return;
    }

    if (command === "TREE" || command === "SHRUB" || command === "FLOWER" || command === "GRASS") {
      setPlants((current) => [...current, { id: makeId(), x: point.x, z: point.z, floor: 1, layer: "ARCHITECTURE", type: command, scale: 1 }]);
      setStatus(`${command.charAt(0)}${command.slice(1).toLowerCase()} placed.`);
      setCommand("SELECT");
      return;
    }

    const deviceMap: Partial<Record<CadCommand, { label: string; layer: Layer }>> = {
      SMOKE: { label: "SD", layer: "FIRE_ALARM" },
      HEAT: { label: "HD", layer: "FIRE_ALARM" },
      PULL: { label: "PS", layer: "FIRE_ALARM" },
      HORN_STROBE: { label: "HS", layer: "FIRE_ALARM" },
      CAMERA: { label: "CAM", layer: "CCTV" },
      CARD_READER: { label: "CR", layer: "ACCESS" },
      REX: { label: "REX", layer: "ACCESS" },
      DOOR_CONTACT: { label: "DC", layer: "SECURITY" },
    };

    const selectedDeviceTool = deviceMap[command];
    if (selectedDeviceTool) {
      setDevices((current) => [...current, { id: makeId(), label: selectedDeviceTool.label, x: point.x, z: point.z, floor: currentFloor, layer: selectedDeviceTool.layer }]);
      setStatus(`${selectedDeviceTool.label} placed on floor ${currentFloor}.`);
      setCommand("SELECT");
    }
  }

  function moveRoom(id: string, point: Vec2) {
    setRooms((current) => current.map((room) => (room.id === id ? { ...room, x: point.x, z: point.z } : room)));
  }

  function moveDoor(id: string, point: Vec2) {
    setDoors((current) =>
      current.map((door) =>
        door.id === id
          ? { ...door, x: point.x, z: point.z }
          : door,
      ),
    );
  }

  function moveWindow(id: string, point: Vec2) {
    setWindows((current) =>
      current.map((windowItem) =>
        windowItem.id === id
          ? { ...windowItem, x: point.x, z: point.z }
          : windowItem,
      ),
    );
  }

  function moveStair(id: string, point: Vec2) {
    setStairs((current) =>
      current.map((stair) =>
        stair.id === id
          ? { ...stair, x: point.x, z: point.z }
          : stair,
      ),
    );
  }



  function moveFence(id: string, point: Vec2) {
    setFences((current) =>
      current.map((fence) => (fence.id === id ? { ...fence, x: point.x, z: point.z } : fence)),
    );
  }

  function movePlant(id: string, point: Vec2) {
    setPlants((current) =>
      current.map((plant) => (plant.id === id ? { ...plant, x: point.x, z: point.z } : plant)),
    );
  }

  function moveDevice(id: string, point: Vec2) {
    setDevices((current) => current.map((device) => (device.id === id ? { ...device, x: point.x, z: point.z } : device)));
  }

  function handleDeviceSelect(device: Device) {
    setSelectedId(device.id);

    if (command !== "WIRE") return;

    if (!wireStartId) {
      setWireStartId(device.id);
      setStatus(`Wire start: ${device.label}. Pick a second device to connect.`);
      return;
    }

    if (wireStartId === device.id) {
      setWireStartId("");
      return;
    }

    setWires((current) => [...current, { id: makeId(), fromId: wireStartId, toId: device.id, layer: "FIRE_ALARM" }]);
    setWireStartId("");
    setStatus("Wire created.");
  }

  function addBuildingShape(shape: BuildingShape, stories = 1) {
    setRooms((current) => [
      ...current,
      {
        id: makeId(),
        label: `${shape === "RECTANGLE"
  ? "Warehouse"
  : shape === "L_SHAPE"
  ? "School"
  : shape === "U_SHAPE"
  ? "Apartment"
  : shape === "T_SHAPE"
  ? "Shopping Center"
  : shape === "Y_SHAPE"
  ? "Hospital"
  : shape === "DOUBLE_STACK"
  ? "Office Building"
  : shape === "TRIPLE_STACK"
  ? "Campus"
  : "High Rise"} ${current.length + 1}`,
        x: current.length * 2,
        z: current.length,
        width: 6,
        depth: 5,
        height: 2.8,
        stories,
        shape,
        layer: "ARCHITECTURE",
      },
    ]);

    setStatus(`Added ${shape} building with ${stories} stories.`);
  }

  function syncTo2D() {
    localStorage.setItem(
      "sentinel-nexus-cad-sync",
      JSON.stringify({ rooms, walls, doors, windows, devices, wires, fences, plants }),
    );
    setStatus("Synced 3D model to 2D local project data.");
  }

  function loadFrom2D() {
    const saved = localStorage.getItem("sentinel-nexus-cad-sync");
    if (!saved) {
      setStatus("No synced 2D/3D data found.");
      return;
    }

    const data = JSON.parse(saved);
    setRooms(data.rooms || []);
    setWalls(data.walls || []);
    setDoors(data.doors || []);
    setWindows(data.windows || []);
    setDevices(data.devices || []);
    setWires(data.wires || []);
    setFences(data.fences || []);
    setPlants(data.plants || []);
    setStatus("Loaded synced 2D/3D data.");
  }

  const cadSceneProps = {
    rooms,
    walls: renderWalls,
    doors,
    windows,
    stairs,
    devices,
    fences,
    plants,
    visibleLayers,
    selectedId,
    selectedBlockIndex,
    draggingId,
    wireStartId,
    setSelectedId,
    setSelectedBlockIndex,
    setSelectedDimension,
    setDraggingId,
    handleDeviceSelect,
    Floor,
    handleCanvasClick,
    moveRoom,
    moveDoor,
    moveWindow,
    moveStair,
    moveFence,
    movePlant,
    moveDevice,
    measureStart,
    measureEnd,
    MeasurementLine,
    wires,
    WireModel,
    showRoof,
    placementActive,
  };

  return (
    <AppShell>
      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <main className="space-y-4">
          <div className="rounded-2xl border border-yellow-400/30 bg-black/20 p-3">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-3xl font-black text-yellow-300">Sentinel Nexus CAD</h1>
              <div className="flex flex-wrap gap-2">
                <button onClick={deselectAll} className="rounded-xl bg-white/20 px-4 py-3 font-black text-white">Deselect</button>
                <button onClick={syncTo2D} className="rounded-xl bg-green-600 px-4 py-3 font-black text-white">Sync To 2D</button>
                <button onClick={loadFrom2D} className="rounded-xl bg-blue-700 px-4 py-3 font-black text-white">Load Sync</button>
                <a href="/blueprint-builder" className="rounded-xl bg-yellow-400 px-4 py-3 font-black text-black">Back To 2D</a>
              </div>
            </div>

            <CadToolbar
              command={command}
              onCommand={handleCommand}
              gizmoMode={gizmoMode}
              measureMode={measureMode}
              walkMode={walkMode}
              currentFloor={currentFloor}
              onUpgradeAction={handleUpgradeAction}
              visibleLayers={visibleLayers}
              onToggleLayer={(layer) =>
                setVisibleLayers((current) => ({ ...current, [layer as Layer]: !current[layer as Layer] }))
              }
              onSave={save3DModel}
              onExport={() => exportCanvasPdf("cad-3d-export-area", "sentinel-nexus-3d.pdf")}
            />

            <div className="mt-4 grid gap-3 rounded-2xl border border-yellow-400/30 bg-black/30 p-4 md:grid-cols-6">
              <input
                value={modelName}
                onChange={(event) => setModelName(event.target.value)}
                placeholder="3D model name"
                className="rounded-xl bg-black/40 p-3 text-yellow-100 md:col-span-2"
              />

              <select
                value={selectedModelId}
                onChange={(event) => setSelectedModelId(event.target.value)}
                className="rounded-xl bg-black/40 p-3 text-yellow-100 md:col-span-2"
              >
                <option value="">Saved 3D Models</option>
                {savedModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>

              <button onClick={save3DModel} className="rounded-xl bg-green-600 p-3 font-black text-white">
                Save
              </button>

              <button onClick={loadSelected3DModel} className="rounded-xl bg-blue-700 p-3 font-black text-white">
                Load
              </button>

              <button onClick={renameSelected3DModel} className="rounded-md bg-yellow-400 px-1 py-1 text-[10px] font-bold text-black">
                Rename
              </button>

              <button onClick={deleteSelected3DModel} className="rounded-xl bg-red-700 p-3 font-black text-white">
                Delete
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-black/80 p-3 font-mono text-yellow-300">{status}</div>

          <div className="relative h-[760px] overflow-hidden rounded-[2rem] border border-yellow-400/30 bg-black">
            <CadLegend />
            <CadObjectRail
              onCommand={handleCommand}
              onStatus={setStatus}
              showRoof={showRoof}
              onToggleRoof={() => setShowRoof((v) => !v)}
              splitView={splitView}
              onToggleSplitView={() => setSplitView((v) => !v)}
            />
            {splitView ? (
              <div className="flex h-full w-full">
                <div className="relative h-full w-1/2 border-r border-yellow-400/20">
                  <div className="absolute left-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1 text-xs font-black text-yellow-300">
                    Interior
                  </div>
                  <Canvas camera={{ position: [9, 8, 9], fov: 50 }} onPointerMissed={() => deselectAll()}>
                    <CadScene {...cadSceneProps} controlsRef={controlsRef} viewMode="INTERIOR" />
                  </Canvas>
                </div>
                <div className="relative h-full w-1/2">
                  <div className="absolute left-3 top-3 z-10 rounded-full bg-black/70 px-3 py-1 text-xs font-black text-yellow-300">
                    Exterior
                  </div>
                  <Canvas camera={{ position: [9, 8, 9], fov: 50 }} onPointerMissed={() => deselectAll()}>
                    <CadScene {...cadSceneProps} controlsRef={exteriorControlsRef} viewMode="EXTERIOR" />
                  </Canvas>
                </div>
              </div>
            ) : (
              <Canvas
                camera={{ position: [9, 8, 9], fov: 50 }}
                onPointerMissed={() => {
                  deselectAll();
                }}
              >
                <CadScene {...cadSceneProps} controlsRef={controlsRef} viewMode="FULL" />
              </Canvas>
            )}

            {selectedRoom && !roomPanelOpen && (
              <button
                type="button"
                onClick={() => setRoomPanelOpen(true)}
                className="absolute bottom-3 left-3 rounded-full border border-yellow-400/40 bg-black/85 px-4 py-2 text-xs font-black text-yellow-200 backdrop-blur-md"
              >
                Edit {selectedRoom.label}
              </button>
            )}

            {selectedRoom && roomPanelOpen && (
              <div className="absolute bottom-3 left-3 right-3 rounded-2xl border border-yellow-400/40 bg-black/85 p-4 text-yellow-100 backdrop-blur-md">
                <button
                  type="button"
                  onClick={() => setRoomPanelOpen(false)}
                  className="absolute right-3 top-3 rounded-full bg-white/10 px-3 py-1 text-xs font-black text-yellow-100"
                >
                  Close X
                </button>
                <div className="grid gap-3 md:grid-cols-4">
                  <input
                    value={selectedRoom.label}
                    onChange={(event) =>
                      setRooms((items) =>
                        items.map((room) =>
                          room.id === selectedRoom.id
                            ? { ...room, label: event.target.value }
                            : room,
                        ),
                      )
                    }
                    className="rounded-xl bg-white/10 p-3 font-black"
                  />


                  {selectedDimension && (
                    <div className="grid gap-2 rounded-xl bg-black/25 p-3">
                      <p className="text-sm font-black text-yellow-300">
                        Edit {selectedDimension.toUpperCase()} by feet/inches
                      </p>

                      <input
                        value={dimensionInput}
                        onChange={(event) => setDimensionInput(event.target.value)}
                        placeholder={`Example: 12, 12'6", or 150in`}
                        className="rounded-xl bg-black/30 p-3 text-yellow-100"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const nextValue = parseFeetInches(dimensionInput);

                          if (!nextValue || nextValue <= 0) {
                            alert("Enter a valid measurement.");
                            return;
                          }

                          setRooms((items) =>
                            items.map((room) =>
                              room.id === selectedRoom.id
                                ? { ...room, [selectedDimension]: nextValue }
                                : room,
                            ),
                          );

                          setStatus(`${selectedDimension} set to ${formatFeetInches(nextValue)}`);
                        }}
                        className="rounded-xl bg-green-700 p-3 font-black text-white"
                      >
                        Apply Measurement
                      </button>
                    </div>
                  )}

                  
                  <div className="grid gap-2 rounded-xl bg-black/30 p-3">
                    <p className="text-sm font-black text-yellow-300">
                      Type Exact Building Size
                    </p>

                    <input
                      placeholder="Width example: 25, 25'6&quot;, 306in"
                      className="rounded-xl bg-black/40 p-3 text-yellow-100"
                      onBlur={(event) => {
                        const value = parseFeetInches(event.target.value);
                        if (!value || value <= 0) return;
                        setRooms((items) =>
                          items.map((room) =>
                            room.id === selectedRoom.id ? { ...room, width: value } : room,
                          ),
                        );
                      }}
                    />

                    <input
                      placeholder="Depth example: 40, 40'3&quot;, 483in"
                      className="rounded-xl bg-black/40 p-3 text-yellow-100"
                      onBlur={(event) => {
                        const value = parseFeetInches(event.target.value);
                        if (!value || value <= 0) return;
                        setRooms((items) =>
                          items.map((room) =>
                            room.id === selectedRoom.id ? { ...room, depth: value } : room,
                          ),
                        );
                      }}
                    />

                    <input
                      placeholder="Height example: 12, 12'0&quot;, 144in"
                      className="rounded-xl bg-black/40 p-3 text-yellow-100"
                      onBlur={(event) => {
                        const value = parseFeetInches(event.target.value);
                        if (!value || value <= 0) return;
                        setRooms((items) =>
                          items.map((room) =>
                            room.id === selectedRoom.id ? { ...room, height: value } : room,
                          ),
                        );
                      }}
                    />
                  </div>

                  <label className="grid gap-1 text-sm font-black">
                    Width: {formatFeet(selectedRoom.width)}
                    <input
                      type="range"
                      min="2"
                      max="20"
                      step="0.5"
                      value={selectedRoom.width}
                      onChange={(event) =>
                        setRooms((items) =>
                          items.map((room) =>
                            room.id === selectedRoom.id
                              ? { ...room, width: Number(event.target.value) }
                              : room,
                          ),
                        )
                      }
                    />
                  </label>

                  <label className="grid gap-1 text-sm font-black">
                    Depth: {formatFeet(selectedRoom.depth)}
                    <input
                      type="range"
                      min="2"
                      max="20"
                      step="0.5"
                      value={selectedRoom.depth}
                      onChange={(event) =>
                        setRooms((items) =>
                          items.map((room) =>
                            room.id === selectedRoom.id
                              ? { ...room, depth: Number(event.target.value) }
                              : room,
                          ),
                        )
                      }
                    />
                  </label>

                  <label className="grid gap-1 text-sm font-black">
                    Height: {formatFeet(selectedRoom.height)}
                    <input
                      type="range"
                      min="1"
                      max="8"
                      step="0.25"
                      value={selectedRoom.height}
                      onChange={(event) =>
                        setRooms((items) =>
                          items.map((room) =>
                            room.id === selectedRoom.id
                              ? { ...room, height: Number(event.target.value) }
                              : room,
                          ),
                        )
                      }
                    />
                  </label>

                  <div className="grid gap-2 rounded-xl bg-black/25 p-3">
                    <p className="text-sm font-black text-yellow-300">
                      Floors: {selectedRoom.stories}
                    </p>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          setRooms((items) =>
                            items.map((room) =>
                              room.id === selectedRoom.id
                                ? { ...room, stories: Math.max(1, room.stories - 1) }
                                : room,
                            ),
                          )
                        }
                        className="rounded-xl bg-red-700 p-3 font-black text-white"
                      >
                        - Floor
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setRooms((items) =>
                            items.map((room) =>
                              room.id === selectedRoom.id
                                ? { ...room, stories: room.stories + 1 }
                                : room,
                            ),
                          )
                        }
                        className="rounded-xl bg-green-700 p-3 font-black text-white"
                      >
                        + Floor
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>

        <aside className="space-y-4 rounded-[2rem] border border-yellow-400/30 bg-black/15 p-5 backdrop-blur-sm">
          <input
            id="plan-import-input"
            type="file"
            accept=".pdf,.png,.jpg,.jpeg,.dxf"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) handleImportFile(file);
            }}
          />

                    <SentinelAiPanel
            title="Sentinel AI 3D Builder"
            blueprint={{
              rooms,
              walls,
              doors,
              windows,
              stairs,
              devices,
              wires,
              currentFloor,
              stories: Math.max(
                1,
                ...rooms.map((room) =>
                  Math.max(
                    Number(room.stories ?? 1),
                    Number(room.floor ?? 1),
                  ),
                ),
              ),
            }}
            onRoomsGenerated={(generatedRooms, aiResponse, prompt) => {
              const cad = convertAiBlueprintToCad({
                ...aiResponse,
                rooms: generatedRooms,
              });

              setRooms(cad.rooms as Room[]);
              setWalls(cad.walls as Wall[]);
              setDoors(cad.doors as Door[]);
              setWindows(cad.windows as WindowItem[]);
              setStairs(cad.stairs);
              setDevices(cad.devices as Device[]);
              setCurrentFloor(1);
              deselectAll();

              setStatus(
                `AI imported ${cad.rooms.length} rooms, ${cad.doors.length} doors, ${cad.windows.length} windows, ${cad.stairs.length} stairs, ${cad.devices.length} devices.`
              );
            }}
            onDevicesGenerated={(generatedDevices) => {
              const convertedDevices = generatedDevices.map((device, index) => {
                let x = Number(device.x ?? 0);
                let z = Number(device.z ?? device.y ?? 0);

                const nearAnyRoom = rooms.some((room) => {
                  const halfW = room.width / 2 + 3;
                  const halfD = room.depth / 2 + 3;
                  return Math.abs(x - room.x) <= halfW && Math.abs(z - room.z) <= halfD;
                });

                if (!nearAnyRoom && rooms.length > 0) {
                  const targetRoom = rooms[index % rooms.length];
                  x = targetRoom.x + (Math.random() - 0.5) * targetRoom.width * 0.5;
                  z = targetRoom.z + (Math.random() - 0.5) * targetRoom.depth * 0.5;
                }

                return {
                  id: device.id || `ai-device-${Date.now()}-${index}`,
                  label: device.label || device.type || "SD",
                  type: device.type || device.label || "SD",
                  x,
                  z,
                  y: Number(device.y3d ?? 3),
                  floor: Number(device.floor ?? currentFloor),
                  layer: device.layer || "FIRE_ALARM",
                };
              });

              setDevices((current) => [...current, ...convertedDevices]);
              setStatus(`AI placed ${convertedDevices.length} device(s).`);
            }}
          />

          <Cad3DUpgradePanel
            currentFloor={currentFloor}
            snapEnabled={snapEnabled}
            onAction={handleUpgradeAction}
          />

          <BuildingMaterialsPanel
            exteriorMaterials={exteriorMaterials}
            onExteriorChange={(side, material) =>
              setExteriorMaterials((current) => ({ ...current, [side]: material }))
            }
            interiorFinish={interiorFinish}
            onInteriorChange={setInteriorFinish}
          />

          <ObjectTree
            selectedId={selectedId}
            onSelect={setSelectedId}
            items={[
              ...rooms.map((room) => ({ id: room.id, label: room.label, type: "Building" })),
              ...devices.map((device) => ({ id: device.id, label: device.label, type: "Device" })),
            ]}
          />

          <DeviceDragPalette
            onPick={(label) => {
              setPendingDeviceLabel(label);
              setStatus(`Click grid to place ${label}.`);
            }}
          />

          <button
            onClick={() => exportCanvasPdf("cad-3d-export-area", "sentinel-nexus-3d.pdf")}
            className="w-full rounded-xl bg-blue-700 p-3 font-black text-white"
          >
            Export PDF
          </button>
<h2 className="text-2xl font-black text-yellow-300">Properties</h2>

          <button
            type="button"
            onClick={() => {
              setSelectedId("");
              setSelectedBlockIndex(null);
              setSelectedDimension(null);
              setDraggingId("");
              setResizeDrag(null);
              setStatus("Selection cleared.");
            }}
            className="mt-3 w-full rounded-xl bg-gray-700 p-3 font-black text-white"
          >
            Deselect Selection
          </button>

          <div className="mt-5">
            <p className="font-black text-yellow-300">Active Layer</p>
            <select value={activeLayer} onChange={(event) => setActiveLayer(event.target.value as Layer)} className="mt-2 w-full rounded-xl bg-black/30 p-3">
              {Object.entries(layers).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>

          <div className="mt-6">
            <p className="font-black text-yellow-300">Layer Manager</p>
            <div className="mt-2 grid gap-2">
              {(Object.keys(layers) as Layer[]).map((layer) => (
                <button
                  key={layer}
                  onClick={() => setVisibleLayers((current) => ({ ...current, [layer]: !current[layer] }))}
                  className="rounded-lg bg-black/25 px-2 py-1.5 text-left text-xs font-bold"
                >
                  {visibleLayers[layer] ? "ON" : "OFF"} — {layers[layer]}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <p className="font-black text-yellow-300">Building Templates</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {[
                { label: "Warehouse", shape: "RECTANGLE", stories: 1 },
                { label: "School", shape: "L_SHAPE", stories: 2 },
                { label: "Apartment", shape: "U_SHAPE", stories: 3 },
                { label: "Shopping Center", shape: "T_SHAPE", stories: 1 },
                { label: "Hospital", shape: "Y_SHAPE", stories: 5 },
                { label: "Office Building", shape: "DOUBLE_STACK", stories: 4 },
                { label: "Campus", shape: "TRIPLE_STACK", stories: 3 },
                { label: "High Rise", shape: "TOWER", stories: 8 },
                { label: "Data Center", shape: "RECTANGLE", stories: 2 },
                { label: "Fire Station", shape: "DOUBLE_STACK", stories: 2 },
                { label: "Police Station", shape: "T_SHAPE", stories: 2 },
                { label: "Hotel", shape: "TOWER", stories: 8 },
                { label: "Airport", shape: "TRIPLE_STACK", stories: 2 },
                { label: "Industrial Plant", shape: "RECTANGLE", stories: 1 },
                { label: "Power Plant", shape: "U_SHAPE", stories: 2 },
                { label: "Stadium", shape: "U_SHAPE", stories: 3 },
                { label: "Convention Center", shape: "TRIPLE_STACK", stories: 2 },
              ].map((template) => (
                <button
                  key={template.label}
                  onClick={() => {
                    setRooms([]);
                    setWalls([]);
                    setSelectedId("");
                    setDraggingId("");
                    setResizeDrag(null);
                    addBuildingShape(template.shape as BuildingShape, template.stories);
                  }}
                  className="rounded-md bg-purple-700 px-1 py-1 text-[9px] font-bold text-white"
                >
                  {template.label}
                </button>
              ))}
            </div>

            <p className="mt-6 font-black text-yellow-300">Device Palette</p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {devicePalette.map((device) => (
                <button
                  key={device.label}
                  onClick={() => {
                    setCommand(device.label === "CAM" ? "CAMERA" : device.label === "CR" ? "CARD_READER" : device.label === "REX" ? "REX" : device.label === "DC" ? "DOOR_CONTACT" : device.label === "SD" ? "SMOKE" : device.label === "HD" ? "HEAT" : device.label === "PS" ? "PULL" : "HORN_STROBE");
                    setStatus(`Command: place ${device.name}`);
                  }}
                  className="rounded-md bg-yellow-400 px-1 py-1 text-[10px] font-bold text-black"
                >
                  {device.label}
                </button>
              ))}
            </div>
          </div>

          {selectedDevice && (
            <div className="mt-6 grid gap-3">
              <p className="font-black text-yellow-300">Selected Device</p>
              <input value={selectedDevice.label} onChange={(event) => setDevices((items) => items.map((device) => device.id === selectedDevice.id ? { ...device, label: event.target.value } : device))} className="rounded-lg bg-black/30 px-2 py-1.5 text-xs" />
            </div>
          )}

          {selectedDoor && (
            <div className="mt-6 grid gap-3">
              <p className="font-black text-yellow-300">Selected Door</p>

              <label className="grid gap-1 text-xs font-black text-yellow-100">
                Width: {formatFeet(selectedDoor.width ?? 3)}
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="0.1"
                  value={selectedDoor.width ?? 3}
                  onChange={(event) =>
                    setDoors((items) => items.map((door) => door.id === selectedDoor.id ? { ...door, width: Number(event.target.value) } : door))
                  }
                />
              </label>

              <label className="grid gap-1 text-xs font-black text-yellow-100">
                Height: {formatFeet(selectedDoor.height ?? 2.4)}
                <input
                  type="range"
                  min="1.5"
                  max="4"
                  step="0.1"
                  value={selectedDoor.height ?? 2.4}
                  onChange={(event) =>
                    setDoors((items) => items.map((door) => door.id === selectedDoor.id ? { ...door, height: Number(event.target.value) } : door))
                  }
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDoors((items) => items.map((door) => door.id === selectedDoor.id ? { ...door, flip: !door.flip } : door))}
                  className="rounded-xl p-2 text-xs font-black text-white"
                  style={{ background: selectedDoor.flip ? "#15803d" : "#374151" }}
                >
                  Flip Swing {selectedDoor.flip ? "On" : "Off"}
                </button>

                <button
                  type="button"
                  onClick={() => setDoors((items) => items.map((door) => door.id === selectedDoor.id ? { ...door, double: !door.double } : door))}
                  className="rounded-xl p-2 text-xs font-black text-white"
                  style={{ background: selectedDoor.double ? "#15803d" : "#374151" }}
                >
                  Double Door {selectedDoor.double ? "On" : "Off"}
                </button>
              </div>
            </div>
          )}

          {selectedWindow && (
            <div className="mt-6 grid gap-3">
              <p className="font-black text-yellow-300">Selected Window</p>

              <label className="grid gap-1 text-xs font-black text-yellow-100">
                Width: {formatFeet(selectedWindow.width ?? 3)}
                <input
                  type="range"
                  min="0.5"
                  max="6"
                  step="0.1"
                  value={selectedWindow.width ?? 3}
                  onChange={(event) =>
                    setWindows((items) => items.map((windowItem) => windowItem.id === selectedWindow.id ? { ...windowItem, width: Number(event.target.value) } : windowItem))
                  }
                />
              </label>

              <label className="grid gap-1 text-xs font-black text-yellow-100">
                Height: {formatFeet(selectedWindow.height ?? 1.1)}
                <input
                  type="range"
                  min="0.5"
                  max="3"
                  step="0.1"
                  value={selectedWindow.height ?? 1.1}
                  onChange={(event) =>
                    setWindows((items) => items.map((windowItem) => windowItem.id === selectedWindow.id ? { ...windowItem, height: Number(event.target.value) } : windowItem))
                  }
                />
              </label>
            </div>
          )}

          {selectedFence && (
            <div className="mt-6 grid gap-3">
              <p className="font-black text-yellow-300">Selected {selectedFence.isGate ? "Gate" : "Fence"}</p>

              <select
                value={selectedFence.type ?? "CHAIN_LINK"}
                onChange={(event) =>
                  setFences((items) => items.map((fence) => fence.id === selectedFence.id ? { ...fence, type: event.target.value as FenceType } : fence))
                }
                className="rounded-lg bg-black/30 px-2 py-1.5 text-xs font-bold text-yellow-100"
              >
                <option value="CHAIN_LINK">Chain Link</option>
                <option value="PICKET">Picket</option>
                <option value="WOOD">Wood Privacy</option>
                <option value="WROUGHT_IRON">Wrought Iron</option>
              </select>

              <label className="grid gap-1 text-xs font-black text-yellow-100">
                Length: {formatFeet(selectedFence.length ?? 4)}
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="0.5"
                  value={selectedFence.length ?? 4}
                  onChange={(event) =>
                    setFences((items) => items.map((fence) => fence.id === selectedFence.id ? { ...fence, length: Number(event.target.value) } : fence))
                  }
                />
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setFences((items) => items.map((fence) => fence.id === selectedFence.id ? { ...fence, rotation: (fence.rotation ?? 0) + Math.PI / 2 } : fence))
                  }
                  className="rounded-xl bg-gray-700 p-2 text-xs font-black text-white"
                >
                  Rotate 90°
                </button>

                <button
                  type="button"
                  onClick={() => setFences((items) => items.map((fence) => fence.id === selectedFence.id ? { ...fence, isGate: !fence.isGate } : fence))}
                  className="rounded-xl p-2 text-xs font-black text-white"
                  style={{ background: selectedFence.isGate ? "#15803d" : "#374151" }}
                >
                  {selectedFence.isGate ? "Gate" : "Make Gate"}
                </button>
              </div>
            </div>
          )}

          {selectedPlant && (
            <div className="mt-6 grid gap-3">
              <p className="font-black text-yellow-300">Selected {selectedPlant.type === "TREE" ? "Tree" : selectedPlant.type === "SHRUB" ? "Shrub" : "Flower Bed"}</p>

              <label className="grid gap-1 text-xs font-black text-yellow-100">
                Size: {(selectedPlant.scale ?? 1).toFixed(1)}x
                <input
                  type="range"
                  min="0.3"
                  max="3"
                  step="0.1"
                  value={selectedPlant.scale ?? 1}
                  onChange={(event) =>
                    setPlants((items) => items.map((plant) => plant.id === selectedPlant.id ? { ...plant, scale: Number(event.target.value) } : plant))
                  }
                />
              </label>
            </div>
          )}

          <div className="mt-6">
            <p className="font-black text-yellow-300">Measurement Result</p>
            <div className="mt-2 rounded-xl bg-black/25 p-3">
              {measurementFeet > 0 ? formatFeetInches(measurementFeet) : "No measurement selected"}
            </div>

            <p className="mt-6 font-black text-yellow-300">Material Count</p>
            <div className="mt-2 grid gap-2">
              {Object.entries(materialCount).map(([label, count]) => (
                <div key={label} className="rounded-xl bg-black/25 p-3">{label}: <b>{count}</b></div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function Floor({
  onClick,
  onMove,
  onStop,
}: {
  onClick: (event: ThreeEvent<PointerEvent>) => void;
  onMove: (point: Vec2) => void;
  onStop: () => void;
}) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={onClick}
      onPointerMove={(event) => onMove(pointFromEvent(event))}
      onPointerUp={onStop}
      onPointerLeave={onStop}
    >
      <planeGeometry args={[80, 80]} />
      <meshStandardMaterial transparent opacity={0} />
    </mesh>
  );
}

function WireModel({ from, to }: { from: Device; to: Device }) {
  const points = [
    new THREE.Vector3(from.x, 2.7, from.z),
    new THREE.Vector3(to.x, 2.7, to.z),
  ];

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: "#22c55e" });
  const line = new THREE.Line(geometry, material);

  return <primitive object={line} />;
}


function MeasurementLine({ start, end }: { start: Vec2; end: Vec2 }) {
  const points = [
    new THREE.Vector3(start.x, 0.08, start.z),
    new THREE.Vector3(end.x, 0.08, end.z),
  ];
  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color: "#22c55e" });
  const line = new THREE.Line(geometry, material);
  const distance = Math.sqrt((end.x - start.x) ** 2 + (end.z - start.z) ** 2);

  return (
    <group>
      <primitive object={line} />
      <Text
        position={[(start.x + end.x) / 2, 0.35, (start.z + end.z) / 2]}
        fontSize={0.35}
        color="#22c55e"
      >
        {formatFeetInches(distance)}
      </Text>
    </group>
  );
}
