"use client";

import { useEffect } from "react";

export default function ResetAllPage() {
  useEffect(() => {
    localStorage.clear();
    sessionStorage.clear();

    caches.keys().then((keys) => {
      keys.forEach((key) => caches.delete(key));
    });

    navigator.serviceWorker?.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });

    indexedDB.databases?.().then((dbs) => {
      dbs.forEach((db) => {
        if (db.name) indexedDB.deleteDatabase(db.name);
      });
    });

    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1000);
  }, []);

  return (
    <main style={{ padding: 30, color: "white", background: "black", minHeight: "100vh" }}>
      Resetting all Sentinel Nexus saved data...
    </main>
  );
}
