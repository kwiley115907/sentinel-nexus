"use client";

import Link from "next/link";
import SentinelChat from "@/components/chat/SentinelChat";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  BarChart3,
  Bot,
  Boxes,
  BrainCircuit,
  Building2,
  Calculator,
  CalendarDays,
  Camera,
  ClipboardCheck,
  Cloud,
  FileCog,
  FileImage,
  Hammer,
  LayoutDashboard,
  LogOut,
  MapPin,
  Menu,
  Network,
  PackageCheck,
  PencilRuler,
  ScanLine,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  TabletSmartphone,
  UserRound,
  Users,
  X,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Command", icon: LayoutDashboard },
  { href: "/blueprints", label: "Blueprints", icon: FileImage },
  { href: "/blueprint-upload", label: "Upload Prints", icon: FileImage },
  { href: "/blueprint-builder", label: "Builder", icon: PencilRuler },
  { href: "/blueprint-3d", label: "3D Builder", icon: PencilRuler },
  { href: "/blueprint-viewer", label: "Studio", icon: ShieldAlert },
  { href: "/devices", label: "Devices", icon: Camera },
  { href: "/wire-runs", label: "Wire Runs", icon: Network },
  { href: "/inspection", label: "Inspection", icon: ClipboardCheck },
  { href: "/punch-list", label: "Punch List", icon: Hammer },
  { href: "/as-built", label: "As-Built", icon: PackageCheck },
  { href: "/live-camera", label: "Live Camera", icon: Camera },
  { href: "/gps", label: "GPS", icon: MapPin },
  { href: "/ai-tools", label: "AI Tools", icon: BrainCircuit },
  { href: "/ai-project-assistant", label: "AI Project", icon: Bot },
  { href: "/sentinel-ai", label: "Sentinel AI", icon: Bot },
  { href: "/sync", label: "Cloud Sync", icon: Cloud },
  { href: "/ai-detection", label: "AI Detection", icon: Sparkles },
  { href: "/company-management", label: "Company", icon: Building2 },
  { href: "/dispatch", label: "Dispatch", icon: CalendarDays },
  { href: "/estimating", label: "Estimating", icon: Calculator },
  { href: "/ai-blueprint", label: "AI Blueprint", icon: Sparkles },
  { href: "/collaboration", label: "Collaboration", icon: Users },
  { href: "/inventory", label: "Inventory", icon: Boxes },
  { href: "/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/cad-bim", label: "CAD/BIM", icon: FileCog },
  { href: "/customer-portal", label: "Customer", icon: UserRound },
  { href: "/service-monitoring", label: "Service", icon: Activity },
  { href: "/field-mode", label: "Field Mode", icon: TabletSmartphone },
  { href: "/ar-mode", label: "AR Mode", icon: ScanLine },
  { href: "/ai-assistant", label: "AI Assistant", icon: Bot },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/multi-office", label: "Multi-Office", icon: Network },
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [authReady, setAuthReady] = useState(false);

  const mobileSidebarRef = useRef<HTMLElement | null>(null);
  const desktopSidebarRef = useRef<HTMLElement | null>(null);

  const SIDEBAR_SCROLL_KEY = "sentinel-sidebar-scroll-top";

  function saveSidebarScroll(element: HTMLElement | null) {
    if (!element) {
      return;
    }

    sessionStorage.setItem(
      SIDEBAR_SCROLL_KEY,
      String(element.scrollTop),
    );
  }

  function restoreSidebarScroll(element: HTMLElement | null) {
    if (!element) {
      return;
    }

    const savedValue = sessionStorage.getItem(
      SIDEBAR_SCROLL_KEY,
    );

    const savedScrollTop = Number(savedValue ?? "0");

    if (!Number.isFinite(savedScrollTop)) {
      return;
    }

    /*
     * Use requestAnimationFrame so restoration happens after the
     * sidebar content has rendered.
     */
    requestAnimationFrame(() => {
      element.scrollTop = savedScrollTop;
    });
  }

  useEffect(() => {
    async function checkAuth() {
      try {
        const { supabase } = await import("@/lib/supabase");
        const { data } = await supabase.auth.getSession();

        if (!data.session && location.pathname !== "/login" && location.pathname !== "/signup") {
          window.location.href = "/login";
          return;
        }

        if (data.session) {
          // Self-heals the company/subscription bootstrap for accounts
          // that have never had a company created for them - safe to call
          // on every load, it's a no-op once the company already exists.
          await supabase.rpc("ensure_company_for_current_user");
        }
      } finally {
        setAuthReady(true);
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    restoreSidebarScroll(mobileSidebarRef.current);
  }, [open]);

  useEffect(() => {
    restoreSidebarScroll(desktopSidebarRef.current);
  }, [collapsed]);

  if (!authReady) {
    return (
      <main className="flex min-h-screen items-center justify-center text-white">
        <div className="acp-card acp-glow rounded-[2rem] p-8">
          <p className="text-2xl font-black text-yellow-300">Loading Sentinel Nexus...</p>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen text-white">
      <div className="pointer-events-none fixed inset-0 opacity-[0.60]">
        <img src="/app-logo.png" alt="" className="h-full w-full object-cover" />
      </div>

      
      <nav className="fixed right-5 top-5 z-40 hidden rounded-2xl bg-black/10 px-4 py-3 text-sm font-bold text-yellow-300 opacity-0 backdrop-blur-sm transition-opacity duration-200 hover:opacity-100 md:flex md:gap-4">
        <a href="/pricing">Pricing</a>
        <a href="/privacy-policy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/contact">Contact</a>
      </nav>

      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-2xl border border-yellow-400/30 bg-black/5 p-3 shadow-2xl backdrop-blur-sm lg:hidden"
      >
        <Menu className="text-yellow-300" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/35 lg:hidden">
          <aside
            ref={mobileSidebarRef}
            onScroll={(event) =>
              saveSidebarScroll(event.currentTarget)
            }
            className="h-full w-80 overflow-y-auto border-r border-yellow-500/30 bg-black/95 p-5 shadow-2xl">
            <button onClick={() => setOpen(false)} className="mb-5 rounded-xl bg-yellow-400 p-2 text-black">
              <X />
            </button>
            <Sidebar />
          </aside>
        </div>
      )}

      <aside
        ref={desktopSidebarRef}
        onScroll={(event) =>
          saveSidebarScroll(event.currentTarget)
        }
        className={`fixed left-0 top-0 hidden h-full overflow-y-auto border-r border-yellow-500/30 bg-black/95 p-5 shadow-2xl lg:block ${collapsed ? "w-24" : "w-80"}`}
      >
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mb-4 w-full rounded-xl bg-yellow-400 p-3 font-black text-black"
        >
          {collapsed ? "→" : "← Collapse"}
        </button>
        <Sidebar collapsed={collapsed} />
      </aside>

      <div className={`relative z-10 ${collapsed ? "lg:ml-24" : "lg:ml-80"}`}><main className="p-5 pt-20 lg:p-8">{children}</main><footer className="border-t border-yellow-500/20 bg-black/15 px-6 py-4 text-center text-sm text-yellow-200 backdrop-blur-sm">© 2026 Sentinel Nexus - Prepared by: K.A. Wiley / Thomas Cantu</footer></div>
    </div>
  );
}

function Sidebar({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <>
      <div className="acp-card acp-glow mb-6 rounded-[2rem] p-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 overflow-hidden rounded-2xl border border-yellow-400/40">
            <img src="/app-logo.png" alt="Sentinel Nexus" className="h-full w-full object-cover" />
          </div>

          <div className={collapsed ? "hidden" : ""}>
            <h1 className="text-xl font-black tracking-wide text-yellow-300">Sentinel Nexus</h1>
            <p className="text-xs uppercase tracking-[0.25em] text-red-200/80">
              Low Voltage OS
            </p>
          </div>
        </div>
      </div>

      {!collapsed && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-black uppercase tracking-widest text-yellow-300">
            Sentinel AI Chat
          </h2>

          <SentinelChat />
        </div>
      )}

      <nav className="grid gap-2">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            scroll={false}
            className="group flex items-center gap-3 rounded-2xl border border-yellow-500/10 bg-zinc-950/95 px-4 py-3 text-sm font-bold text-yellow-50/90 shadow-lg transition hover:border-yellow-400/40 hover:bg-zinc-900 hover:text-yellow-300"
          >
            <span className="rounded-xl bg-red-950/60 p-2 text-yellow-300 group-hover:bg-yellow-400 group-hover:text-black">
              <Icon size={17} />
            </span>
            {!collapsed && label}
          </Link>
        ))}
      </nav>


      <button
        onClick={async () => {
          const { supabase } = await import("@/lib/supabase");
          await supabase.auth.signOut();
          window.location.href = "/login";
        }}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl bg-red-700 px-4 py-3 font-black text-white"
      >
        <LogOut size={18} />
        Logout
      </button>
    </>
  );
}
