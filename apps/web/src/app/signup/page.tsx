"use client";

import { supabase } from "@/lib/supabase";
import { useState } from "react";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");

  async function signup() {
    setStatus("Creating account...");

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });

    if (error) return setStatus(error.message);

    setStatus("Signup successful. Check your email if confirmation is enabled.");
  }

  async function signupOAuth(provider: "google" | "twitter") {
    setStatus(`Opening ${provider} signup...`);

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

        <h1 className="text-center text-3xl font-black text-yellow-300">Create Account</h1>

        <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="mt-6 w-full rounded-xl bg-black/25 p-4" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" className="mt-4 w-full rounded-xl bg-black/25 p-4" />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="mt-4 w-full rounded-xl bg-black/25 p-4" />

        <button type="button" onClick={signup} className="mt-4 w-full cursor-pointer rounded-xl bg-yellow-400 p-4 font-black text-black">Sign Up</button>
        <button type="button" onClick={() => signupOAuth("google")} className="mt-4 w-full cursor-pointer rounded-xl bg-red-600 p-4 font-black text-white">Sign Up With Google</button>
        <button type="button" onClick={() => signupOAuth("twitter")} className="mt-4 w-full cursor-pointer rounded-xl bg-neutral-900 p-4 font-black text-white">Sign Up With X / Twitter</button>

        {status && <p className="mt-4 rounded-xl bg-black/25 p-3 text-center text-yellow-300">{status}</p>}

        <a href="/login" className="mt-5 block text-center text-yellow-300">Already have an account? Login</a>
      </div>
    </main>
  );
}
