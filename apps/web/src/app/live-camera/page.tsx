"use client";

import AppShell from "@/components/AppShell";
import { useRef, useState } from "react";

export default function LiveCameraPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState("Camera off");

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      setStatus("Camera running");
    } catch {
      setStatus("Camera permission denied or unavailable");
    }
  }

  function stopCamera() {
    const stream = videoRef.current?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((track) => track.stop());

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setStatus("Camera off");
  }

  return (
    <AppShell>
      <h1 className="text-4xl font-black text-yellow-300">Live Camera</h1>

      <div className="mt-6 flex gap-3">
        <button onClick={startCamera} className="rounded-xl acp-button px-5 py-3 font-black text-[#3a2418]">
          Start Camera
        </button>
        <button onClick={stopCamera} className="rounded-xl acp-danger px-5 py-3 font-black">
          Stop Camera
        </button>
      </div>

      <p className="mt-4 text-yellow-100">{status}</p>

      <video ref={videoRef} autoPlay playsInline muted className="mt-6 w-full rounded-[2rem] bg-black" />
    </AppShell>
  );
}
