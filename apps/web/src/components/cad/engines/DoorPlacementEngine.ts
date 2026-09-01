import type { CadDoor, CadRoom, CadWall } from "@/components/cad/geometry/BuildingGeometry";

function wallLength(wall: CadWall) {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
}

function wallAngle(wall: CadWall) {
  return Math.atan2(wall.end.z - wall.start.z, wall.end.x - wall.start.x);
}

function wallMidpoint(wall: CadWall) {
  return {
    x: (wall.start.x + wall.end.x) / 2,
    z: (wall.start.z + wall.end.z) / 2,
  };
}

function roomCenterDistance(room: CadRoom, wall: CadWall) {
  const mid = wallMidpoint(wall);
  return Math.hypot(room.x - mid.x, room.z - mid.z);
}

function findBestDoorWall(room: CadRoom, walls: CadWall[]) {
  const candidateWalls = walls
    .filter((wall) => wallLength(wall) >= 3)
    .filter((wall) => wall.label === "Interior Wall" || wall.label === "Exterior Wall")
    .sort((a, b) => roomCenterDistance(room, a) - roomCenterDistance(room, b));

  return candidateWalls[0];
}

export function placeDoorsForRooms({
  rooms,
  walls,
}: {
  rooms: CadRoom[];
  walls: CadWall[];
}): CadDoor[] {
  return rooms
    .map((room, index) => {
      const wall = findBestDoorWall(room, walls);
      if (!wall) return null;

      const mid = wallMidpoint(wall);

      return {
        id: `door-${room.id}`,
        label: index === 0 ? "Main Door" : "Door",
        x: mid.x,
        z: mid.z,
        width: index === 0 ? 4 : 3,
        height: 2.4,
        rotation: wallAngle(wall),
        floor: room.floor,
        layer: "ARCHITECTURE",
      } satisfies CadDoor;
    })
    .filter(Boolean) as CadDoor[];
}
