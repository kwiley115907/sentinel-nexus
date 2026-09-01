import { createClient } from "@supabase/supabase-js";

// SERVER-SIDE ONLY. Never import this file in a client component or
// anything bundled to the browser - the service role key bypasses RLS
// entirely. Only use inside API routes / route handlers.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!serviceRoleKey && process.env.NODE_ENV !== "development") {
  console.warn("SUPABASE_SERVICE_ROLE_KEY is not set - admin writes will fail.");
}

export const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
