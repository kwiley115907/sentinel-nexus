import type { CadRoom, CadWall } from "@/components/cad/geometry/BuildingGeometry";

type RawWall = CadWall & {
  roomId: string;
  side: "north" | "south" | "east" | "west";
  floor: number;
  storyHeight: number;
};

function keyWall(wall: RawWall) {
  const ax = Math.round(wall.start.x * 100) / 100;
  const az = Math.round(wall.start.z * 100) / 100;
  const bx = Math.round(wall.end.x * 100) / 100;
  const bz = Math.round(wall.end.z * 100) / 100;

  const a = `${ax},${az}`;
  const b = `${bx},${bz}`;

  const points = a < b ? `${a}|${b}` : `${b}|${a}`;

  // Floor is part of the identity now — two rooms sharing a wall on
  // the SAME floor still merge into one interior wall (unchanged
  // behavior), but the same footprint on different floors no longer
  // collapses into a single wall.
  return `${points}|f${wall.floor}`;
}

function rawRoomWalls(room: CadRoom): RawWall[] {
  const left = room.x - room.width / 2;
  const right = room.x + room.width / 2;
  const front = room.z - room.depth / 2;
  const back = room.z + room.depth / 2;
  const floor = room.floor ?? 1;
  const storyHeight = room.height;

  return [
    {
      id: `wall-${room.id}-north`,
      roomId: room.id,
      side: "north",
      start: { x: left, z: front },
      end: { x: right, z: front },
      height: room.height,
      thickness: 0.18,
      label: `${room.label} North`,
      layer: "ARCHITECTURE",
      floor,
      storyHeight,
    },
    {
      id: `wall-${room.id}-south`,
      roomId: room.id,
      side: "south",
      start: { x: left, z: back },
      end: { x: right, z: back },
      height: room.height,
      thickness: 0.18,
      label: `${room.label} South`,
      layer: "ARCHITECTURE",
      floor,
      storyHeight,
    },
    {
      id: `wall-${room.id}-west`,
      roomId: room.id,
      side: "west",
      start: { x: left, z: front },
      end: { x: left, z: back },
      height: room.height,
      thickness: 0.18,
      label: `${room.label} West`,
      layer: "ARCHITECTURE",
      floor,
      storyHeight,
    },
    {
      id: `wall-${room.id}-east`,
      roomId: room.id,
      side: "east",
      start: { x: right, z: front },
      end: { x: right, z: back },
      height: room.height,
      thickness: 0.18,
      label: `${room.label} East`,
      layer: "ARCHITECTURE",
      floor,
      storyHeight,
    },
  ];
}

export function generateWallNetworkFromRooms(rooms: CadRoom[]): CadWall[] {
  const grouped = new Map<string, RawWall[]>();

  for (const wall of rooms.flatMap(rawRoomWalls)) {
    const key = keyWall(wall);
    grouped.set(key, [...(grouped.get(key) ?? []), wall]);
  }

  const walls: CadWall[] = [];

  for (const [key, matches] of grouped.entries()) {
    const first = matches[0];
    const shared = matches.length > 1;

    walls.push({
      id: shared ? `interior-${key.replace(/[^a-zA-Z0-9]/g, "-")}` : first.id,
      start: first.start,
      end: first.end,
      height: first.height,
      thickness: shared ? 0.12 : 0.28,
      label: shared ? "Interior Wall" : "Exterior Wall",
      layer: "ARCHITECTURE",
      floor: first.floor,
      storyHeight: first.storyHeight,
    });
  }

  return walls;
}
