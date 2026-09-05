import type { CadBuildingModel, CadDevice } from "@/components/cad/geometry/BuildingGeometry";

// Bridges a request typed into the global Sentinel AI chat (visible on every
// page via AppShell) to whichever tool actually acts on it. The chat itself
// has no access to the 3D Builder's or Wire Runs' page-local React state -
// they're separate component trees, gone the moment you navigate away - so
// a generated result is stashed here, the user is routed to the tool that
// displays it, and that tool picks it up once on mount. Session/local
// storage (not React state) is what survives the navigation.

const BUILDING_KEY = "sentinel-ai-pending-building";
const PROJECT_KEY = "alarm-core-project";

export type PendingBuilding = {
  model: CadBuildingModel;
  prompt: string;
};

export function stashPendingBuilding(model: CadBuildingModel, prompt: string) {
  sessionStorage.setItem(BUILDING_KEY, JSON.stringify({ model, prompt }));
}

// Consume-once: the 3D Builder calls this on mount. Returns null if nothing
// is waiting (e.g. the page was opened directly, not via the chat handoff).
export function takePendingBuilding(): PendingBuilding | null {
  const raw = sessionStorage.getItem(BUILDING_KEY);
  if (!raw) return null;
  sessionStorage.removeItem(BUILDING_KEY);

  try {
    return JSON.parse(raw) as PendingBuilding;
  } catch {
    return null;
  }
}

type WireRunDevice = { id: string; tag: string; x: number; y: number };
type WireRun = { id: string; label: string; cableType: string; fromId: string; toId: string };

const CABLE_TYPE_BY_DEVICE_TYPE: Record<string, string> = {
  SMOKE_DETECTOR: "SLC Loop - 18AWG FPLR",
  HORN_STROBE: "NAC Circuit - 14AWG FPLR",
  PULL_STATION: "SLC Loop - 18AWG FPLR",
};

// "Auto-connect devices by type": every device of the same type gets
// chained together in one continuous loop (matching how SLC/NAC circuits
// are actually wired in the field - one daisy chain, not a star), starting
// from the fire alarm control panel when the building has one.
export function buildWireRunsFromDevices(devices: CadDevice[]): { devices: WireRunDevice[]; wireRuns: WireRun[] } {
  const wireRunDevices: WireRunDevice[] = devices.map((device) => ({
    id: device.id,
    tag: device.label,
    x: device.x,
    y: device.z,
  }));

  const facp = devices.find((device) => device.type === "FIRE_ALARM_CONTROL_PANEL");
  const groups = new Map<string, CadDevice[]>();

  for (const device of devices) {
    if (device === facp) continue;
    const list = groups.get(device.type) ?? [];
    list.push(device);
    groups.set(device.type, list);
  }

  const wireRuns: WireRun[] = [];

  for (const [type, list] of groups) {
    const chain = facp ? [facp, ...list] : list;
    const cableType = CABLE_TYPE_BY_DEVICE_TYPE[type] ?? "18AWG FPLR";

    for (let i = 0; i < chain.length - 1; i++) {
      wireRuns.push({
        id: `wr-${type}-${i}`,
        label: `${type.replace(/_/g, " ")} Run ${i + 1}`,
        cableType,
        fromId: chain[i].id,
        toId: chain[i + 1].id,
      });
    }
  }

  return { devices: wireRunDevices, wireRuns };
}

// Writes into the same localStorage shape the Wire Runs page already reads
// on mount - no changes needed there, it picks this up automatically.
export function stashWireRunProject(devices: CadDevice[]) {
  const { devices: wireRunDevices, wireRuns } = buildWireRunsFromDevices(devices);
  localStorage.setItem(PROJECT_KEY, JSON.stringify({ devices: wireRunDevices, wireRuns, feetPerUnit: 2 }));
  return wireRuns.length;
}

// The last building the chat generated this session, kept around so a
// follow-up "wire it up" request has devices to connect without the user
// having to describe the building again.
const LAST_DEVICES_KEY = "sentinel-ai-last-devices";

export function rememberLastDevices(devices: CadDevice[]) {
  sessionStorage.setItem(LAST_DEVICES_KEY, JSON.stringify(devices));
}

export function recallLastDevices(): CadDevice[] | null {
  const raw = sessionStorage.getItem(LAST_DEVICES_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CadDevice[]) : null;
  } catch {
    return null;
  }
}
