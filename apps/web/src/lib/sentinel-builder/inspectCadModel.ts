import type {
  EditableCadModel,
  EditableCadObject,
} from "@/components/cad/editor/EditableCadTypes";

import type {
  SentinelBuilderConflict,
  SentinelInspectionResult,
} from "./SentinelBuilderTypes";

function allObjects(
  model: EditableCadModel,
): EditableCadObject[] {
  return [
    ...model.rooms,
    ...model.walls,
    ...model.doors,
    ...model.windows,
    ...model.stairs,
    ...model.devices,
  ];
}

function duplicateIds(
  objects: EditableCadObject[],
) {
  const counts = new Map<string, number>();

  for (const object of objects) {
    counts.set(
      object.id,
      (counts.get(object.id) ?? 0) + 1,
    );
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([id]) => id);
}

function isFiniteNumber(value: unknown) {
  return (
    typeof value === "number" &&
    Number.isFinite(value)
  );
}

export function inspectCadModel(
  model: EditableCadModel,
): SentinelInspectionResult {
  const objects = allObjects(model);

  const conflicts: SentinelBuilderConflict[] = [];

  const duplicateObjectIds =
    duplicateIds(objects);

  if (duplicateObjectIds.length > 0) {
    conflicts.push({
      id: "CONFLICT-DUPLICATE-IDS",
      code: "DUPLICATE_OBJECT_IDS",
      severity: "critical",
      message:
        `${duplicateObjectIds.length} duplicate CAD object ID(s) were found.`,
      relatedObjectIds:
        duplicateObjectIds,
      recommendedAction:
        "Assign every CAD object a unique ID before applying AI changes.",
    });
  }

  const objectsAboveStoryCount =
    objects.filter(
      object =>
        object.floor > model.stories,
    );

  if (objectsAboveStoryCount.length > 0) {
    conflicts.push({
      id: "CONFLICT-OBJECT-ABOVE-STORIES",
      code: "OBJECT_ABOVE_STORY_COUNT",
      severity: "critical",
      message:
        `${objectsAboveStoryCount.length} object(s) are assigned above the declared ${model.stories}-story building.`,
      relatedObjectIds:
        objectsAboveStoryCount.map(
          object => object.id,
        ),
      recommendedAction:
        "Verify whether the building story count or object floor assignments are incorrect.",
    });
  }

  const objectsBelowFloorOne =
    objects.filter(
      object => object.floor < 1,
    );

  if (objectsBelowFloorOne.length > 0) {
    conflicts.push({
      id: "CONFLICT-INVALID-FLOOR",
      code: "INVALID_FLOOR_NUMBER",
      severity: "critical",
      message:
        `${objectsBelowFloorOne.length} object(s) have a floor number below 1.`,
      relatedObjectIds:
        objectsBelowFloorOne.map(
          object => object.id,
        ),
    });
  }

  const invalidRooms =
    model.rooms.filter(
      room =>
        !isFiniteNumber(room.x) ||
        !isFiniteNumber(room.z) ||
        room.width <= 0 ||
        room.depth <= 0 ||
        room.height <= 0,
    );

  if (invalidRooms.length > 0) {
    conflicts.push({
      id: "CONFLICT-INVALID-ROOMS",
      code: "INVALID_ROOM_GEOMETRY",
      severity: "critical",
      message:
        `${invalidRooms.length} room(s) contain invalid coordinates or dimensions.`,
      relatedObjectIds:
        invalidRooms.map(room => room.id),
    });
  }

  const invalidWalls =
    model.walls.filter(wall => {
      const length = Math.hypot(
        wall.end.x - wall.start.x,
        wall.end.z - wall.start.z,
      );

      return (
        !Number.isFinite(length) ||
        length <= 0 ||
        wall.height <= 0 ||
        (wall.thickness !== undefined &&
          wall.thickness <= 0)
      );
    });

  if (invalidWalls.length > 0) {
    conflicts.push({
      id: "CONFLICT-INVALID-WALLS",
      code: "INVALID_WALL_GEOMETRY",
      severity: "critical",
      message:
        `${invalidWalls.length} wall(s) have zero length or invalid dimensions.`,
      relatedObjectIds:
        invalidWalls.map(wall => wall.id),
    });
  }

  const wallIds =
    new Set(
      model.walls.map(wall => wall.id),
    );

  const detachedDoors =
    model.doors.filter(
      door =>
        door.wallId &&
        !wallIds.has(door.wallId),
    );

  if (detachedDoors.length > 0) {
    conflicts.push({
      id: "CONFLICT-MISSING-DOOR-WALL",
      code: "DOOR_REFERENCES_MISSING_WALL",
      severity: "warning",
      message:
        `${detachedDoors.length} attached door(s) reference walls that do not exist.`,
      relatedObjectIds:
        detachedDoors.map(door => door.id),
    });
  }

  const detachedWindows =
    model.windows.filter(
      windowItem =>
        windowItem.wallId &&
        !wallIds.has(windowItem.wallId),
    );

  if (detachedWindows.length > 0) {
    conflicts.push({
      id: "CONFLICT-MISSING-WINDOW-WALL",
      code: "WINDOW_REFERENCES_MISSING_WALL",
      severity: "warning",
      message:
        `${detachedWindows.length} attached window(s) reference walls that do not exist.`,
      relatedObjectIds:
        detachedWindows.map(
          windowItem => windowItem.id,
        ),
    });
  }

  const stairsInOneStoryBuilding =
    model.stories === 1
      ? model.stairs.filter(
          stair => stair.stories > 1,
        )
      : [];

  if (
    stairsInOneStoryBuilding.length > 0
  ) {
    conflicts.push({
      id: "CONFLICT-STAIR-STORY-MISMATCH",
      code: "STAIR_STORY_MISMATCH",
      severity: "critical",
      message:
        `${stairsInOneStoryBuilding.length} stair object(s) indicate multiple stories while the building declares one story.`,
      relatedObjectIds:
        stairsInOneStoryBuilding.map(
          stair => stair.id,
        ),
      recommendedAction:
        "Verify whether the stair should be removed or the building should contain another story.",
    });
  }

  return {
    requestId:
      `inspection-${Date.now()}`,

    summary:
      conflicts.length === 0
        ? "No deterministic CAD conflicts were detected."
        : `${conflicts.length} CAD conflict group(s) were detected.`,

    conflicts,
    warnings: [],
    commands: [],
  };
}
