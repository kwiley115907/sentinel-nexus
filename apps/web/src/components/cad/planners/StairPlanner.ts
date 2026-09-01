import type { CadRoom, CadStair } from "@/components/cad/geometry/BuildingGeometry";

function isGoodStairAnchor(room: CadRoom) {
  const text = room.label.toLowerCase();
  return text.includes("corridor") || text.includes("hall") || text.includes("lobby") || text.includes("entry");
}

export function planStairs({
  rooms,
  stories,
}: {
  rooms: CadRoom[];
  stories: number;
}): CadStair[] {
  if (stories <= 1) return [];

  const firstFloorRooms = rooms.filter((room) => room.floor === 1);
  const anchor = firstFloorRooms.find(isGoodStairAnchor) ?? firstFloorRooms[0] ?? rooms[0];

  if (!anchor) return [];

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
