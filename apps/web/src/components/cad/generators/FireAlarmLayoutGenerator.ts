export type FireAlarmDevice = {
  id: string;
  label: string;
  type: string;
  x: number;
  z: number;
  y?: number;
  floor: number;
  storyHeight: number;
  wallMounted?: boolean;
  layer: "FIRE_ALARM";
};

export function generateFireAlarmLayout(
  rooms: Array<{
    id: string;
    label: string;
    x: number;
    z: number;
    width: number;
    depth: number;
    height: number;
    stories: number;
  }>,
): FireAlarmDevice[] {
  return rooms.flatMap((room) => {
    const devices: FireAlarmDevice[] = [];

    for (let floor = 1; floor <= Math.max(1, room.stories); floor++) {
      devices.push({
        id: `sd-${room.id}-f${floor}`,
        label: "SD",
        type: "SMOKE_DETECTOR",
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
        x: room.x + room.width / 2 - 0.5,
        z: room.z,
        y: (floor - 1) * room.height + 2.2,
        floor,
        storyHeight: room.height,
        wallMounted: true,
        layer: "FIRE_ALARM",
      });

      if (room.label.toLowerCase().includes("lobby") || room.label.toLowerCase().includes("corridor")) {
        devices.push({
          id: `ps-${room.id}-f${floor}`,
          label: "PS",
          type: "PULL_STATION",
          x: room.x - room.width / 2 + 0.5,
          z: room.z - room.depth / 2 + 0.5,
          y: (floor - 1) * room.height + 1.3,
          floor,
          storyHeight: room.height,
          wallMounted: true,
          layer: "FIRE_ALARM",
        });
      }
    }

    return devices;
  });
}
