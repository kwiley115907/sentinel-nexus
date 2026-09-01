import type {
  CadLayer,
} from "@/components/cad/geometry/BuildingGeometry";

export type SentinelBuilderAction =
  | "CREATE_OBJECT"
  | "UPDATE_OBJECT"
  | "DELETE_OBJECT"
  | "MOVE_OBJECT"
  | "ROTATE_OBJECT"
  | "RESIZE_OBJECT"
  | "CREATE_STORY"
  | "UPDATE_STORY"
  | "SET_ACTIVE_STORY"
  | "UPDATE_BUILDING"
  | "SET_ACTIVE_FLOOR"
  | "CREATE_ROOM"
  | "CREATE_WALL"
  | "CREATE_OPENING"
  | "CREATE_DOOR"
  | "CREATE_WINDOW"
  | "CREATE_STAIR"
  | "CREATE_DEVICE"
  | "ATTACH_DOOR_TO_WALL"
  | "ATTACH_WINDOW_TO_WALL"
  | "ASSIGN_DEVICE_TO_CIRCUIT"
  | "CREATE_CIRCUIT"
  | "UPDATE_CIRCUIT"
  | "CREATE_WIRE_RUN"
  | "UPDATE_WIRE_RUN"
  | "FLAG_CONFLICT";

export type SentinelBuilderCommand = {
  id: string;
  action: SentinelBuilderAction;
  targetId?: string;
  objectType?: string;
  payload: Record<string, unknown>;
  reason?: string;
  confidence?: number;
  requiresApproval: boolean;
};

export type SentinelBuilderWarning = {
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
  relatedObjectIds?: string[];
};

export type SentinelBuilderPlan = {
  requestId: string;
  mode:
    | "inspection"
    | "planning"
    | "generation"
    | "comparison"
    | "fire-alarm";
  summary: string;
  requiresApproval: boolean;
  commands: SentinelBuilderCommand[];
  warnings: SentinelBuilderWarning[];
  missingInformation: string[];
};

export type SentinelBuilderConflict = {
  id: string;
  code: string;
  severity: "info" | "warning" | "critical";
  message: string;
  relatedObjectIds: string[];
  recommendedAction?: string;
};

export type SentinelInspectionResult = {
  requestId: string;
  summary: string;
  conflicts: SentinelBuilderConflict[];
  warnings: SentinelBuilderWarning[];

  /**
   * Inspection is always read-only.
   */
  commands: [];
};

export type SentinelBuilderApplyResult = {
  success: boolean;
  appliedCommandIds: string[];
  rejectedCommandIds: string[];
  errors: Array<{
    commandId: string;
    message: string;
  }>;
};

export type SentinelCircuit = {
  id: string;
  label: string;
  type: "SLC" | "NAC" | "IDC" | "POWER" | "NETWORK";
  sourceId?: string;
  terminal?: string;
  floor?: number;
  status: "proposed" | "verified" | "installed" | "tested";
};

export type SentinelWireRun = {
  id: string;
  circuitId: string;
  startObjectId: string;
  endObjectId: string;
  intermediateObjectIds: string[];
  estimatedLength: number;
  status: "proposed" | "verified" | "installed" | "tested";
};

export type SentinelCreationDefaults = {
  layer: CadLayer;
  floor: number;
  storyHeight: number;
};
