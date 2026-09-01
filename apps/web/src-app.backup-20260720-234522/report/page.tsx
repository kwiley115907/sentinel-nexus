"use client";

import { useEffect, useMemo, useState } from "react";

type Device = {
  id: string;
  sheetId: string;
  tag: string;
  type: string;
  status: string;
  x: number;
  y: number;
  notes?: string;
};

type WireRun = {
  id: string;
  sheetId: string;
  label: string;
  cableType: string;
  fromId: string;
  toId: string;
};

type Sheet = {
  id: string;
  name: string;
  blueprint: string;
};

type JobInfo = {
  jobName: string;
  address: string;
  contractor: string;
  technician: string;
};

type ProjectFile = {
  jobInfo: JobInfo;
  sheets: Sheet[];
  devices: Device[];
  wireRuns: WireRun[];
  feetPerUnit: number;
};

export default function ReportPage() {
  const [project, setProject] = useState<ProjectFile>({
    jobInfo: { jobName: "", address: "", contractor: "", technician: "" },
    sheets: [],
    devices: [],
    wireRuns: [],
    feetPerUnit: 2,
  });

  useEffect(() => {
    const saved = localStorage.getItem("alarm-core-project");
    if (saved) setProject(JSON.parse(saved));
  }, []);

  const deviceMap = useMemo(
    () => new Map(project.devices.map((device) => [device.id, device])),
    [project.devices],
  );

  const deviceTotals = useMemo(() => {
    return project.devices.reduce<Record<string, number>>((totals, device) => {
      totals[device.type] = (totals[device.type] || 0) + 1;
      return totals;
    }, {});
  }, [project.devices]);

  const cableTotals = useMemo(() => {
    return project.wireRuns.reduce<Record<string, number>>((totals, run) => {
      const from = deviceMap.get(run.fromId);
      const to = deviceMap.get(run.toId);
      totals[run.cableType] = (totals[run.cableType] || 0) + getWireFeet(from, to);
      return totals;
    }, {});
  }, [project.wireRuns, deviceMap, project.feetPerUnit]);

  function getWireFeet(from?: Device, to?: Device) {
    if (!from || !to) return 0;

    const dx = from.x - to.x;
    const dy = from.y - to.y;

    return Math.round(Math.sqrt(dx * dx + dy * dy) * project.feetPerUnit);
  }

  return (
    <main className="bg-white p-8 text-black print:p-4">
      <div className="mb-8 flex items-center justify-between print:hidden">
        <a href="/blueprint-viewer" className="rounded bg-red-700 px-4 py-2 font-bold text-white">
          Back
        </a>
        <button onClick={() => window.print()} className="rounded bg-yellow-500 px-4 py-2 font-bold">
          Print / Save PDF
        </button>
      </div>

      <h1 className="text-4xl font-black">Sentinel Nexus Report</h1>

      <section className="mt-6 grid grid-cols-2 gap-3">
        <Info label="Job" value={project.jobInfo.jobName} />
        <Info label="Address" value={project.jobInfo.address} />
        <Info label="Contractor" value={project.jobInfo.contractor} />
        <Info label="Technician" value={project.jobInfo.technician} />
      </section>

      <Section title="Material Takeoff">
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h3 className="font-black">Devices</h3>
            {Object.entries(deviceTotals).map(([type, count]) => (
              <p key={type}>{type}: {count}</p>
            ))}
          </div>

          <div>
            <h3 className="font-black">Cable</h3>
            {Object.entries(cableTotals).map(([type, feet]) => (
              <p key={type}>{type}: {feet} ft</p>
            ))}
          </div>
        </div>
      </Section>

      <Section title="Sheets">
        <Table
          headers={["Sheet", "Devices", "Wire Runs"]}
          rows={project.sheets.map((sheet) => [
            sheet.name,
            String(project.devices.filter((device) => device.sheetId === sheet.id).length),
            String(project.wireRuns.filter((run) => run.sheetId === sheet.id).length),
          ])}
        />
      </Section>

      <Section title="Device Schedule">
        <Table
          headers={["Tag", "Type", "Status", "Position", "Notes"]}
          rows={project.devices.map((device) => [
            device.tag,
            device.type,
            device.status || "PLANNED",
            `${device.x.toFixed(1)}%, ${device.y.toFixed(1)}%`,
            device.notes || "",
          ])}
        />
      </Section>

      <Section title="Wire Schedule">
        <Table
          headers={["Label", "Cable", "From", "To", "Feet"]}
          rows={project.wireRuns.map((run) => {
            const from = deviceMap.get(run.fromId);
            const to = deviceMap.get(run.toId);

            return [
              run.label,
              run.cableType,
              from?.tag || "",
              to?.tag || "",
              String(getWireFeet(from, to)),
            ];
          })}
        />
      </Section>
    </main>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="border p-3">
      <p className="text-sm font-bold uppercase">{label}</p>
      <p>{value || "N/A"}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-8 break-inside-avoid">
      <h2 className="mb-3 text-2xl font-black">{title}</h2>
      {children}
    </section>
  );
}

function Table({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <table className="w-full border-collapse border text-sm">
      <thead>
        <tr>
          {headers.map((header) => (
            <th key={header} className="border p-2 text-left">{header}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={index}>
            {row.map((cell, cellIndex) => (
              <td key={cellIndex} className="border p-2">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
