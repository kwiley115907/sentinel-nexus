"use client";

export type CadSelectionKind =
  | "ROOM"
  | "WALL"
  | "DOOR"
  | "WINDOW"
  | "STAIR"
  | "DEVICE"
  | "DIMENSION"
  | "";

export type CadSelection = {
  id: string;
  kind: CadSelectionKind;
};

export function clearCadSelection({
  setSelectedId,
  setSelectedKind,
  setSelectedBlockIndex,
  setSelectedDimension,
  setDraggingId,
  setResizeDrag,
}: {
  setSelectedId: (value: string) => void;
  setSelectedKind?: (value: CadSelectionKind) => void;
  setSelectedBlockIndex?: (value: number | null) => void;
  setSelectedDimension?: (value: unknown | null) => void;
  setDraggingId?: (value: string) => void;
  setResizeDrag?: (value: unknown | null) => void;
}) {
  setSelectedId("");
  setSelectedKind?.("");
  setSelectedBlockIndex?.(null);
  setSelectedDimension?.(null);
  setDraggingId?.("");
  setResizeDrag?.(null);
}

export function selectCadObject({
  id,
  kind,
  setSelectedId,
  setSelectedKind,
}: {
  id: string;
  kind: CadSelectionKind;
  setSelectedId: (value: string) => void;
  setSelectedKind?: (value: CadSelectionKind) => void;
}) {
  setSelectedId(id);
  setSelectedKind?.(kind);
}

export default function SelectionManager() {
  return null;
}
