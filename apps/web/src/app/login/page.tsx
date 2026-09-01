"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("Ready");

  async function loginOAuth(provider: "google" | "twitter") {
    setStatus(`Opening ${provider}...`);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        skipBrowserRedirect: true,
      },
    });

    if (error) return setStatus(error.message);
    if (!data.url) return setStatus("No OAuth URL returned.");

    window.location.href = data.url;
  }

  async function loginPassword() {
    setStatus("Logging in...");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) return setStatus(error.message);

    window.location.href = "/dashboard";
  }

  return (
    <main
      className="relative flex min-h-screen items-center justify-center bg-black p-5 text-white"
      style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,.78), rgba(0,0,0,.9)), url("/app-background.png")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <nav className="absolute right-5 top-5 z-20 flex gap-4 rounded-2xl bg-black/20 px-4 py-3 text-sm font-bold text-yellow-300 backdrop-blur-sm">
        <a href="/pricing">Pricing</a><a href="/privacy-policy">Privacy</a>
        <a href="/terms">Terms</a>
        <a href="/contact">Contact</a>
      </nav>

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-yellow-400/30 bg-black/5 p-8 shadow-2xl backdrop-blur-sm">
        <img src="/app-logo.png" alt="Sentinel Nexus" className="mx-auto mb-6 h-28 w-28 rounded-3xl object-cover" />

        <h1 className="text-center text-3xl font-black text-yellow-300">Sentinel Nexus Login</h1>

        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="mt-6 w-full rounded-xl bg-black/25 p-4" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="mt-4 w-full rounded-xl bg-black/25 p-4" />

        <button type="button" onClick={loginPassword} className="mt-4 w-full cursor-pointer rounded-xl bg-yellow-400 p-4 font-black text-black">Login With Password</button>
        <button type="button" onClick={() => loginOAuth("google")} className="mt-4 w-full cursor-pointer rounded-xl bg-red-600 p-4 font-black text-white">Login With Google</button>
        <button type="button" onClick={() => loginOAuth("twitter")} className="mt-4 w-full cursor-pointer rounded-xl bg-neutral-900 p-4 font-black text-white">Login With X / Twitter</button>

        <p className="mt-4 rounded-xl bg-black/25 p-3 text-center text-yellow-300">{status}</p>

        <a href="/signup" className="mt-5 block text-center text-yellow-300">Need an account? Sign up</a>
      </div>
    </main>
  );
}
