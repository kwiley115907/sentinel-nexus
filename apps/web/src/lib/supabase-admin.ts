import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// SERVER-SIDE ONLY. Never import this file in a client component or
// anything bundled to the browser - the service role key bypasses RLS
// entirely. Only use inside API routes / route handlers.
//
// Lazily constructed (not created at module load) so that a missing
// SUPABASE_SERVICE_ROLE_KEY at build time can't crash the entire Next.js
// build - createClient() throws synchronously on an empty key, and
// Next's build-time page-data collection imports every route module,
// so an eager client here previously took down the whole deployment
// over one unrelated env var. It still throws when actually used
// without the key, just no longer just for being imported.
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

  if (!serviceRoleKey) {
    console.warn("SUPABASE_SERVICE_ROLE_KEY is not set - admin writes will fail.");
  }

  client = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return client;
}

export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, property) {
    const value = getClient()[property as keyof SupabaseClient];
    return typeof value === "function" ? value.bind(getClient()) : value;
  },
});
