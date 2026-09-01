export type CadLayer = "ARCHITECTURE" | "FIRE_ALARM" | "CCTV" | "SECURITY" | "ACCESS";

export type CadRoom = {
  id: string;
  label: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  height: number;
  stories: number;
  floor: number;
  shape: "RECTANGLE";
  layer: CadLayer;
};

export type CadWall = {
  floor?: number;
  storyHeight?: number;

  id: string;
  start: { x: number; z: number };
  end: { x: number; z: number };
  height: number;
  thickness?: number;
  label?: string;
  layer: CadLayer;
};

export type CadDoor = {
  id: string;
  label: string;
  x: number;
  z: number;
  width: number;
  height: number;
  rotation: number;
  floor: number;
  layer: CadLayer;
};

export type CadWindow = {
  id: string;
  label: string;
  x: number;
  z: number;
  width: number;
  height: number;
  sillHeight: number;
  rotation: number;
  floor: number;
  storyHeight: number;
  layer: CadLayer;
};

export type CadStair = {
  id: string;
  label: string;
  x: number;
  z: number;
  width: number;
  depth: number;
  floor: number;
  stories: number;
  storyHeight: number;
  rotation: number;
  layer: CadLayer;
};

export type CadDevice = {
  id: string;
  label: string;
  type: string;
  x: number;
  z: number;
  y?: number;
  floor: number;
  storyHeight: number;
  wallMounted?: boolean;
  layer: CadLayer;
};

export type CadBuildingModel = {
  stories: number;
  rooms: CadRoom[];
  walls: CadWall[];
  doors: CadDoor[];
  windows: CadWindow[];
  stairs: CadStair[];
  devices: CadDevice[];
};
