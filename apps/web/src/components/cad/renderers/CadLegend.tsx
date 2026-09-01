"use client";

export default function CadLegend() {
  return (
    <div className="pointer-events-none absolute left-4 top-4 z-20 rounded-2xl border border-yellow-400/40 bg-black/80 p-4 text-xs font-black text-yellow-100 shadow-2xl">
      <div className="mb-2 text-yellow-300">CAD LEGEND</div>
      <div>🟨 Exterior / Interior Walls</div>
      <div>🟦 Windows</div>
      <div>🟧 Doors</div>
      <div>🟥 Horn/Strobe / Pull</div>
      <div>🟡 Smoke Detector</div>
      <div>🟩 Dimensions</div>
      <div className="mt-2 text-[10px] text-yellow-100/70">
        ESC = Deselect · DELETE = Remove
      </div>
    </div>
  );
}
