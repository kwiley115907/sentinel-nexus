import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case "active":
      return "active";
    case "trialing":
      return "trialing";
    case "past_due":
      return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    default:
      return "inactive";
  }
}

function planFromPriceId(priceId: string | undefined): string {
  if (priceId === "price_1UAj7VQLEfHLTmHX1gsiCxKO") return "monthly";
  if (priceId === "price_1UAj7MQLEfHLTmHXTtEWQmtV") return "annual";
  return "free";
}

async function upsertSubscription(
  companyId: string,
  subscription: Stripe.Subscription
) {
  const item = subscription.items.data[0];
  const priceId = item?.price?.id;

  // As of newer Stripe API versions, current_period_end lives on the
  // subscription ITEM, not the subscription itself - the field was removed
  // from the top-level object. Falling back to the (possibly absent)
  // top-level field keeps this working against older API versions too.
  const periodEndUnix =
    item?.current_period_end ??
    (subscription as unknown as { current_period_end?: number })
      .current_period_end;

  const { error } = await supabaseAdmin.from("subscriptions").upsert(
    {
      company_id: companyId,
      stripe_customer_id: subscription.customer as string,
      stripe_subscription_id: subscription.id,
      plan: planFromPriceId(priceId),
      status: mapStripeStatus(subscription.status),
      current_period_end: periodEndUnix
        ? new Date(periodEndUnix * 1000).toISOString()
        : null,
      cancel_at_period_end: subscription.cancel_at_period_end,
    },
    { onConflict: "company_id" }
  );

  if (error) {
    console.error("Failed to upsert subscription:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event: Stripe.Event;

  try {
    if (!signature) throw new Error("Missing stripe-signature header");
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const companyId = session.client_reference_id || session.metadata?.companyId;

        if (!companyId) {
          console.error("checkout.session.completed with no companyId attached");
          break;
        }

        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          await upsertSubscription(companyId, subscription);
        }
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const companyId = subscription.metadata?.companyId;

        if (!companyId) {
          console.error(`${event.type} with no companyId in subscription metadata`);
          break;
        }

        await upsertSubscription(companyId, subscription);
        break;
      }

      default:
        // Other event types are ignored for now.
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
