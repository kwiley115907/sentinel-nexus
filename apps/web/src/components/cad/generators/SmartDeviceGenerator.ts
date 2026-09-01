import type { CadDevice, CadDoor, CadRoom } from "@/components/cad/geometry/BuildingGeometry";

function roomNeedsPullStation(label: string) {
  const text = label.toLowerCase();
  return (
    text.includes("lobby") ||
    text.includes("corridor") ||
    text.includes("entry") ||
    text.includes("exit")
  );
}

function roomNeedsExtraSmoke(label: string) {
  const text = label.toLowerCase();
  return (
    text.includes("storage") ||
    text.includes("mechanical") ||
    text.includes("electrical") ||
    text.includes("it")
  );
}

export function generateSmartFireAlarmDevices({
  rooms,
  doors,
}: {
  rooms: CadRoom[];
  doors: CadDoor[];
}): CadDevice[] {
  const devices: CadDevice[] = [];

  for (const room of rooms) {
    for (let floor = 1; floor <= Math.max(1, room.stories); floor++) {
      devices.push({
        id: `sd-${room.id}-center-f${floor}`,
        label: "SD",
        type: "SMOKE_DETECTOR",
        x: room.x,
        z: room.z,
        floor,
        storyHeight: room.height,
        layer: "FIRE_ALARM",
      });

      if (room.width * room.depth > 80 || roomNeedsExtraSmoke(room.label)) {
        devices.push({
          id: `sd-${room.id}-extra-f${floor}`,
          label: "SD",
          type: "SMOKE_DETECTOR",
          x: room.x + room.width * 0.25,
          z: room.z + room.depth * 0.25,
          floor,
          storyHeight: room.height,
          layer: "FIRE_ALARM",
        });
      }

      devices.push({
        id: `hs-${room.id}-wall-f${floor}`,
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

      if (roomNeedsPullStation(room.label)) {
        const nearestDoor = doors.find((door) => door.id.includes(room.id));

        devices.push({
          id: `ps-${room.id}-f${floor}`,
          label: "PS",
          type: "PULL_STATION",
          x: nearestDoor ? nearestDoor.x + 0.45 : room.x - room.width / 2 + 0.5,
          z: nearestDoor ? nearestDoor.z + 0.45 : room.z - room.depth / 2 + 0.5,
          y: (floor - 1) * room.height + 1.2,
          floor,
          storyHeight: room.height,
          wallMounted: true,
          layer: "FIRE_ALARM",
        });
      }
    }
  }

  const lobby = rooms.find((room) => room.label.toLowerCase().includes("lobby")) ?? rooms[0];

  if (lobby) {
    devices.push({
      id: "facp-main",
      label: "FACP",
      type: "FIRE_ALARM_CONTROL_PANEL",
      x: lobby.x - lobby.width / 2 + 0.5,
      z: lobby.z,
      y: 1.4,
      floor: 1,
      storyHeight: lobby.height,
      wallMounted: true,
      layer: "FIRE_ALARM",
    });
  }

  return devices;
}
