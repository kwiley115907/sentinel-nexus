"use client";

import AppShell from "@/components/AppShell";
import { useState } from "react";

type Detection = {
  id: string;
  tag: string;
  type: string;
  confidence: number;
  x: number;
  y: number;
};

export default function AiDetectionPage() {
  const [image, setImage] = useState("");
  const [detections, setDetections] = useState<Detection[]>([]);

  function upload(file: File) {
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  function mockDetect() {
    setDetections([
      { id: Math.random().toString(36).substring(2, 15), tag: "SD-AI-1", type: "SMOKE_DETECTOR", confidence: 0.91, x: 30, y: 35 },
      { id: Math.random().toString(36).substring(2, 15), tag: "HS-AI-1", type: "HORN_STROBE", confidence: 0.86, x: 55, y: 45 },
      { id: Math.random().toString(36).substring(2, 15), tag: "CAM-AI-1", type: "CAMERA", confidence: 0.88, x: 70, y: 25 },
    ]);
  }

  function sendToProject() {
    const project = JSON.parse(localStorage.getItem("alarm-core-project") || "{}");
    const sheetId = project.activeSheetId || project.sheets?.[0]?.id || "";

    const devices = detections.map((detection) => ({
      id: detection.id,
      sheetId,
      tag: detection.tag,
      type: detection.type,
      layer: detection.type === "CAMERA" ? "CAMERA" : "FIRE_ALARM",
      status: "PLANNED",
      x: detection.x,
      y: detection.y,
      coverage: detection.type === "CAMERA" ? 18 : 0,
      notes: `AI confidence: ${Math.round(detection.confidence * 100)}%`,
    }));

    localStorage.setItem("alarm-core-project", JSON.stringify({
      ...project,
      devices: [...(project.devices || []), ...devices],
    }));

    alert("AI detections added to project.");
  }

  return (
    <AppShell>
      <h1 className="text-4xl font-black text-yellow-300">AI Blueprint Detection</h1>

      <div className="mt-6 grid gap-3 rounded-[2rem] acp-card/85 p-5 md:grid-cols-3">
        <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} className="rounded-xl bg-[#2b1a12]/80 p-3" />
        <button onClick={mockDetect} className="rounded-xl acp-button p-3 font-black text-[#3a2418]">Run Detection Demo</button>
        <button onClick={sendToProject} className="rounded-xl acp-danger p-3 font-black">Add To Project</button>
      </div>

      <div className="relative mt-6 min-h-[520px] overflow-hidden rounded-[2rem] acp-card/85">
        {image ? <img src={image} alt="Blueprint" className="h-full w-full object-contain" /> : <div className="flex h-[520px] items-center justify-center">Upload blueprint image</div>}

        {detections.map((detection) => (
          <div key={detection.id} className="absolute rounded-full acp-button px-3 py-2 text-xs font-black text-[#3a2418]" style={{ left: `${detection.x}%`, top: `${detection.y}%` }}>
            {detection.tag} {Math.round(detection.confidence * 100)}%
          </div>
        ))}
      </div>
    </AppShell>
  );
}
