"use client";

import AppShell from "@/components/AppShell";
import { useState } from "react";

type Position = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export default function GpsPage() {
  const [position, setPosition] = useState<Position | null>(null);
  const [status, setStatus] = useState("GPS not started");

  function getLocation() {
    navigator.geolocation.getCurrentPosition(
      (result) => {
        setPosition({
          latitude: result.coords.latitude,
          longitude: result.coords.longitude,
          accuracy: result.coords.accuracy,
        });
        setStatus("GPS location captured");
      },
      () => setStatus("GPS permission denied or unavailable"),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <AppShell>
      <h1 className="text-4xl font-black text-yellow-300">GPS Field Location</h1>

      <button onClick={getLocation} className="mt-6 rounded-xl acp-button px-5 py-3 font-black text-[#3a2418]">
        Capture GPS Location
      </button>

      <p className="mt-4 text-yellow-100">{status}</p>

      {position && (
        <div className="mt-6 rounded-[2rem] acp-card p-5 backdrop-blur-md">
          <p>Latitude: {position.latitude}</p>
          <p>Longitude: {position.longitude}</p>
          <p>Accuracy: {Math.round(position.accuracy)} meters</p>
        </div>
      )}
    </AppShell>
  );
}
