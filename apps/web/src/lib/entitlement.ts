import type { SupabaseClient } from "@supabase/supabase-js";

export type Entitlement = {
  userId: string;
  companyId: string | null;
  plan: string;
  status: string;
  /** True once the company has an active/trialing paid (non-free) plan. */
  entitled: boolean;
};

const ACTIVE_STATUSES = new Set(["active", "trialing"]);

/**
 * A company only unlocks the paid feature set once it's on a non-free
 * plan AND that plan is actually active/trialing - a canceled Pro
 * subscription is not entitled just because `plan` still says "monthly".
 * plan/status values must match the check constraints on
 * public.subscriptions: plan in ('free','monthly','annual'), status in
 * ('inactive','trialing','active','past_due','canceled').
 */
export async function getEntitlement(
  supabase: SupabaseClient,
  userId: string
): Promise<Entitlement> {
  const { data: membership } = await supabase
    .from("company_members")
    .select("company_id")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return { userId, companyId: null, plan: "free", status: "inactive", entitled: false };
  }

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("plan, status")
    .eq("company_id", membership.company_id)
    .maybeSingle();

  const plan = subscription?.plan ?? "free";
  const status = subscription?.status ?? "inactive";
  const entitled = plan !== "free" && ACTIVE_STATUSES.has(status);

  return { userId, companyId: membership.company_id, plan, status, entitled };
}
