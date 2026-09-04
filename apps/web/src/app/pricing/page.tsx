"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

const plans = [
  {
    name: "Basic",
    price: "$0",
    period: "starter",
    features: [
      "Basic blueprint viewing",
      "Limited device placement",
      "Basic room/wall tools",
      "Export SVG",
      "Single-user projects",
    ],
  },
  {
    name: "Pro",
    price: "$49.99/mo.",
    period: "14-day free trial",
    checkoutPlan: "monthly" as const,
    button: "Start Pro",
    featured: true,
    features: [
      "CAD-style Blueprint Builder",
      "Fire alarm, CCTV, security, and access-control device libraries",
      "Door swing symbols",
      "Adjustable device icon sizing",
      "Wire runs and device schedules",
      "Blueprint uploads",
      "Inspection and punch-list tools",
      "Sentinel AI project assistant",
      "Material counts and reports",
    ],
  },
  {
    name: "Premium",
    price: "$399/yr.",
    period: "14-day free trial",
    checkoutPlan: "annual" as const,
    button: "Start Premium",
    features: [
      "Everything in Pro",
      "Best annual value",
      "Advanced AI blueprint assistant",
      "AI estimates and report writing",
      "As-built closeout workflow",
      "Priority feature access",
      "Team-ready project organization",
      "Premium support",
      "Future CAD/BIM integrations",
    ],
  },
];

export default function PricingPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function startCheckout(checkoutPlan: "monthly" | "annual") {
    setError("");
    setLoadingPlan(checkoutPlan);

    try {
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        window.location.href = `/signup?next=pricing`;
        return;
      }

      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: checkoutPlan }),
      });

      const result = await response.json();

      if (!response.ok || !result.url) {
        setError(result.error || "Could not start checkout. Please try again.");
        setLoadingPlan(null);
        return;
      }

      window.location.href = result.url;
    } catch {
      setError("Could not start checkout. Please try again.");
      setLoadingPlan(null);
    }
  }

  return (
    <main className="min-h-screen bg-black p-6 text-white">
      <nav className="fixed right-5 top-5 z-40 flex gap-4 rounded-2xl bg-black/10 px-4 py-3 text-sm font-bold text-yellow-300 backdrop-blur-sm">
        <a href="/login">Login</a>
        <a href="/signup">Signup</a>
        <a href="/privacy-policy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/contact">Contact</a>
      </nav>

      <section className="mx-auto mt-24 max-w-7xl">
        <div className="text-center">
          <p className="font-black uppercase tracking-[0.35em] text-yellow-300">
            Sentinel Nexus Pricing
          </p>

          <h1 className="mt-4 text-5xl font-black md:text-7xl">
            CAD-Style Tools for Low-Voltage Pros
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-lg text-yellow-100/80">
            Blueprint building, device layouts, wire runs, AI reports, inspections, and as-built workflows built for fire alarm, CCTV, security, and access control.
          </p>

          {error && (
            <p className="mx-auto mt-6 max-w-xl rounded-xl bg-red-950/60 p-3 text-red-300">
              {error}
            </p>
          )}
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-[2rem] border p-8 backdrop-blur-sm ${
                plan.featured
                  ? "scale-[1.02] border-yellow-300 bg-yellow-400/15 shadow-2xl shadow-yellow-500/20"
                  : "border-yellow-400/30 bg-black/10"
              }`}
            >
              {plan.featured && (
                <p className="mb-4 inline-block rounded-full bg-yellow-400 px-4 py-2 text-sm font-black text-black">
                  MOST POPULAR
                </p>
              )}

              <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-4xl font-black text-yellow-300">
                  {plan.name}
                </h2>

                <p className="text-4xl font-black text-white underline decoration-yellow-300 decoration-4 underline-offset-8">
                  {plan.price}
                </p>
              </div>

              <p className="mt-3 font-bold text-yellow-100/70">
                {plan.period}
              </p>

              {plan.checkoutPlan ? (
                <button
                  type="button"
                  disabled={loadingPlan !== null}
                  onClick={() => startCheckout(plan.checkoutPlan)}
                  className="mt-8 block w-full rounded-2xl bg-yellow-400 p-4 text-center text-lg font-black text-black hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loadingPlan === plan.checkoutPlan ? "Redirecting to checkout..." : plan.button}
                </button>
              ) : (
                <a
                  href="/signup"
                  className="mt-8 block rounded-2xl bg-yellow-400 p-4 text-center text-lg font-black text-black hover:bg-yellow-300"
                >
                  Start Free
                </a>
              )}

              <ul className="mt-8 space-y-3 text-yellow-50/90">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3">
                    <span className="font-black text-yellow-300">✓</span>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
