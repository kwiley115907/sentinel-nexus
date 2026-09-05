import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

// Server Route Handler, not a client page. This is the pattern Supabase
// itself recommends for @supabase/ssr + Next.js: the PKCE code_verifier
// cookie set during signInWithOAuth() is written with attributes that
// aren't guaranteed readable via client-side `document.cookie`, but a
// server handler reading cookies() sees the raw Cookie header regardless
// - doing the exchange here instead of in client-side JS is what
// actually makes the code_verifier lookup reliable ("PKCE code verifier
// not found in storage" was happening consistently from the old client
// page version of this route).
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }

    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent(error.message)}`
    );
  }

  return NextResponse.redirect(`${origin}/login`);
}
