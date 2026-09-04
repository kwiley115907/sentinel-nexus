"use client";

import { useState } from "react";

type Props = {
  title?: string;
  blueprint: unknown;
  onRoomsGenerated?: (
    rooms: any[],
    fullResponse?: any,
    prompt?: string,
  ) => void;
  onDevicesGenerated?: (devices: any[]) => void;
};

type InspectionSeverity =
  | "info"
  | "warning"
  | "critical";

type InspectionIssue = {
  code: string;
  severity: InspectionSeverity;
  message: string;
  objectIds?: string[];
};

type BlueprintRecord = {
  rooms?: any[];
  walls?: any[];
  doors?: any[];
  windows?: any[];
  stairs?: any[];
  devices?: any[];
  wires?: any[];
  currentFloor?: number;
  stories?: number;
};

const quickPrompts = [
  "Create a 2 story school with classrooms, bathrooms, office, cafeteria, gym, stairs, doors, and windows",
  "Create a hospital with ER, exam rooms, nurse station, bathrooms, stairs, doors, and windows",
  "Add stairs and second floor access",
  "Place fire alarm devices: smoke detectors, pull stations, horn strobes, and control panel",
  "Review this blueprint for fire alarm coverage",
  "Create material takeoff for devices, wire, backboxes, and panels",
];

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function asArray(value: unknown): any[] {
  return Array.isArray(value) ? value : [];
}

function finiteNumber(value: unknown): number | null {
  const numberValue = Number(value);

  return Number.isFinite(numberValue)
    ? numberValue
    : null;
}

function objectId(
  item: unknown,
  fallback: string,
): string {
  if (!isRecord(item)) {
    return fallback;
  }

  const id = item.id;

  return typeof id === "string" && id.trim()
    ? id
    : fallback;
}

function runLocalInspection(
  blueprint: unknown,
) {
  const source: BlueprintRecord =
    isRecord(blueprint)
      ? {
          rooms: asArray(blueprint.rooms),
          walls: asArray(blueprint.walls),
          doors: asArray(blueprint.doors),
          windows: asArray(blueprint.windows),
          stairs: asArray(blueprint.stairs),
          devices: asArray(blueprint.devices),
          wires: asArray(blueprint.wires),
          currentFloor:
            finiteNumber(
              blueprint.currentFloor,
            ) ?? undefined,
          stories:
            finiteNumber(
              blueprint.stories,
            ) ?? undefined,
        }
      : {};

  const rooms = source.rooms ?? [];
  const walls = source.walls ?? [];
  const doors = source.doors ?? [];
  const windows = source.windows ?? [];
  const stairs = source.stairs ?? [];
  const devices = source.devices ?? [];
  const wires = source.wires ?? [];

  const collections = [
    { name: "room", items: rooms },
    { name: "wall", items: walls },
    { name: "door", items: doors },
    { name: "window", items: windows },
    { name: "stair", items: stairs },
    { name: "device", items: devices },
    { name: "wire", items: wires },
  ];

  const issues: InspectionIssue[] = [];

  const allObjects = collections.flatMap(
    collection =>
      collection.items.map(
        (item, index) => ({
          type: collection.name,
          item,
          id: objectId(
            item,
            `${collection.name}-${index}`,
          ),
        }),
      ),
  );

  const idCounts =
    new Map<string, number>();

  for (const object of allObjects) {
    idCounts.set(
      object.id,
      (idCounts.get(object.id) ?? 0) + 1,
    );
  }

  const duplicateIds =
    [...idCounts.entries()]
      .filter(([, count]) => count > 1)
      .map(([id]) => id);

  if (duplicateIds.length > 0) {
    issues.push({
      code: "DUPLICATE_OBJECT_IDS",
      severity: "critical",
      message:
        `${duplicateIds.length} duplicate object ID(s) were detected.`,
      objectIds: duplicateIds,
    });
  }

  const invalidRooms = rooms
    .map((room, index) => ({
      room,
      id: objectId(room, `room-${index}`),
    }))
    .filter(({ room }) => {
      if (!isRecord(room)) {
        return true;
      }

      const x = finiteNumber(room.x);
      const z = finiteNumber(room.z);
      const width = finiteNumber(room.width);
      const depth = finiteNumber(room.depth);
      const height = finiteNumber(room.height);

      return (
        x === null ||
        z === null ||
        width === null ||
        depth === null ||
        height === null ||
        width <= 0 ||
        depth <= 0 ||
        height <= 0
      );
    });

  if (invalidRooms.length > 0) {
    issues.push({
      code: "INVALID_ROOM_GEOMETRY",
      severity: "critical",
      message:
        `${invalidRooms.length} room(s) contain invalid coordinates or dimensions.`,
      objectIds:
        invalidRooms.map(item => item.id),
    });
  }

  const invalidWalls = walls
    .map((wall, index) => ({
      wall,
      id: objectId(wall, `wall-${index}`),
    }))
    .filter(({ wall }) => {
      if (!isRecord(wall)) {
        return true;
      }

      if (
        !isRecord(wall.start) ||
        !isRecord(wall.end)
      ) {
        return true;
      }

      const startX =
        finiteNumber(wall.start.x);
      const startZ =
        finiteNumber(wall.start.z);
      const endX =
        finiteNumber(wall.end.x);
      const endZ =
        finiteNumber(wall.end.z);
      const height =
        finiteNumber(wall.height);

      if (
        startX === null ||
        startZ === null ||
        endX === null ||
        endZ === null ||
        height === null ||
        height <= 0
      ) {
        return true;
      }

      return (
        Math.hypot(
          endX - startX,
          endZ - startZ,
        ) <= 0
      );
    });

  if (invalidWalls.length > 0) {
    issues.push({
      code: "INVALID_WALL_GEOMETRY",
      severity: "critical",
      message:
        `${invalidWalls.length} wall(s) have invalid geometry or zero length.`,
      objectIds:
        invalidWalls.map(item => item.id),
    });
  }

  const declaredStories =
    Math.max(
      1,
      finiteNumber(source.stories) ?? 1,
      ...rooms.map(room => {
        if (!isRecord(room)) {
          return 1;
        }

        return Math.max(
          1,
          finiteNumber(room.stories) ?? 1,
        );
      }),
    );

  const invalidFloorObjects =
    allObjects.filter(({ item }) => {
      if (!isRecord(item)) {
        return false;
      }

      if (item.floor === undefined) {
        return false;
      }

      const floor =
        finiteNumber(item.floor);

      return (
        floor === null ||
        floor < 1 ||
        floor > declaredStories
      );
    });

  if (invalidFloorObjects.length > 0) {
    issues.push({
      code: "INVALID_FLOOR_ASSIGNMENT",
      severity: "critical",
      message:
        `${invalidFloorObjects.length} object(s) are assigned outside floors 1 through ${declaredStories}.`,
      objectIds:
        invalidFloorObjects.map(
          object => object.id,
        ),
    });
  }

  const stairStoryConflicts =
    stairs
      .map((stair, index) => ({
        stair,
        id: objectId(
          stair,
          `stair-${index}`,
        ),
      }))
      .filter(({ stair }) => {
        if (!isRecord(stair)) {
          return false;
        }

        const stairStories =
          finiteNumber(stair.stories) ?? 1;

        return (
          declaredStories === 1 &&
          stairStories > 1
        );
      });

  if (stairStoryConflicts.length > 0) {
    issues.push({
      code: "STAIR_STORY_MISMATCH",
      severity: "critical",
      message:
        `${stairStoryConflicts.length} stair object(s) indicate upper-floor access in a one-story building.`,
      objectIds:
        stairStoryConflicts.map(
          item => item.id,
        ),
    });
  }

  const wallIds =
    new Set(
      walls.map((wall, index) =>
        objectId(wall, `wall-${index}`),
      ),
    );

  const missingWallReferences = [
    ...doors.map((door, index) => ({
      item: door,
      id: objectId(
        door,
        `door-${index}`,
      ),
    })),
    ...windows.map((windowItem, index) => ({
      item: windowItem,
      id: objectId(
        windowItem,
        `window-${index}`,
      ),
    })),
  ].filter(({ item }) => {
    if (!isRecord(item)) {
      return false;
    }

    if (
      typeof item.wallId !== "string" ||
      !item.wallId
    ) {
      return false;
    }

    return !wallIds.has(item.wallId);
  });

  if (missingWallReferences.length > 0) {
    issues.push({
      code: "MISSING_WALL_REFERENCE",
      severity: "warning",
      message:
        `${missingWallReferences.length} door or window object(s) reference walls that do not exist.`,
      objectIds:
        missingWallReferences.map(
          item => item.id,
        ),
    });
  }

  const deviceIds =
    new Set(
      devices.map((device, index) =>
        objectId(
          device,
          `device-${index}`,
        ),
      ),
    );

  const invalidWires =
    wires
      .map((wire, index) => ({
        wire,
        id: objectId(
          wire,
          `wire-${index}`,
        ),
      }))
      .filter(({ wire }) => {
        if (!isRecord(wire)) {
          return true;
        }

        const fromId =
          typeof wire.fromId === "string"
            ? wire.fromId
            : "";

        const toId =
          typeof wire.toId === "string"
            ? wire.toId
            : "";

        return (
          !fromId ||
          !toId ||
          !deviceIds.has(fromId) ||
          !deviceIds.has(toId)
        );
      });

  if (invalidWires.length > 0) {
    issues.push({
      code: "INVALID_WIRE_REFERENCE",
      severity: "warning",
      message:
        `${invalidWires.length} wire(s) reference missing devices or incomplete endpoints.`,
      objectIds:
        invalidWires.map(item => item.id),
    });
  }

  if (
    devices.length === 0 &&
    rooms.length > 0
  ) {
    issues.push({
      code: "NO_FIRE_ALARM_DEVICES",
      severity: "warning",
      message:
        "The model contains rooms but no fire-alarm devices.",
    });
  }

  const summary = {
    mode: "read-only-inspection",
    changedModel: false,
    counts: {
      rooms: rooms.length,
      walls: walls.length,
      doors: doors.length,
      windows: windows.length,
      stairs: stairs.length,
      devices: devices.length,
      wires: wires.length,
    },
    declaredStories,
    currentFloor:
      source.currentFloor ?? 1,
    issueCount: issues.length,
    criticalCount:
      issues.filter(
        issue =>
          issue.severity === "critical",
      ).length,
    warningCount:
      issues.filter(
        issue =>
          issue.severity === "warning",
      ).length,
    issues,
  };

  return summary;
}

export default function SentinelAiPanel({
  title = "Sentinel Nexus AI",
  blueprint,
  onRoomsGenerated,
  onDevicesGenerated,
}: Props) {
  const [prompt, setPrompt] =
    useState("");

  const [result, setResult] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  function inspectLocally() {
    const inspection =
      runLocalInspection(blueprint);

    setResult(
      JSON.stringify(
        inspection,
        null,
        2,
      ),
    );
  }

  async function send(
    requestType: string,
    customPrompt = prompt,
  ) {
    setLoading(true);
    setResult(
      "Sentinel AI is working...",
    );

    try {
      const response =
        await fetch("/api/ai/gateway", {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            requestType,
            prompt: customPrompt,
            blueprint,
          }),
        });

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "AI request failed.",
        );
      }

      if (Array.isArray(data.rooms)) {
        // Whole-building generation: onRoomsGenerated already derives its
        // own correctly-positioned devices from the new room layout. The
        // raw data.devices from this same response were never checked
        // against THAT layout (only against whatever rooms existed before
        // this response arrived), so applying both doubled up devices and
        // scattered a copy of them wherever the AI's raw, unnormalized
        // coordinates happened to land.
        onRoomsGenerated?.(
          data.rooms,
          data,
          customPrompt,
        );
      } else if (Array.isArray(data.devices)) {
        onDevicesGenerated?.(
          data.devices,
        );
      }

      setResult(
        JSON.stringify(
          data,
          null,
          2,
        ),
      );
    } catch (error) {
      setResult(
        error instanceof Error
          ? error.message
          : "AI failed.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-yellow-400/30 bg-black/20 p-4 backdrop-blur-sm">
      <h2 className="text-xl font-black text-yellow-300">
        {title}
      </h2>

      <textarea
        value={prompt}
        onChange={event =>
          setPrompt(event.target.value)
        }
        placeholder="Example: Create a 2 story school with rooms, stairs, doors, windows, and fire alarm devices."
        className="mt-3 min-h-24 w-full rounded-xl bg-black/30 p-3 text-yellow-100"
      />

      <div className="mt-3 grid gap-2">
        {quickPrompts.map(item => (
          <button
            key={item}
            type="button"
            onClick={() => {
              setPrompt(item);

              const lowerPrompt =
                item.toLowerCase();

              const requestType =
                lowerPrompt.includes(
                  "place fire alarm",
                )
                  ? "device-placement"
                  : lowerPrompt.includes(
                        "review",
                      )
                    ? "blueprint-review"
                    : lowerPrompt.includes(
                          "material",
                        )
                      ? "material-estimate"
                      : "blueprint-generator";

              void send(
                requestType,
                item,
              );
            }}
            className="rounded-xl bg-black/30 p-2 text-left text-xs font-bold text-yellow-100"
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={inspectLocally}
          className="col-span-2 rounded-xl bg-cyan-700 p-2 text-xs font-black text-white"
        >
          Inspect Current Plan
        </button>

        <button
          type="button"
          onClick={() =>
            send(
              "blueprint-generator",
            )
          }
          className="rounded-xl bg-yellow-400 p-2 text-xs font-black text-black"
        >
          Generate Building
        </button>

        <button
          type="button"
          onClick={() =>
            send(
              "device-placement",
            )
          }
          className="rounded-xl bg-green-700 p-2 text-xs font-black text-white"
        >
          Place Devices
        </button>

        <button
          type="button"
          onClick={() =>
            send("blueprint-review")
          }
          className="rounded-xl bg-blue-700 p-2 text-xs font-black text-white"
        >
          AI Review
        </button>

        <button
          type="button"
          onClick={() =>
            send("fire-code")
          }
          className="rounded-xl bg-red-700 p-2 text-xs font-black text-white"
        >
          Fire Code
        </button>

        <button
          type="button"
          onClick={() =>
            send(
              "material-estimate",
            )
          }
          className="col-span-2 rounded-xl bg-purple-700 p-2 text-xs font-black text-white"
        >
          Estimate Materials
        </button>
      </div>

      <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap rounded-xl bg-black/40 p-3 text-xs text-yellow-100">
        {loading
          ? "Loading..."
          : result}
      </pre>
    </section>
  );
}
