import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getEntitlement } from "@/lib/entitlement";

// Reachable without logging in at all.
const PUBLIC_PATHS = new Set([
  "/",
  "/login",
  "/signup",
  "/auth/callback",
  "/pricing",
  "/privacy-policy",
  "/terms",
  "/contact",
]);

// Reachable by any logged-in user on the free Basic plan.
const FREE_TIER_PATHS = new Set([
  "/dashboard",
  "/blueprints",
  "/blueprint-viewer",
  "/company-management",
]);

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC_PATHS.has(pathname)) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (FREE_TIER_PATHS.has(pathname)) {
    return response;
  }

  const entitlement = await getEntitlement(supabase, user.id);

  if (!entitlement.entitled) {
    const upgradeUrl = new URL("/pricing", request.url);
    upgradeUrl.searchParams.set("upgrade", "1");
    return NextResponse.redirect(upgradeUrl);
  }

  return response;
}

export const config = {
  // Every page except static assets and API routes (API routes check
  // entitlement themselves so they behave correctly for direct callers).
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
