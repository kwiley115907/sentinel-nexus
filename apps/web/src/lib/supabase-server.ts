import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// SERVER-SIDE ONLY. Reads the caller's Supabase session from cookies so
// route handlers can know who is calling, respecting RLS (unlike
// supabase-admin.ts, which uses the service role key and bypasses RLS).
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component render where cookies can't be
            // written; the middleware/proxy refreshing the session covers it.
          }
        },
      },
    }
  );
}
