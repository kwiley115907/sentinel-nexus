"use client";

import { useState } from "react";

const PAYPAL_PRO_URL = "PASTE_PAYPAL_PRO_LINK_HERE";
const PAYPAL_PREMIUM_URL = "PASTE_PAYPAL_PREMIUM_LINK_HERE";
const CASHAPP_URL = "https://cash.app/$lktree2026";

const plans = [
  {
    name: "Basic",
    price: "$0",
    period: "starter",
    href: "/signup",
    button: "Start Free",
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
    href: PAYPAL_PRO_URL,
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
    href: PAYPAL_PREMIUM_URL,
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
  const [promo, setPromo] = useState("");
  const [status, setStatus] = useState("");

  function applyPromo() {
    const code = promo.trim().toUpperCase();
    const validCodes = ["FREECLIENT", "WAIVE100", "COMPED", "BETA2026"];

    if (!validCodes.includes(code)) {
      setStatus("Invalid promo code.");
      return;
    }

    localStorage.setItem("sentinel-nexus-subscription", "waived");
    localStorage.setItem("sentinel-nexus-promo-code", code);
    setStatus("Promo accepted. Subscription waived.");

    setTimeout(() => {
      window.location.href = "/dashboard";
    }, 1000);
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

              <a
                href={plan.href}
                className="mt-8 block rounded-2xl bg-yellow-400 p-4 text-center text-lg font-black text-black hover:bg-yellow-300"
              >
                {plan.button}
              </a>

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

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-green-400/30 bg-black/10 p-8 backdrop-blur-sm">
            <h2 className="text-3xl font-black text-green-300">Cash App</h2>
            <p className="mt-3 text-yellow-100/80">
              Pay manually with Cash App. Access will be approved after payment verification.
            </p>

            <a
              href={CASHAPP_URL}
              className="mt-6 block rounded-2xl bg-green-500 p-4 text-center font-black text-black hover:bg-green-400"
            >
              Pay With Cash App
            </a>
          </div>

          <div className="rounded-[2rem] border border-yellow-400/30 bg-black/10 p-8 backdrop-blur-sm">
            <h2 className="text-3xl font-black text-yellow-300">Promo Code</h2>

            <input
              value={promo}
              onChange={(event) => setPromo(event.target.value)}
              placeholder="Enter promo code"
              className="mt-5 w-full rounded-xl bg-black/20 p-4 text-white"
            />

            <button
              type="button"
              onClick={applyPromo}
              className="mt-4 w-full rounded-xl bg-yellow-400 p-4 font-black text-black hover:bg-yellow-300"
            >
              Apply Promo Code
            </button>

            {status && <p className="mt-4 text-yellow-300">{status}</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
