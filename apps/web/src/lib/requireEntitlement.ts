import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getEntitlement } from "@/lib/entitlement";

/**
 * Gate for API routes that spend real money (OpenAI calls, the Sentinel
 * AI backend, etc). Returns a 401/403 response to short-circuit the
 * route, or null when the caller is a logged-in user on an active paid
 * plan and the route should proceed.
 */
export async function requireEntitledUser(): Promise<NextResponse | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Login required." }, { status: 401 });
  }

  const entitlement = await getEntitlement(supabase, user.id);

  if (!entitlement.entitled) {
    return NextResponse.json(
      { error: "This feature requires an active Pro or Premium subscription." },
      { status: 403 }
    );
  }

  return null;
}
