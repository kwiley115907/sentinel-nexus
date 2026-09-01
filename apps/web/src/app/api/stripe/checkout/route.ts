import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");

const PRICE_IDS: Record<string, string> = {
  monthly: "price_1UAholQLEfHLTmHX1Sc7oQRV",
  annual: "price_1UAiNcQLEfHLTmHXNkT0hmOr",
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { plan, companyId, customerEmail } = body as {
      plan: "monthly" | "annual";
      companyId: string;
      customerEmail?: string;
    };

    const priceId = PRICE_IDS[plan];
    if (!priceId) {
      return NextResponse.json(
        { error: "Invalid plan. Must be 'monthly' or 'annual'." },
        { status: 400 }
      );
    }

    if (!companyId) {
      return NextResponse.json(
        { error: "companyId is required." },
        { status: 400 }
      );
    }

    const origin = request.headers.get("origin") || "https://snlow-voltage.com";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: customerEmail,
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/pricing?checkout=canceled`,
      // company_id travels with the session and lands on the webhook
      // event, so we know which company to attach the subscription to
      // once payment actually completes.
      client_reference_id: companyId,
      metadata: { companyId },
      subscription_data: {
        metadata: { companyId },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout session error:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
