export type BuilderCommandAction =
  | "CREATE_OBJECT"
  | "UPDATE_OBJECT"
  | "DELETE_OBJECT"
  | "MOVE_OBJECT"
  | "ROTATE_OBJECT"
  | "RESIZE_OBJECT"
  | "CREATE_STORY"
  | "UPDATE_STORY"
  | "CREATE_ROOM"
  | "CREATE_WALL"
  | "CREATE_OPENING"
  | "CREATE_DEVICE"
  | "ASSIGN_DEVICE_TO_CIRCUIT"
  | "CREATE_WIRE_RUN"
  | "UPDATE_WIRE_RUN"
  | "SET_ACTIVE_STORY"
  | "FLAG_CONFLICT";

export type BuilderCommand = {
  id: string;
  action: BuilderCommandAction;
  targetId?: string;
  objectType?: string;
  payload: Record<string, unknown>;
  reason?: string;
  confidence?: number;
  requiresApproval?: boolean;
};

export type BuilderCommandPlan = {
  requestId: string;
  summary: string;
  requiresApproval: boolean;
  commands: BuilderCommand[];
  warnings: string[];
  missingInformation: string[];
};

export type BuilderProjectContext = {
  projectId?: string;
  projectName?: string;
  buildingId?: string;
  buildingName?: string;
  activeStoryId?: string;
  activeStoryName?: string;
  drawingSheet?: string;
  drawingRevision?: string;

  stories: unknown[];
  rooms: unknown[];
  walls: unknown[];
  openings: unknown[];
  devices: unknown[];
  circuits: unknown[];
  wireRuns: unknown[];
  selectedObjectIds: string[];
};
