"use client";

type BuilderUpgradePanelProps = {
  selectedName: string;
  currentFloor: number;
  snapEnabled: boolean;
  gridSize: string;
  onAction: (action: string, value?: string) => void;
};

export default function BuilderUpgradePanel({
  selectedName,
  currentFloor,
  snapEnabled,
  gridSize,
  onAction,
}: BuilderUpgradePanelProps) {
  const tools = [
    ["select", "Select"],
    ["wall", "Wall"],
    ["door", "Door"],
    ["window", "Window"],
    ["room", "Room"],
    ["measure", "Measure"],
    ["device", "Device"],
    ["clear", "Clear"],
  ];

  return (
    <div className="grid gap-4 rounded-2xl border border-yellow-400/30 bg-black/25 p-4">
      <section className="rounded-xl border border-yellow-400/30 bg-black/30 p-3">
        <p className="text-lg font-black text-yellow-300">How To Use Builder</p>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-yellow-100">
          <li>Click <b>Room</b>, then click the canvas to place a room.</li>
          <li>Click <b>Select</b>, then click a room/device to edit it.</li>
          <li>Use <b>Properties Panel</b> to type exact dimensions.</li>
          <li>Use <b>Wall</b>, <b>Door</b>, <b>Window</b>, and <b>Device</b> to build the plan.</li>
          <li>Use <b>Measure</b> to check distances.</li>
          <li>Use <b>Export PDF</b> when finished.</li>
        </ol>
      </section>
      <section>
        <p className="font-black text-yellow-300">1. Quick CAD Toolbar</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {tools.map(([action, label]) => (
            <button
              key={action}
              type="button"
              onClick={() => onAction(action)}
              className="rounded-lg bg-yellow-400 px-2 py-1 text-xs font-black text-black"
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="font-black text-yellow-300">2. Properties Panel</p>
        <div className="mt-2 grid gap-2 rounded-xl bg-black/30 p-3 text-sm">
          <p>Selected: {selectedName || "Nothing selected"}</p>
          <input
            placeholder="Width / Length: 25'6&quot;"
            className="rounded-lg bg-black/40 p-2"
            onBlur={(event) => onAction("set-width", event.target.value)}
          />
          <input
            placeholder="Depth: 40'0&quot;"
            className="rounded-lg bg-black/40 p-2"
            onBlur={(event) => onAction("set-depth", event.target.value)}
          />
          <input
            placeholder="Height: 12'0&quot;"
            className="rounded-lg bg-black/40 p-2"
            onBlur={(event) => onAction("set-height", event.target.value)}
          />
        </div>
      </section>

      <section>
        <p className="font-black text-yellow-300">3. Floor Manager</p>
        <div className="mt-2 grid grid-cols-3 gap-2">
          <button type="button" onClick={() => onAction("remove-floor")} className="rounded-lg bg-red-700 p-2 text-xs font-black">
            - Floor
          </button>
          <div className="rounded-lg bg-black/30 p-2 text-center text-xs font-black">
            Floor {currentFloor}
          </div>
          <button type="button" onClick={() => onAction("add-floor")} className="rounded-lg bg-green-700 p-2 text-xs font-black">
            + Floor
          </button>
        </div>
      </section>

      <section>
        <p className="font-black text-yellow-300">4. Building Wizard</p>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {["Hospital", "School", "Warehouse", "Data Center", "Airport", "Office"].map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onAction("wizard", type)}
              className="rounded-lg bg-purple-700 px-2 py-1 text-xs font-black"
            >
              {type}
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="font-black text-yellow-300">5. Snap Grid Controls</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {["1in", "6in", "12in", "24in"].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => onAction("grid-size", size)}
              className="rounded-lg bg-black/30 p-2 text-xs font-black"
            >
              {size}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => onAction("toggle-snap")}
          className="mt-2 w-full rounded-lg bg-blue-700 p-2 text-xs font-black"
        >
          Snap: {snapEnabled ? "ON" : "OFF"} / Grid: {gridSize}
        </button>
      </section>

      <section>
        <p className="font-black text-yellow-300">6. Object Tree</p>
        <div className="mt-2 rounded-xl bg-black/30 p-3 text-xs">
          <p>Building</p>
          <p className="ml-4">├─ Floor {currentFloor}</p>
          <p className="ml-8">├─ Rooms</p>
          <p className="ml-8">├─ Walls</p>
          <p className="ml-8">└─ Devices</p>
        </div>
      </section>

      <section>
        <p className="font-black text-yellow-300">7. Measurement Tool</p>
        <button
          type="button"
          onClick={() => onAction("measure")}
          className="mt-2 w-full rounded-lg bg-green-700 p-2 text-xs font-black"
        >
          Measure Distance
        </button>
      </section>

      <section>
        <p className="font-black text-yellow-300">8. Building Statistics</p>
        <div className="mt-2 rounded-xl bg-black/30 p-3 text-xs">
          <p>Area: Auto-calculate next</p>
          <p>Perimeter: Auto-calculate next</p>
          <p>Devices: Auto-count next</p>
        </div>
      </section>
    </div>
  );
}
