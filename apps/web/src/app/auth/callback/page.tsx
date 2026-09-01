"use client";

import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("Finishing login...");

  useEffect(() => {
    async function finishLogin() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          setMessage(error.message);
          return;
        }
      } else {
        const { data } = await supabase.auth.getSession();

        if (!data.session) {
          setMessage("No login session found. Try logging in again from the same browser.");
          return;
        }
      }

      window.location.href = "/dashboard";
    }

    finishLogin();
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-black p-6 text-center text-white">
      <p className="text-xl font-black text-yellow-300">{message}</p>
    </main>
  );
}
