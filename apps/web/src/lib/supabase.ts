import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Cookie-backed client (not localStorage) so the session is visible to
// proxy.ts and route handlers on the server, not just the browser tab.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
