"use client";

import { useCallback, useMemo, useState } from "react";

import type {
  SentinelBuilderApplyResult,
  SentinelBuilderCommand,
} from "@/lib/sentinel-builder/SentinelBuilderTypes";

import type {
  EditableCadModel,
  EditableCadObject,
  EditableDoor,
  EditableWall,
  EditableWindow,
  TransformMode,
} from "./EditableCadTypes";

type Vec3Update = {
  x?: number;
  y?: number;
  z?: number;
  rotation?: number;
};

type Point2D = {
  x: number;
  z: number;
};

type CadHistoryEntry = {
  id: string;
  label: string;
  model: EditableCadModel;
  createdAt: string;
};

const SAFE_OBJECT_PATCH_FIELDS = new Set([
  "x",
  "y",
  "z",
  "rotation",
  "floor",
  "label",
  "name",
  "width",
  "height",
  "depth",
  "size",
  "length",
  "deviceType",
  "type",
  "address",
  "circuitId",
  "roomId",
  "status",
  "start",
  "end",
]);

function wallLength(wall: EditableWall) {
  return Math.hypot(
    wall.end.x - wall.start.x,
    wall.end.z - wall.start.z,
  );
}

function pointAlongWall(wall: EditableWall, offset = 0.5) {
  const t = Math.max(0.05, Math.min(0.95, offset));

  return {
    x: wall.start.x + (wall.end.x - wall.start.x) * t,
    z: wall.start.z + (wall.end.z - wall.start.z) * t,
  };
}

function wallRotation(wall: EditableWall) {
  return Math.atan2(
    wall.end.z - wall.start.z,
    wall.end.x - wall.start.x,
  );
}

function updateAttachedDoor(
  door: EditableDoor,
  wall: EditableWall,
): EditableDoor {
  if (door.wallId !== wall.id) return door;

  const point = pointAlongWall(
    wall,
    door.offsetAlongWall ?? 0.5,
  );

  return {
    ...door,
    x: point.x,
    z: point.z,
    rotation: wallRotation(wall),
  };
}

function updateAttachedWindow(
  windowItem: EditableWindow,
  wall: EditableWall,
): EditableWindow {
  if (windowItem.wallId !== wall.id) return windowItem;

  const point = pointAlongWall(
    wall,
    windowItem.offsetAlongWall ?? 0.5,
  );

  return {
    ...windowItem,
    x: point.x,
    z: point.z,
    rotation: wallRotation(wall),
  };
}

function isFiniteNumber(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

function isPoint2D(value: unknown): value is Point2D {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return false;
  }

  const point = value as Record<string, unknown>;

  return (
    isFiniteNumber(point.x) &&
    isFiniteNumber(point.z)
  );
}

function positiveInteger(
  value: unknown,
  fallback: number,
) {
  if (!isFiniteNumber(value)) {
    return fallback;
  }

  return Math.max(
    1,
    Math.round(value),
  );
}

function positiveNumber(
  value: unknown,
  fallback: number,
) {
  if (!isFiniteNumber(value)) {
    return fallback;
  }

  return Math.max(
    0.1,
    value,
  );
}

/**
 * Removes fields that Sentinel is not permitted to overwrite.
 *
 * In particular, AI commands cannot replace:
 * - id
 * - objectType
 * - wallId
 * - offsetAlongWall
 *
 * Wall attachment fields must be changed through the dedicated
 * attachDoorToWall and attachWindowToWall editor operations.
 */
function sanitizeObjectPatch(
  payload: Record<string, unknown>,
) {
  const patch: Record<string, unknown> = {};

  for (
    const [key, value]
    of Object.entries(payload)
  ) {
    if (!SAFE_OBJECT_PATCH_FIELDS.has(key)) {
      continue;
    }

    patch[key] = value;
  }

  return patch;
}

function updateObjectInModel(
  model: EditableCadModel,
  targetId: string,
  payload: Record<string, unknown>,
): {
  model: EditableCadModel;
  found: boolean;
} {
  const patch = sanitizeObjectPatch(payload);

  let found = false;

  const rooms = model.rooms.map((room) => {
    if (room.id !== targetId) {
      return room;
    }

    found = true;

    return {
      ...room,
      ...patch,
      id: room.id,
      objectType: "ROOM" as const,
      floor: positiveInteger(
        patch.floor,
        room.floor,
      ),
    };
  });

  let changedWall: EditableWall | null = null;

  const walls = model.walls.map((wall) => {
    if (wall.id !== targetId) {
      return wall;
    }

    found = true;

    const nextStart = isPoint2D(patch.start)
      ? patch.start
      : wall.start;

    const nextEnd = isPoint2D(patch.end)
      ? patch.end
      : wall.end;

    const updatedWall: EditableWall = {
      ...wall,
      ...patch,
      id: wall.id,
      objectType: "WALL",
      floor: positiveInteger(
        patch.floor,
        wall.floor,
      ),
      start: nextStart,
      end: nextEnd,
    };

    changedWall = updatedWall;

    return updatedWall;
  });

  const doors = model.doors.map((door) => {
    if (door.id !== targetId) {
      return door;
    }

    found = true;

    return {
      ...door,
      ...patch,
      id: door.id,
      objectType: "DOOR" as const,
      floor: positiveInteger(
        patch.floor,
        door.floor,
      ),
    };
  });

  const windows = model.windows.map((windowItem) => {
    if (windowItem.id !== targetId) {
      return windowItem;
    }

    found = true;

    return {
      ...windowItem,
      ...patch,
      id: windowItem.id,
      objectType: "WINDOW" as const,
      floor: positiveInteger(
        patch.floor,
        windowItem.floor,
      ),
    };
  });

  const stairs = model.stairs.map((stair) => {
    if (stair.id !== targetId) {
      return stair;
    }

    found = true;

    return {
      ...stair,
      ...patch,
      id: stair.id,
      objectType: "STAIR" as const,
      floor: positiveInteger(
        patch.floor,
        stair.floor,
      ),
    };
  });

  const devices = model.devices.map((device) => {
    if (device.id !== targetId) {
      return device;
    }

    found = true;

    return {
      ...device,
      ...patch,
      id: device.id,
      objectType: "DEVICE" as const,
      floor: positiveInteger(
        patch.floor,
        device.floor,
      ),
    };
  });

  if (!found) {
    return {
      model,
      found: false,
    };
  }

  if (changedWall) {
    return {
      found: true,

      model: {
        ...model,
        rooms,
        walls,

        doors: doors.map((door) =>
          updateAttachedDoor(
            door,
            changedWall as EditableWall,
          ),
        ),

        windows: windows.map((windowItem) =>
          updateAttachedWindow(
            windowItem,
            changedWall as EditableWall,
          ),
        ),

        stairs,
        devices,
      },
    };
  }

  return {
    found: true,

    model: {
      ...model,
      rooms,
      walls,
      doors,
      windows,
      stairs,
      devices,
    },
  };
}

function deleteObjectFromModel(
  model: EditableCadModel,
  targetId: string,
): {
  model: EditableCadModel;
  found: boolean;
} {
  const beforeCount =
    model.rooms.length +
    model.walls.length +
    model.doors.length +
    model.windows.length +
    model.stairs.length +
    model.devices.length;

  const nextModel: EditableCadModel = {
    ...model,

    rooms:
      model.rooms.filter(
        (item) => item.id !== targetId,
      ),

    walls:
      model.walls.filter(
        (item) => item.id !== targetId,
      ),

    doors:
      model.doors.filter(
        (item) =>
          item.id !== targetId &&
          item.wallId !== targetId,
      ),

    windows:
      model.windows.filter(
        (item) =>
          item.id !== targetId &&
          item.wallId !== targetId,
      ),

    stairs:
      model.stairs.filter(
        (item) => item.id !== targetId,
      ),

    devices:
      model.devices.filter(
        (item) => item.id !== targetId,
      ),
  };

  const afterCount =
    nextModel.rooms.length +
    nextModel.walls.length +
    nextModel.doors.length +
    nextModel.windows.length +
    nextModel.stairs.length +
    nextModel.devices.length;

  return {
    model:
      beforeCount === afterCount
        ? model
        : nextModel,

    found:
      beforeCount !== afterCount,
  };
}

export function useCadEditor(
  initialModel: EditableCadModel,
) {
  
  const [model, setModel] =
    useState(initialModel);

  const [undoStack, setUndoStack] =
    useState<CadHistoryEntry[]>([]);

  const [redoStack, setRedoStack] =
    useState<CadHistoryEntry[]>([]);

  const [selectedId, setSelectedId] =
    useState("");

  const [activeFloor, setActiveFloor] =
    useState<number | "ALL">("ALL");

  const [transformMode, setTransformMode] =
    useState<TransformMode>("translate");

  const [devicesVisible, setDevicesVisible] =
    useState(false);

  const objects =
    useMemo<EditableCadObject[]>(
      () => [
        ...model.rooms,
        ...model.walls,
        ...model.doors,
        ...model.windows,
        ...model.stairs,
        ...model.devices,
      ],
      [model],
    );

  const selectedObject = useMemo(
    () =>
      objects.find(
        (object) =>
          object.id === selectedId,
      ) ?? null,
    [objects, selectedId],
  );

  const isFloorVisible = useCallback(
    (floor: number) =>
      activeFloor === "ALL" ||
      activeFloor === floor,
    [activeFloor],
  );

  const selectObject =
    useCallback((id: string) => {
      setSelectedId(id);
    }, []);

  const deselect =
    useCallback(() => {
      setSelectedId("");
    }, []);

  const deleteSelected =
    useCallback(() => {
      if (!selectedId) return;

      setModel((current) =>
        deleteObjectFromModel(
          current,
          selectedId,
        ).model,
      );

      setSelectedId("");
    }, [selectedId]);

  const moveRoom = useCallback(
    (
      id: string,
      update: Vec3Update,
    ) => {
      setModel((current) => ({
        ...current,

        rooms:
          current.rooms.map((room) =>
            room.id === id
              ? {
                  ...room,
                  x:
                    update.x ??
                    room.x,
                  z:
                    update.z ??
                    room.z,
                }
              : room,
          ),
      }));
    },
    [],
  );

  const moveDoor = useCallback(
    (
      id: string,
      update: Vec3Update,
    ) => {
      setModel((current) => ({
        ...current,

        doors:
          current.doors.map((door) =>
            door.id === id
              ? {
                  ...door,
                  x:
                    update.x ??
                    door.x,
                  z:
                    update.z ??
                    door.z,
                  rotation:
                    update.rotation ??
                    door.rotation,

                  wallId:
                    undefined,

                  offsetAlongWall:
                    undefined,
                }
              : door,
          ),
      }));
    },
    [],
  );

  const moveWindow = useCallback(
    (
      id: string,
      update: Vec3Update,
    ) => {
      setModel((current) => ({
        ...current,

        windows:
          current.windows.map(
            (windowItem) =>
              windowItem.id === id
                ? {
                    ...windowItem,
                    x:
                      update.x ??
                      windowItem.x,
                    z:
                      update.z ??
                      windowItem.z,
                    rotation:
                      update.rotation ??
                      windowItem.rotation,

                    wallId:
                      undefined,

                    offsetAlongWall:
                      undefined,
                  }
                : windowItem,
          ),
      }));
    },
    [],
  );

  const moveStair = useCallback(
    (
      id: string,
      update: Vec3Update,
    ) => {
      setModel((current) => ({
        ...current,

        stairs:
          current.stairs.map((stair) =>
            stair.id === id
              ? {
                  ...stair,
                  x:
                    update.x ??
                    stair.x,
                  z:
                    update.z ??
                    stair.z,
                  rotation:
                    update.rotation ??
                    stair.rotation,
                }
              : stair,
          ),
      }));
    },
    [],
  );

  const moveDevice = useCallback(
    (
      id: string,
      update: Vec3Update,
    ) => {
      setModel((current) => ({
        ...current,

        devices:
          current.devices.map(
            (device) =>
              device.id === id
                ? {
                    ...device,
                    x:
                      update.x ??
                      device.x,
                    z:
                      update.z ??
                      device.z,
                    y:
                      update.y ??
                      device.y,
                  }
                : device,
          ),
      }));
    },
    [],
  );

  const moveWall = useCallback(
    (
      id: string,
      start: Point2D,
      end: Point2D,
    ) => {
      setModel((current) => {
        const nextWalls =
          current.walls.map((wall) =>
            wall.id === id
              ? {
                  ...wall,
                  start,
                  end,
                }
              : wall,
          );

        const movedWall =
          nextWalls.find(
            (wall) => wall.id === id,
          );

        if (!movedWall) {
          return current;
        }

        return {
          ...current,
          walls: nextWalls,

          doors:
            current.doors.map((door) =>
              updateAttachedDoor(
                door,
                movedWall,
              ),
            ),

          windows:
            current.windows.map(
              (windowItem) =>
                updateAttachedWindow(
                  windowItem,
                  movedWall,
                ),
            ),
        };
      });
    },
    [],
  );

  const attachDoorToWall =
    useCallback(
      (
        doorId: string,
        wallId: string,
        offset = 0.5,
      ) => {
        setModel((current) => {
          const wall =
            current.walls.find(
              (item) =>
                item.id === wallId,
            );

          if (
            !wall ||
            wallLength(wall) <= 0
          ) {
            return current;
          }

          return {
            ...current,

            doors:
              current.doors.map(
                (door) => {
                  if (
                    door.id !== doorId
                  ) {
                    return door;
                  }

                  return updateAttachedDoor(
                    {
                      ...door,
                      wallId,

                      offsetAlongWall:
                        offset,

                      floor:
                        wall.floor,
                    },
                    wall,
                  );
                },
              ),
          };
        });
      },
      [],
    );

  const attachWindowToWall =
    useCallback(
      (
        windowId: string,
        wallId: string,
        offset = 0.5,
      ) => {
        setModel((current) => {
          const wall =
            current.walls.find(
              (item) =>
                item.id === wallId,
            );

          if (
            !wall ||
            wallLength(wall) <= 0
          ) {
            return current;
          }

          return {
            ...current,

            windows:
              current.windows.map(
                (windowItem) => {
                  if (
                    windowItem.id !==
                    windowId
                  ) {
                    return windowItem;
                  }

                  return updateAttachedWindow(
                    {
                      ...windowItem,
                      wallId,

                      offsetAlongWall:
                        offset,

                      floor:
                        wall.floor,
                    },
                    wall,
                  );
                },
              ),
          };
        });
      },
      [],
    );

  /**
   * Applies a validated Sentinel command plan as a single CAD-state
   * transaction.
   *
   * This first version deliberately rejects CREATE commands until the
   * exact BuildingGeometry object constructors have been connected.
   */
  
  const commitModel = useCallback(
    (
      nextModel: 
  EditableCadModel,
      label: string,
    ) => {
      setUndoStack(current => [
        ...current.slice(-49),
        {
          id: `history-${Date.now()}`,
          label,
          model,
          createdAt: new Date().toISOString(),
        },
      ]);

      setRedoStack([]);
      setModel(nextModel);
    },
    [model],
  );

  const undo = useCallback(() => {
    const previous =
      undoStack[undoStack.length - 1];

    if (!previous) {
      return false;
    }

    setRedoStack(current => [
      ...current.slice(-49),
      {
        id: `history-${Date.now()}`,
        label: previous.label,
        model,
        createdAt: new Date().toISOString(),
      },
    ]);

    setModel(previous.model);

     setUndoStack(current =>
      current.slice(0, -1),
    );

    setSelectedId("");

    return true;
  }, [model, undoStack]);

  const redo = useCallback(() => {
    const next =
  
  redoStack[redoStack.length - 1];

    if (!next) {
      return false;
    }

    setUndoStack(current => [
      ...current.slice(-49),
      {
        id: `history-${Date.now()}`,
        label: next.label,
        model,
        createdAt: new Date().toISOString(),
      },
    ]);

    setModel(next.model);

    setRedoStack(current =>
      current.slice(0, -1),
    );

    setSelectedId("");

    return true;
  }, [model, redoStack]);
  
  const applySentinelCommands =
    useCallback(
      (
        commands: SentinelBuilderCommand[],
      ): SentinelBuilderApplyResult => {
        let nextModel = model;

        const appliedCommandIds:
          string[] = [];

        const rejectedCommandIds:
          string[] = [];

        const errors:
          SentinelBuilderApplyResult["errors"] =
          [];

        let requestedFloor:
          number | "ALL" | null = null;

        for (const command of commands) {
          try {
            switch (command.action) {
              case "MOVE_OBJECT":
              case "ROTATE_OBJECT":
              case "RESIZE_OBJECT":
              case "UPDATE_OBJECT": {
                if (!command.targetId) {
                  throw new Error(
                    "A targetId is required.",
                  );
                }

                const result =
                  updateObjectInModel(
                    nextModel,
                    command.targetId,
                    command.payload,
                  );

                if (!result.found) {
                  throw new Error(
                    `CAD object was not found: ${command.targetId}`,
                  );
                }

                nextModel = result.model;

                appliedCommandIds.push(
                  command.id,
                );

                break;
              }

              case "DELETE_OBJECT": {
                if (!command.targetId) {
                  throw new Error(
                    "A targetId is required.",
                  );
                }

                const result =
                  deleteObjectFromModel(
                    nextModel,
                    command.targetId,
                  );

                if (!result.found) {
                  throw new Error(
                    `CAD object was not found: ${command.targetId}`,
                  );
                }

                nextModel = result.model;

                appliedCommandIds.push(
                  command.id,
                );

                break;
              }

              case "UPDATE_STORY": {
                nextModel = {
                  ...nextModel,

                  stories:
                    positiveInteger(
                      command.payload
                        .stories,
                      nextModel.stories,
                    ),

                  storyHeight:
                    positiveNumber(
                      command.payload
                        .storyHeight,
                      nextModel
                        .storyHeight,
                    ),
                };

                appliedCommandIds.push(
                  command.id,
                );

                break;
              }

              case "SET_ACTIVE_STORY": {
                const requested =
                  command.payload.floor;

                if (
                  requested === "ALL"
                ) {
                  requestedFloor =
                    "ALL";
                } else if (
                  isFiniteNumber(
                    requested,
                  )
                ) {
                  requestedFloor =
                    positiveInteger(
                      requested,
                      1,
                    );
                } else {
                  throw new Error(
                    "SET_ACTIVE_STORY requires payload.floor as a number or ALL.",
                  );
                }

                appliedCommandIds.push(
                  command.id,
                );

                break;
              }

              case "FLAG_CONFLICT": {
                // This command reports a conflict but does not mutate CAD state.
                appliedCommandIds.push(
                  command.id,
                );

                break;
              }

              case "CREATE_OBJECT":
              case "CREATE_STORY":
              case "CREATE_ROOM":
              case "CREATE_WALL":
              case "CREATE_OPENING":
              case "CREATE_DEVICE":
              case "ASSIGN_DEVICE_TO_CIRCUIT":
              case "CREATE_WIRE_RUN":
              case "UPDATE_WIRE_RUN": {
                throw new Error(
                  `${command.action} is not enabled in the first safe integration stage.`,
                );
              }

              default: {
                throw new Error(
                  `Unsupported Sentinel command: ${String(command.action)}`,
                );
              }
            }
          } catch (error) {
            rejectedCommandIds.push(
              command.id,
            );

            errors.push({
              commandId:
                command.id,

              message:
                error instanceof Error
                  ? error.message
                  : "Unknown command error.",
            });
          }
        }

        if (
          appliedCommandIds.length > 0
        ) {
          commitModel(
            nextModel,
            `Sentinel AI — $
          {commands.length} approved
          change(s)`,
          );
          if (requestedFloor !== null) {
            setActiveFloor(
              requestedFloor,
            );
          }

          if (
            selectedId &&
            ![
              ...nextModel.rooms,
              ...nextModel.walls,
              ...nextModel.doors,
              ...nextModel.windows,
              ...nextModel.stairs,
              ...nextModel.devices,
            ].some(
              (object) =>
                object.id ===
                selectedId,
            )
          ) {
            setSelectedId("");
          }
        }

        return {
          success:
            rejectedCommandIds.length ===
            0,

          appliedCommandIds,
          rejectedCommandIds,
          errors,
        };
      },
      [
        model,
        selectedId,
      ],
    );

  return {
    model,
    setModel,
    objects,

    selectedId,
    selectedObject,

    activeFloor,
    transformMode,
    devicesVisible,

    setActiveFloor,
    setTransformMode,
    setDevicesVisible,

    undo,
    redo,

    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,

    undoLabel:
      undoStack.at(-1)?.label ?? null,

    redoLabel:
      redoStack.at(-1)?.label ?? null,
    selectObject,
    deselect,
    deleteSelected,

    isFloorVisible,

    moveRoom,
    moveWall,
    moveDoor,
    moveWindow,
    moveStair,
    moveDevice,

    attachDoorToWall,
    attachWindowToWall,

    applySentinelCommands,
  };
}
