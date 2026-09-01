import type { CadRoom, CadWall } from "@/components/cad/geometry/BuildingGeometry";

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function wallKey(start: { x: number; z: number }, end: { x: number; z: number }) {
  const a = `${round(start.x)},${round(start.z)}`;
  const b = `${round(end.x)},${round(end.z)}`;
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function roomEdges(room: CadRoom): CadWall[] {
  const left = room.x - room.width / 2;
  const right = room.x + room.width / 2;
  const front = room.z - room.depth / 2;
  const back = room.z + room.depth / 2;

  return [
    {
      id: `exterior-${room.id}-north`,
      start: { x: left, z: front },
      end: { x: right, z: front },
      height: room.height,
      thickness: 0.32,
      label: "Exterior Wall",
      layer: "ARCHITECTURE",
    },
    {
      id: `exterior-${room.id}-south`,
      start: { x: left, z: back },
      end: { x: right, z: back },
      height: room.height,
      thickness: 0.32,
      label: "Exterior Wall",
      layer: "ARCHITECTURE",
    },
    {
      id: `exterior-${room.id}-west`,
      start: { x: left, z: front },
      end: { x: left, z: back },
      height: room.height,
      thickness: 0.32,
      label: "Exterior Wall",
      layer: "ARCHITECTURE",
    },
    {
      id: `exterior-${room.id}-east`,
      start: { x: right, z: front },
      end: { x: right, z: back },
      height: room.height,
      thickness: 0.32,
      label: "Exterior Wall",
      layer: "ARCHITECTURE",
    },
  ];
}

export function generateExteriorWallsFromRooms(rooms: CadRoom[]): CadWall[] {
  const grouped = new Map<string, CadWall[]>();

  for (const room of rooms) {
    for (const wall of roomEdges(room)) {
      const key = wallKey(wall.start, wall.end);
      grouped.set(key, [...(grouped.get(key) ?? []), wall]);
    }
  }

  return [...grouped.entries()]
    .filter(([, matches]) => matches.length === 1)
    .map(([key, matches]) => ({
      ...matches[0],
      id: `exterior-${key.replace(/[^a-zA-Z0-9]/g, "-")}`,
      label: "Exterior Wall",
      thickness: 0.32,
    }));
}
