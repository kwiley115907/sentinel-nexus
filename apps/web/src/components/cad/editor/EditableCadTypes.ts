import type {
  CadBuildingModel,
  CadDevice,
  CadDoor,
  CadRoom,
  CadStair,
  CadWall,
  CadWindow,
} from "@/components/cad/geometry/BuildingGeometry";

export type CadObjectType =
  | "ROOM"
  | "WALL"
  | "DOOR"
  | "WINDOW"
  | "STAIR"
  | "DEVICE";

export type TransformMode = "translate" | "rotate" | "scale";

export type EditableRoom = CadRoom & {
  objectType: "ROOM";
};

export type EditableWall = CadWall & {
  objectType: "WALL";
  floor: number;
};

export type EditableDoor = CadDoor & {
  objectType: "DOOR";
  wallId?: string;
  offsetAlongWall?: number;
};

export type EditableWindow = CadWindow & {
  objectType: "WINDOW";
  wallId?: string;
  offsetAlongWall?: number;
};

export type EditableStair = CadStair & {
  objectType: "STAIR";
};

export type EditableDevice = CadDevice & {
  objectType: "DEVICE";
};

export type EditableCadObject =
  | EditableRoom
  | EditableWall
  | EditableDoor
  | EditableWindow
  | EditableStair
  | EditableDevice;

export type EditableCadModel = {
  stories: number;
  storyHeight: number;
  rooms: EditableRoom[];
  walls: EditableWall[];
  doors: EditableDoor[];
  windows: EditableWindow[];
  stairs: EditableStair[];
  devices: EditableDevice[];
};

function inferWallFloor(wall: CadWall) {
  const match = wall.id.match(/(?:^|-|_)f(\d+)(?:-|_|$)/i);
  return match ? Math.max(1, Number(match[1])) : 1;
}

export function toEditableCadModel(
  model: CadBuildingModel,
  storyHeight = 3,
): EditableCadModel {
  return {
    stories: Math.max(1, model.stories || 1),
    storyHeight,
    rooms: model.rooms.map((room) => ({
      ...room,
      objectType: "ROOM",
      floor: Math.max(1, room.floor || 1),
    })),
    walls: model.walls.map((wall) => ({
      ...wall,
      objectType: "WALL",
      floor: inferWallFloor(wall),
    })),
    doors: model.doors.map((door) => ({
      ...door,
      objectType: "DOOR",
      floor: Math.max(1, door.floor || 1),
    })),
    windows: model.windows.map((windowItem) => ({
      ...windowItem,
      objectType: "WINDOW",
      floor: Math.max(1, windowItem.floor || 1),
    })),
    stairs: model.stairs.map((stair) => ({
      ...stair,
      objectType: "STAIR",
      floor: Math.max(1, stair.floor || 1),
    })),
    devices: model.devices.map((device) => ({
      ...device,
      objectType: "DEVICE",
      floor: Math.max(1, device.floor || 1),
    })),
  };
}

export function fromEditableCadModel(
  model: EditableCadModel,
): CadBuildingModel {
  return {
    stories: model.stories,
    rooms: model.rooms.map(({ objectType: _objectType, ...room }) => room),
    walls: model.walls.map(
      ({ objectType: _objectType, floor: _floor, ...wall }) => wall,
    ),
    doors: model.doors.map(
      ({ objectType: _objectType, wallId: _wallId, offsetAlongWall: _offset, ...door }) =>
        door,
    ),
    windows: model.windows.map(
      ({
        objectType: _objectType,
        wallId: _wallId,
        offsetAlongWall: _offset,
        ...windowItem
      }) => windowItem,
    ),
    stairs: model.stairs.map(({ objectType: _objectType, ...stair }) => stair),
    devices: model.devices.map(({ objectType: _objectType, ...device }) => device),
  };
}

export function floorElevation(floor: number, storyHeight: number) {
  return Math.max(0, floor - 1) * storyHeight;
}
