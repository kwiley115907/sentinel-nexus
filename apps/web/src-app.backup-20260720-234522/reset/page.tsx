"use client";

import { useEffect } from "react";

export default function ResetPage() {
  useEffect(() => {
    localStorage.clear();
    window.location.href = "/dashboard";
  }, []);

  return <main style={{ padding: 30 }}>Clearing app data...</main>;
}
