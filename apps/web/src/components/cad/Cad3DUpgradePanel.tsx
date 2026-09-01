"use client";

export type UpgradeAction =
  | "MOVE_GIZMO"
  | "ROTATE_GIZMO"
  | "RESIZE_GIZMO"
  | "SNAP_TOGGLE"
  | "FLOOR_UP"
  | "FLOOR_DOWN"
  | "MEASURE"
  | "FIRST_PERSON"
  | "IMPORT_PLAN";

export default function Cad3DUpgradePanel({
  currentFloor,
  snapEnabled,
  onAction,
}: {
  currentFloor: number;
  snapEnabled: boolean;
  onAction: (action: UpgradeAction) => void;
}) {
  return (
    <div className="rounded-2xl border border-yellow-400/30 bg-black/20 p-4">
      <h2 className="text-xl font-black text-yellow-300">3D Tools</h2>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button onClick={() => onAction("MOVE_GIZMO")} className="rounded-xl bg-yellow-400 p-3 font-black text-black">Move</button>
        <button onClick={() => onAction("ROTATE_GIZMO")} className="rounded-xl bg-yellow-400 p-3 font-black text-black">Rotate</button>
        <button onClick={() => onAction("RESIZE_GIZMO")} className="rounded-xl bg-yellow-400 p-3 font-black text-black">Resize</button>
        <button onClick={() => onAction("SNAP_TOGGLE")} className="rounded-xl bg-blue-700 p-3 font-black text-white">{snapEnabled ? "Snap ON" : "Snap OFF"}</button>
        <button onClick={() => onAction("FLOOR_DOWN")} className="rounded-xl bg-purple-700 p-3 font-black text-white">Floor -</button>
        <button onClick={() => onAction("FLOOR_UP")} className="rounded-xl bg-purple-700 p-3 font-black text-white">Floor +</button>
        <button onClick={() => onAction("MEASURE")} className="rounded-xl bg-green-600 p-3 font-black text-white">Measure</button>
        <button onClick={() => onAction("FIRST_PERSON")} className="rounded-xl bg-green-600 p-3 font-black text-white">Walk</button>
        <button onClick={() => onAction("IMPORT_PLAN")} className="col-span-2 rounded-xl bg-red-700 p-3 font-black text-white">Import PDF/DXF</button>
      </div>

      <p className="mt-4 rounded-xl bg-black/30 p-3 text-yellow-100">
        Current Floor: {currentFloor}
      </p>
    </div>
  );
}
