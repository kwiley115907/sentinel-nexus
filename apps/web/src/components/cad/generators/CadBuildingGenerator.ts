import { generateWallNetworkFromRooms } from "@/components/cad/generators/WallNetworkGenerator";
import { generateDoorOpenings, generateWindowOpenings } from "@/components/cad/generators/OpeningGenerator";
import { generateSmartFireAlarmDevices } from "@/components/cad/generators/SmartDeviceGenerator";
import type {
  CadBuildingModel,
  CadDevice,
  CadDoor,
  CadRoom,
  CadStair,
  CadWall,
  CadWindow,
} from "@/components/cad/geometry/BuildingGeometry";

function detectStories(prompt: string) {
  const text = prompt.toLowerCase();
  const match = text.match(/(\d+)\s*(story|stories|floor|floors)/);
  if (match) return Math.max(1, Number(match[1]));
  if (text.includes("two story") || text.includes("two-story")) return 2;
  if (text.includes("three story") || text.includes("three-story")) return 3;
  if (text.includes("four story") || text.includes("four-story")) return 4;
  return 1;
}

function detectType(prompt: string) {
  const text = prompt.toLowerCase();
  if (text.includes("hospital") || text.includes("er") || text.includes("exam")) return "hospital";
  if (text.includes("school") || text.includes("classroom")) return "school";
  if (text.includes("office")) return "office";
  return "custom";
}

function room(id: string, label: string, x: number, z: number, width: number, depth: number, stories: number): CadRoom {
  return {
    id,
    label,
    x,
    z,
    width,
    depth,
    height: 3,
    stories,
    floor: 1,
    shape: "RECTANGLE",
    layer: "ARCHITECTURE",
  };
}

function roomsForPrompt(prompt: string, stories: number): CadRoom[] {
  const type = detectType(prompt);

  if (type === "hospital") {
    return [
      room("lobby", "Lobby", 0, 8, 12, 6, stories),
      room("corridor", "Main Corridor", 0, 1, 24, 3, stories),
      room("waiting", "Waiting Area", -9, 4, 6, 5, stories),
      room("triage", "Triage", -9, -2, 6, 5, stories),
      room("er-1", "ER Room 1", -9, -8, 6, 5, stories),
      room("er-2", "ER Room 2", -2, -8, 6, 5, stories),
      room("exam-1", "Exam Room 1", -9, 10, 6, 5, stories),
      room("exam-2", "Exam Room 2", -2, 10, 6, 5, stories),
      room("exam-3", "Exam Room 3", 5, 10, 6, 5, stories),
      room("exam-4", "Exam Room 4", 12, 10, 6, 5, stories),
      room("nurse", "Nurse Station", 3, 4, 8, 5, stories),
      room("storage", "Medical Storage", 12, 4, 6, 5, stories),
      room("staff", "Staff Room", 8, -2, 6, 5, stories),
      room("mechanical", "Mechanical", 15, -2, 6, 5, stories),
      room("restroom", "Restroom", 12, -8, 6, 5, stories),
    ];
  }

  if (type === "school") {
    return [
      room("lobby", "Lobby", 0, 8, 10, 5, stories),
      room("corridor", "Main Corridor", 0, 1, 24, 3, stories),
      room("class-1", "Classroom 1", -9, 7, 7, 6, stories),
      room("class-2", "Classroom 2", -2, 7, 7, 6, stories),
      room("class-3", "Classroom 3", 5, 7, 7, 6, stories),
      room("office", "Office", 12, 7, 6, 5, stories),
      room("cafeteria", "Cafeteria", -7, -6, 10, 7, stories),
      room("gym", "Gym", 7, -6, 12, 8, stories),
      room("bathrooms", "Bathrooms", 15, 1, 5, 5, stories),
    ];
  }

  return [
    room("entry", "Entry", -6, 4, 6, 4, stories),
    room("corridor", "Main Corridor", 2, 0, 14, 3, stories),
    room("room-1", "Room 1", -6, -3, 6, 5, stories),
    room("room-2", "Room 2", 1, -3, 6, 5, stories),
    room("room-3", "Room 3", 8, -3, 6, 5, stories),
  ];
}

function makeDoors(rooms: CadRoom[]): CadDoor[] {
  return rooms.map((room, index) => ({
    id: `door-${room.id}`,
    label: index === 0 ? "Main Door" : "Door",
    x: room.x,
    z: room.z - room.depth / 2 - 0.1,
    width: index === 0 ? 4 : 3,
    height: 2.4,
    rotation: 0,
    floor: 1,
    layer: "ARCHITECTURE",
  }));
}

function makeWindows(rooms: CadRoom[], stories: number): CadWindow[] {
  return rooms.flatMap((room) => {
    const windows: CadWindow[] = [];

    for (let floor = 1; floor <= stories; floor++) {
      windows.push({
        id: `window-${room.id}-front-f${floor}`,
        label: `Window F${floor}`,
        x: room.x,
        z: room.z - room.depth / 2 - 0.12,
        width: Math.min(4, Math.max(2, room.width * 0.45)),
        height: 1.1,
        sillHeight: 1.2,
        rotation: 0,
        floor,
        storyHeight: room.height,
        layer: "ARCHITECTURE",
      });

      windows.push({
        id: `window-${room.id}-back-f${floor}`,
        label: `Window F${floor}`,
        x: room.x,
        z: room.z + room.depth / 2 + 0.12,
        width: Math.min(4, Math.max(2, room.width * 0.45)),
        height: 1.1,
        sillHeight: 1.2,
        rotation: 0,
        floor,
        storyHeight: room.height,
        layer: "ARCHITECTURE",
      });
    }

    return windows;
  });
}

function makeStairs(rooms: CadRoom[], stories: number): CadStair[] {
  if (stories <= 1 || rooms.length === 0) return [];

  const anchor = rooms.find((room) => room.id.includes("corridor")) ?? rooms[0];

  return Array.from({ length: stories - 1 }).map((_, index) => ({
    id: `stair-f${index + 1}-to-f${index + 2}`,
    label: `Stairs F${index + 1} to F${index + 2}`,
    x: anchor.x + anchor.width / 2 - 2,
    z: anchor.z,
    width: 3,
    depth: 5,
    floor: index + 1,
    stories,
    storyHeight: anchor.height,
    rotation: Math.PI / 2,
    layer: "ARCHITECTURE",
  }));
}

function makeDevices(rooms: CadRoom[]): CadDevice[] {
  return rooms.flatMap((room) => {
    const devices: CadDevice[] = [];

    for (let floor = 1; floor <= room.stories; floor++) {
      devices.push({
        id: `sd-${room.id}-f${floor}`,
        label: "SD",
        type: "SMOKE",
        x: room.x,
        z: room.z,
        floor,
        storyHeight: room.height,
        layer: "FIRE_ALARM",
      });

      devices.push({
        id: `hs-${room.id}-f${floor}`,
        label: "HS",
        type: "HORN_STROBE",
        x: room.x + room.width / 2 - 0.25,
        z: room.z,
        y: (floor - 1) * room.height + 2.2,
        floor,
        storyHeight: room.height,
        wallMounted: true,
        layer: "FIRE_ALARM",
      });
    }

    return devices;
  });
}

export function generateCadBuildingFromPrompt(prompt: string): CadBuildingModel {
  const stories = detectStories(prompt);
  const baseRooms = roomsForPrompt(prompt, stories);

  const rooms = baseRooms.flatMap((room) =>
    Array.from({ length: stories }).map((_, index) => ({
      ...room,
      id: `${room.id}-f${index + 1}`,
      label: `${room.label} - F${index + 1}`,
      floor: index + 1,
      stories,
    })),
  );

  const walls = generateWallNetworkFromRooms(rooms);
  const doors = generateDoorOpenings(rooms, walls);
  const windows = generateWindowOpenings(rooms, walls, stories);

  return {
    stories,
    rooms,
    walls,
    doors,
    windows,
    stairs: makeStairs(baseRooms, stories),
    devices: generateSmartFireAlarmDevices({ rooms, doors }),
  };
}
