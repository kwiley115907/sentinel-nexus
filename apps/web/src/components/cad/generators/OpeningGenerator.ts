import type { CadDoor, CadRoom, CadWall, CadWindow } from "@/components/cad/geometry/BuildingGeometry";

function wallAngle(wall: CadWall) {
  return Math.atan2(wall.end.z - wall.start.z, wall.end.x - wall.start.x);
}

function wallMidpoint(wall: CadWall) {
  return {
    x: (wall.start.x + wall.end.x) / 2,
    z: (wall.start.z + wall.end.z) / 2,
  };
}

function wallLength(wall: CadWall) {
  return Math.hypot(wall.end.x - wall.start.x, wall.end.z - wall.start.z);
}

function roomFromWallId(wallId: string, rooms: CadRoom[]) {
  return rooms.find((room) => wallId.includes(room.id));
}

export function generateDoorOpenings(rooms: CadRoom[], walls: CadWall[]): CadDoor[] {
  const exteriorWalls = walls.filter((wall) => wall.label === "Exterior Wall");

  return rooms.flatMap((room, index) => {
    const wall =
      exteriorWalls.find((item) => item.id.includes(room.id) && item.id.includes("south")) ||
      exteriorWalls.find((item) => item.id.includes(room.id) && item.id.includes("north"));

    if (!wall) return [];

    const mid = wallMidpoint(wall);

    return [
      {
        id: `door-${room.id}`,
        label: index === 0 ? "Main Door" : "Door",
        x: mid.x,
        z: mid.z,
        width: index === 0 ? 4 : 3,
        height: 2.4,
        rotation: wallAngle(wall),
        floor: 1,
        layer: "ARCHITECTURE",
      },
    ];
  });
}

export function generateWindowOpenings(rooms: CadRoom[], walls: CadWall[], stories: number): CadWindow[] {
  const exteriorWalls = walls.filter((wall) => wall.label === "Exterior Wall" && wallLength(wall) >= 3);

  return exteriorWalls.flatMap((wall) => {
    const room = roomFromWallId(wall.id, rooms);
    if (!room) return [];

    const mid = wallMidpoint(wall);
    const angle = wallAngle(wall);
    const windows: CadWindow[] = [];

    for (let floor = 1; floor <= Math.max(1, stories); floor++) {
      windows.push({
        id: `window-${wall.id}-f${floor}`,
        label: `Window F${floor}`,
        x: mid.x,
        z: mid.z,
        width: Math.min(4, Math.max(2, wallLength(wall) * 0.45)),
        height: 1.1,
        sillHeight: 1.2,
        rotation: angle,
        floor,
        storyHeight: room.height,
        layer: "ARCHITECTURE",
      });
    }

    return windows;
  });
}
