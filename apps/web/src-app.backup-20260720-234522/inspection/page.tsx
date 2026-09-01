"use client";

import AppShell from "@/components/AppShell";
import { useEffect, useMemo, useState } from "react";

type TestResult = "UNTESTED" | "PASS" | "FAIL";

type Device = {
  id: string;
  tag: string;
  type: string;
  status?: string;
  notes?: string;
};

type InspectionRecord = {
  deviceId: string;
  result: TestResult;
  notes: string;
};

type ProjectFile = {
  devices: Device[];
};

export default function InspectionPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [records, setRecords] = useState<InspectionRecord[]>([]);

  useEffect(() => {
    const project = JSON.parse(localStorage.getItem("alarm-core-project") || '{"devices":[]}') as ProjectFile;
    setDevices(project.devices || []);
    setRecords(JSON.parse(localStorage.getItem("alarm-core-inspection") || "[]"));
  }, []);

  useEffect(() => {
    localStorage.setItem("alarm-core-inspection", JSON.stringify(records));
  }, [records]);

  const summary = useMemo(() => {
    return {
      total: devices.length,
      passed: records.filter((record) => record.result === "PASS").length,
      failed: records.filter((record) => record.result === "FAIL").length,
      untested: devices.length - records.filter((record) => record.result !== "UNTESTED").length,
    };
  }, [devices, records]);

  function getRecord(deviceId: string) {
    return records.find((record) => record.deviceId === deviceId) || {
      deviceId,
      result: "UNTESTED" as TestResult,
      notes: "",
    };
  }

  function updateRecord(deviceId: string, patch: Partial<InspectionRecord>) {
    setRecords((current) => {
      const existing = current.find((record) => record.deviceId === deviceId);

      if (!existing) {
        return [...current, { deviceId, result: "UNTESTED", notes: "", ...patch }];
      }

      return current.map((record) =>
        record.deviceId === deviceId ? { ...record, ...patch } : record,
      );
    });
  }

  return (
    <AppShell>
      <h1 className="text-4xl font-black text-yellow-300">Inspection Mode</h1>

      <section className="mt-6 grid gap-4 md:grid-cols-4">
        <Stat label="Total" value={summary.total} />
        <Stat label="Passed" value={summary.passed} />
        <Stat label="Failed" value={summary.failed} />
        <Stat label="Untested" value={summary.untested} />
      </section>

      <section className="mt-6 grid gap-4">
        {devices.map((device) => {
          const record = getRecord(device.id);

          return (
            <div key={device.id} className="rounded-[2rem] acp-card/85 p-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div>
                  <h2 className="text-2xl font-black">{device.tag}</h2>
                  <p className="text-yellow-300">{device.type}</p>
                </div>

                <select
                  value={record.result}
                  onChange={(event) =>
                    updateRecord(device.id, { result: event.target.value as TestResult })
                  }
                  className="rounded-xl bg-[#2b1a12]/80 p-3"
                >
                  <option>UNTESTED</option>
                  <option>PASS</option>
                  <option>FAIL</option>
                </select>
              </div>

              <textarea
                value={record.notes}
                onChange={(event) => updateRecord(device.id, { notes: event.target.value })}
                placeholder="Inspection notes / deficiency"
                className="mt-4 w-full rounded-xl bg-[#2b1a12]/80 p-3"
              />
            </div>
          );
        })}
      </section>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[2rem] acp-card/85 p-5">
      <p className="text-yellow-100/70">{label}</p>
      <p className="text-4xl font-black text-yellow-300">{value}</p>
    </div>
  );
}
