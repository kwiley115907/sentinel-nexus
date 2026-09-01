"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";

type Device = {
  id: string;
  tag: string;
  type: string;
  x: number;
  y: number;
};

type WireRun = {
  id: string;
  fromId: string;
  toId: string;
};

export default function BlueprintStudioPage() {
  const [image, setImage] = useState<string>("");
  const [devices, setDevices] = useState<Device[]>([]);
  const [wireRuns, setWireRuns] = useState<WireRun[]>([]);
  const [scaleFeet, setScaleFeet] = useState(1);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  useEffect(() => {
    setImage(localStorage.getItem("alarm-core-blueprint") || "");
    setDevices(JSON.parse(localStorage.getItem("alarm-core-devices") || "[]"));
    setWireRuns(JSON.parse(localStorage.getItem("alarm-core-wire-runs") || "[]"));
  }, []);

  useEffect(() => {
    localStorage.setItem("alarm-core-blueprint", image);
    localStorage.setItem("alarm-core-devices", JSON.stringify(devices));
    localStorage.setItem("alarm-core-wire-runs", JSON.stringify(wireRuns));
  }, [image, devices, wireRuns]);

  const deviceMap = useMemo(
    () => new Map(devices.map((device) => [device.id, device])),
    [devices],
  );

  function uploadBlueprint(file: File) {
    const reader = new FileReader();

    reader.onload = () => {
      setImage(String(reader.result));
    };

    reader.readAsDataURL(file);
  }

  function addDevice() {
    const nextNumber = devices.length + 1;

    setDevices([
      ...devices,
      {
        id: Math.random().toString(36).substring(2, 15),
        tag: `DEV-${String(nextNumber).padStart(3, "0")}`,
        type: "SMOKE_DETECTOR",
        x: 50,
        y: 50,
      },
    ]);
  }

  function updateDevicePosition(id: string, x: number, y: number) {
    setDevices((current) =>
      current.map((device) =>
        device.id === id
          ? {
              ...device,
              x: Math.max(0, Math.min(100, x)),
              y: Math.max(0, Math.min(100, y)),
            }
          : device,
      ),
    );
  }

  function addWireRun(toId: string) {
    if (!selectedDeviceId || selectedDeviceId === toId) {
      setSelectedDeviceId(toId);
      return;
    }

    setWireRuns([
      ...wireRuns,
      {
        id: Math.random().toString(36).substring(2, 15),
        fromId: selectedDeviceId,
        toId,
      },
    ]);

    setSelectedDeviceId("");
  }

  function calculateFeet(from: Device, to: Device) {
    const dx = from.x - to.x;
    const dy = from.y - to.y;
    const blueprintUnits = Math.sqrt(dx * dx + dy * dy);

    return Math.round(blueprintUnits * scaleFeet);
  }

  return (
    <AppShell>
      <h1 className="text-4xl font-black text-yellow-300">
        Blueprint Studio
      </h1>

      <section className="mt-6 grid gap-4 rounded-[2rem] acp-card/85 p-5 md:grid-cols-4">
        <input
          type="file"
          accept="image/*"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) uploadBlueprint(file);
          }}
          className="rounded-xl bg-[#2b1a12]/80 p-3"
        />

        <input
          type="number"
          value={scaleFeet}
          onChange={(event) => setScaleFeet(Number(event.target.value))}
          className="rounded-xl bg-[#2b1a12]/80 p-3"
          placeholder="Feet per blueprint unit"
        />

        <button
          onClick={addDevice}
          className="rounded-xl acp-button p-3 font-black text-[#3a2418]"
        >
          Add Device
        </button>

        <button
          onClick={() => {
            setImage("");
            setDevices([]);
            setWireRuns([]);
          }}
          className="rounded-xl acp-danger p-3 font-black"
        >
          Clear
        </button>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
        <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] acp-card/85">
          {image ? (
            <img
              src={image}
              alt="Uploaded blueprint"
              className="h-full w-full object-contain"
            />
          ) : (
            <div className="flex h-[420px] items-center justify-center text-yellow-100/60">
              Upload a blueprint image
            </div>
          )}

          <svg className="pointer-events-none absolute inset-0 h-full w-full">
            {wireRuns.map((run) => {
              const from = deviceMap.get(run.fromId);
              const to = deviceMap.get(run.toId);

              if (!from || !to) return null;

              return (
                <line
                  key={run.id}
                  x1={`${from.x}%`}
                  y1={`${from.y}%`}
                  x2={`${to.x}%`}
                  y2={`${to.y}%`}
                  stroke="#facc15"
                  strokeWidth="4"
                  strokeDasharray="8 6"
                />
              );
            })}
          </svg>

          {devices.map((device) => (
            <button
              key={device.id}
              draggable
              onClick={() => addWireRun(device.id)}
              onDragEnd={(event) => {
                const box = event.currentTarget.parentElement?.getBoundingClientRect();
                if (!box) return;

                const x = ((event.clientX - box.left) / box.width) * 100;
                const y = ((event.clientY - box.top) / box.height) * 100;

                updateDevicePosition(device.id, x, y);
              }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-2 text-xs font-black shadow-xl ${
                selectedDeviceId === device.id
                  ? "acp-button text-[#3a2418]"
                  : "acp-danger text-white"
              }`}
              style={{
                left: `${device.x}%`,
                top: `${device.y}%`,
              }}
            >
              {device.tag}
            </button>
          ))}
        </div>

        <div className="space-y-5">
          <div className="rounded-[2rem] acp-card/85 p-5">
            <h2 className="text-2xl font-black text-yellow-300">Devices</h2>

            <div className="mt-4 space-y-3">
              {devices.map((device) => (
                <div key={device.id} className="rounded-2xl bg-[#2b1a12]/80 p-4">
                  <input
                    value={device.tag}
                    onChange={(event) =>
                      setDevices((current) =>
                        current.map((item) =>
                          item.id === device.id
                            ? { ...item, tag: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className="w-full rounded-xl acp-card/85 p-2 font-bold"
                  />

                  <select
                    value={device.type}
                    onChange={(event) =>
                      setDevices((current) =>
                        current.map((item) =>
                          item.id === device.id
                            ? { ...item, type: event.target.value }
                            : item,
                        ),
                      )
                    }
                    className="mt-2 w-full rounded-xl acp-card/85 p-2"
                  >
                    <option>SMOKE_DETECTOR</option>
                    <option>HEAT_DETECTOR</option>
                    <option>PULL_STATION</option>
                    <option>HORN_STROBE</option>
                    <option>CAMERA</option>
                    <option>FIRE_PANEL</option>
                    <option>NVR</option>
                  </select>

                  <p className="mt-2 text-sm text-yellow-100/60">
                    Position: {device.x.toFixed(1)}%, {device.y.toFixed(1)}%
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[2rem] acp-card/85 p-5">
            <h2 className="text-2xl font-black text-yellow-300">Wire Runs</h2>
            <p className="mt-2 text-sm text-yellow-100/70">
              Click one device, then click another device to create a wire run.
            </p>

            <div className="mt-4 space-y-3">
              {wireRuns.map((run) => {
                const from = deviceMap.get(run.fromId);
                const to = deviceMap.get(run.toId);

                if (!from || !to) return null;

                return (
                  <div key={run.id} className="rounded-2xl bg-[#2b1a12]/80 p-4">
                    <p className="font-bold">
                      {from.tag} → {to.tag}
                    </p>
                    <p className="text-yellow-300">
                      Estimated length: {calculateFeet(from, to)} ft
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
