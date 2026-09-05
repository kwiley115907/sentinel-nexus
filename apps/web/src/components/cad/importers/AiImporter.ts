import type {
  CadBuildingModel,
  CadDevice,
  CadDoor,
  CadRoom,
  CadStair,
  CadWall,
  CadWindow,
} from "@/components/cad/geometry/BuildingGeometry";

export type AiBlueprint = {
  prompt?: string;
  stories?: number;
  rooms?: any[];
};

const H = 3;

function storiesFrom(prompt: string, fallback?: number) {
  if (fallback && fallback > 0) return fallback;
  const t = prompt.toLowerCase();
  const m = t.match(/(\d+)\s*(story|stories|floor|floors)/);
  if (m) return Math.max(1, Number(m[1]));
  if (t.includes("two story") || t.includes("two-story")) return 2;
  if (t.includes("three story") || t.includes("three-story")) return 3;
  return 1;
}

function room(id: string, label: string, x: number, z: number, width: number, depth: number, stories: number, floor = 1): CadRoom {
  return {
    id: `${id}-f${floor}`,
    label: `${label} - F${floor}`,
    x,
    z,
    width,
    depth,
    height: H,
    stories,
    floor,
    shape: "RECTANGLE",
    layer: "ARCHITECTURE",
  };
}

// A mall's own room count/layout is parametric (however many stores were
// asked for), not one fixed floor plan - generated separately below and
// spliced in before the fixed-layout templates run.
function mallProgram(prompt: string, stories: number): CadRoom[] {
  const t = prompt.toLowerCase();

  const perFloorMatch = t.match(/(\d+)\s*stores?\s*(?:per|\/|each)\s*floor/);
  const totalMatch = t.match(/(\d+)\s*stores?\b/);

  const totalStores = totalMatch ? Math.max(1, Number(totalMatch[1])) : stories * 10;
  const storesPerFloor = perFloorMatch
    ? Math.max(1, Number(perFloorMatch[1]))
    : Math.max(1, Math.round(totalStores / stories));

  const hasRestroomPerStore = /restroom|bathroom|toilet/.test(t);

  const storeWidth = 9;
  const storeDepth = 8;
  const restroomSize = 3.5;
  const corridorWidth = 6;
  const gap = 0.6;

  // Named "corridor" (not "concourse") so it's excluded from partition
  // walls/doors/stairs-anchor logic the same way every other template's
  // main corridor already is (makeWalls/makeDoors/makeStairs all key off
  // that substring).
  const rooms: CadRoom[] = [
    room("corridor", "Main Concourse", 0, 0, storesPerFloor * (storeWidth + gap), corridorWidth, stories),
  ];

  const startX = -((storesPerFloor - 1) * (storeWidth + gap)) / 2;
  const storeZ = corridorWidth / 2 + storeDepth / 2 + gap;

  for (let i = 0; i < storesPerFloor; i++) {
    const x = startX + i * (storeWidth + gap);
    rooms.push(room(`store-${i + 1}`, `Store ${i + 1}`, x, storeZ, storeWidth, storeDepth, stories));

    if (hasRestroomPerStore) {
      const restroomZ = storeZ + storeDepth / 2 + gap + restroomSize / 2;
      rooms.push(
        room(`store-${i + 1}-rr`, `Store ${i + 1} Restroom`, x, restroomZ, restroomSize, restroomSize, stories),
      );
    }
  }

  return rooms;
}

function baseProgram(prompt: string, stories: number): CadRoom[] {
  const t = prompt.toLowerCase();

  if (t.includes("school")) {
    return [
      room("corridor", "Main Corridor", 0, 0, 36, 4, stories),
      room("lobby", "Lobby", -14, 6, 8, 6, stories),
      room("class-1", "Classroom 1", -12, -5.5, 8, 7, stories),
      room("class-2", "Classroom 2", -4, -5.5, 8, 7, stories),
      room("class-3", "Classroom 3", 4, -5.5, 8, 7, stories),
      room("office", "Office", 12, -5.5, 7, 6, stories),
      room("cafeteria", "Cafeteria", -6, 6, 12, 7, stories),
      room("gym", "Gym", 9, 6, 14, 8, stories),
    ];
  }

  // Word-boundary matches only - this used to check t.includes("er"), which
  // matches the letters "er" *anywhere* in the prompt (e.g. "stores PER
  // floor", "restroom PER store"), silently routing completely unrelated
  // requests (a mall, in one real case) into the hospital layout.
  if (/\bhospital\b/.test(t) || /\bexam\b/.test(t) || /\ber\b/.test(t)) {
    return [
      room("corridor", "Main Corridor", 0, 0, 42, 4, stories),
      room("lobby", "Lobby", -16, 6, 10, 6, stories),
      room("waiting", "Waiting", -7, 6, 8, 6, stories),
      room("nurse", "Nurse Station", 3, 6, 8, 6, stories),
      room("storage", "Medical Storage", 12, 6, 7, 6, stories),
      room("er-1", "ER Room 1", -16, -5.5, 8, 7, stories),
      room("er-2", "ER Room 2", -8, -5.5, 8, 7, stories),
      room("exam-1", "Exam Room 1", 0, -5.5, 8, 7, stories),
      room("exam-2", "Exam Room 2", 8, -5.5, 8, 7, stories),
      room("restroom", "Restroom", 16, -5.5, 7, 6, stories),
    ];
  }

  if (/\bmall\b/.test(t) || /\bshopping center\b/.test(t) || /\bretail\b/.test(t) || /\bstores?\b/.test(t)) {
    return mallProgram(prompt, stories);
  }

  return [
    room("corridor", "Main Corridor", 0, 0, 26, 4, stories),
    room("office", "Office", -7, -5, 8, 6, stories),
    room("conference", "Conference", 2, -5, 9, 6, stories),
    room("break", "Break Room", 10, -5, 7, 6, stories),
    room("reception", "Reception", -7, 5, 8, 6, stories),
    room("it", "IT Room", 3, 5, 7, 6, stories),
  ];
}

function allFloors(base: CadRoom[], stories: number): CadRoom[] {
  return Array.from({ length: stories }).flatMap((_, i) =>
    base.map((r) => ({
      ...r,
      id: r.id.replace(/-f1$/, `-f${i + 1}`),
      label: r.label.replace(/- F1$/, `- F${i + 1}`),
      floor: i + 1,
    })),
  );
}

function bounds(rooms: CadRoom[]) {
  return {
    minX: Math.min(...rooms.map((r) => r.x - r.width / 2)),
    maxX: Math.max(...rooms.map((r) => r.x + r.width / 2)),
    minZ: Math.min(...rooms.map((r) => r.z - r.depth / 2)),
    maxZ: Math.max(...rooms.map((r) => r.z + r.depth / 2)),
  };
}

function wall(
  id: string,
  x1: number,
  z1: number,
  x2: number,
  z2: number,
  label: string,
  floor = 1,
  height = H,
): CadWall {
  return {
    id,
    start: { x: x1, z: z1 },
    end: { x: x2, z: z2 },
    height,
    thickness:
      label === "Exterior Wall"
        ? 0.32
        : 0.16,
    label,
    floor,
    storyHeight: H,
    layer: "ARCHITECTURE",
  };
}

function makeWalls(
  rooms: CadRoom[],
): CadWall[] {
  const floorNumbers = [
    ...new Set(
      rooms.map((room) =>
        Math.max(
          1,
          Number(room.floor ?? 1),
        ),
      ),
    ),
  ].sort((a, b) => a - b);

  return floorNumbers.flatMap((floor) => {
    const floorRooms = rooms.filter(
      (room) =>
        Number(room.floor ?? 1) === floor,
    );

    if (floorRooms.length === 0) {
      return [];
    }

    const b = bounds(floorRooms);

    const walls: CadWall[] = [
      wall(
        `shell-north-f${floor}`,
        b.minX,
        b.minZ,
        b.maxX,
        b.minZ,
        "Exterior Wall",
        floor,
      ),
      wall(
        `shell-south-f${floor}`,
        b.minX,
        b.maxZ,
        b.maxX,
        b.maxZ,
        "Exterior Wall",
        floor,
      ),
      wall(
        `shell-west-f${floor}`,
        b.minX,
        b.minZ,
        b.minX,
        b.maxZ,
        "Exterior Wall",
        floor,
      ),
      wall(
        `shell-east-f${floor}`,
        b.maxX,
        b.minZ,
        b.maxX,
        b.maxZ,
        "Exterior Wall",
        floor,
      ),
    ];

    for (
      const room of floorRooms.filter(
        (item) =>
          !item.id.includes("corridor"),
      )
    ) {
      const left =
        room.x - room.width / 2;
      const right =
        room.x + room.width / 2;
      const front =
        room.z - room.depth / 2;
      const back =
        room.z + room.depth / 2;

      walls.push(
        wall(
          `partition-${room.id}-front`,
          left,
          front,
          right,
          front,
          "Interior Wall",
          floor,
        ),
        wall(
          `partition-${room.id}-back`,
          left,
          back,
          right,
          back,
          "Interior Wall",
          floor,
        ),
        wall(
          `partition-${room.id}-left`,
          left,
          front,
          left,
          back,
          "Interior Wall",
          floor,
        ),
        wall(
          `partition-${room.id}-right`,
          right,
          front,
          right,
          back,
          "Interior Wall",
          floor,
        ),
      );
    }

    return walls;
  });
}

function makeDoors(rooms: CadRoom[]): CadDoor[] {
  return rooms
    .filter((r) => r.floor === 1 && !r.id.includes("corridor"))
    .map((r, i) => ({
      id: `door-${r.id}`,
      label: i === 0 ? "Main Door" : "Door",
      x: r.x,
      z: r.z < 0 ? r.z + r.depth / 2 : r.z - r.depth / 2,
      width: i === 0 ? 4 : 3,
      height: 2.4,
      rotation: 0,
      floor: 1,
      layer: "ARCHITECTURE",
    }));
}

function makeWindows(walls: CadWall[], stories: number): CadWindow[] {
  return walls
    .filter((w) => w.label === "Exterior Wall")
    .flatMap((w) => {
      const len = Math.hypot(w.end.x - w.start.x, w.end.z - w.start.z);
      const count = Math.max(1, Math.floor(len / 10));
      const rot = Math.atan2(w.end.z - w.start.z, w.end.x - w.start.x);

      return Array.from({ length: stories }).flatMap((_, floorIndex) =>
        Array.from({ length: count }).map((__, i) => {
          const t = (i + 1) / (count + 1);
          return {
            id: `window-${w.id}-f${floorIndex + 1}-${i + 1}`,
            label: `Window F${floorIndex + 1}`,
            x: w.start.x + (w.end.x - w.start.x) * t,
            z: w.start.z + (w.end.z - w.start.z) * t,
            width: 3,
            height: 1.1,
            sillHeight: 1.2,
            rotation: rot,
            floor: floorIndex + 1,
            storyHeight: H,
            layer: "ARCHITECTURE",
          };
        }),
      );
    });
}

function makeStairs(rooms: CadRoom[], stories: number): CadStair[] {
  if (stories <= 1) return [];
  const corridor = rooms.find((r) => r.id.includes("corridor") && r.floor === 1) ?? rooms[0];

  return Array.from({ length: stories - 1 }).map((_, i) => ({
    id: `stair-f${i + 1}-to-f${i + 2}`,
    label: `Stairs F${i + 1} to F${i + 2}`,
    x: corridor.x + corridor.width / 2 - 4,
    z: corridor.z,
    width: 3,
    depth: 5,
    floor: i + 1,
    stories,
    storyHeight: H,
    rotation: Math.PI / 2,
    layer: "ARCHITECTURE",
  }));
}

function makeDevices(rooms: CadRoom[]): CadDevice[] {
  const firstFloorRooms = rooms.filter((r) => r.floor === 1);
  const lobby = firstFloorRooms.find((r) => r.id.includes("lobby")) ?? firstFloorRooms[0];

  const devices: CadDevice[] = firstFloorRooms
    .filter((r) => !r.id.includes("corridor"))
    .map((r) => ({
      id: `sd-${r.id}`,
      label: "SD",
      type: "SMOKE_DETECTOR",
      x: r.x,
      z: r.z,
      floor: 1,
      storyHeight: H,
      layer: "FIRE_ALARM",
    }));

  if (lobby) {
    devices.push({
      id: "facp-main",
      label: "FACP",
      type: "FIRE_ALARM_CONTROL_PANEL",
      x: lobby.x - lobby.width / 2 + 0.6,
      z: lobby.z,
      y: 1.4,
      floor: 1,
      storyHeight: H,
      wallMounted: true,
      layer: "FIRE_ALARM",
    });
  }

  return devices;
}

export function convertAiBlueprintToCad(ai: AiBlueprint): CadBuildingModel {
  const prompt = String(ai.prompt || "");
  const stories = storiesFrom(prompt, ai.stories);
  const rooms = allFloors(baseProgram(prompt, stories), stories);
  const walls = makeWalls(rooms);
  const doors = makeDoors(rooms);
  const windows = makeWindows(walls, stories);
  const stairs = makeStairs(rooms, stories);
  const devices = makeDevices(rooms);

  return { stories, rooms, walls, doors, windows, stairs, devices };
}
