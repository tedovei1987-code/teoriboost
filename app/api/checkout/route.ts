import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Mangler STRIPE_SECRET_KEY i .env.local");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2026-05-27.dahlia",
});

const prices = {
  starter: 4900,
  boost: 11900,
  premium: 24900,
} as const;

const planNames = {
  starter: "TeoriBoost Starter - 24 timer",
  boost: "TeoriBoost Boost - 1 uke",
  premium: "TeoriBoost Premium - 4 uker",
} as const;

type Plan = keyof typeof prices;

export async function POST(request: Request) {
  try {
    const { plan } = await request.json();

    if (!plan || !(plan in prices)) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const selectedPlan = plan as Plan;

    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3004";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "nok",
            product_data: {
              name: planNames[selectedPlan],
            },
            unit_amount: prices[selectedPlan],
          },
          quantity: 1,
        },
      ],
      metadata: {
        plan: selectedPlan,
      },
      success_url: `${siteUrl}/success?plan=${selectedPlan}`,
      cancel_url: `${siteUrl}/pricing`,
    });

    if (!session.url) {
      return NextResponse.json(
        { error: "Stripe returnerte ingen checkout-url" },
        { status: 500 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("CHECKOUT ERROR FULL:", error);

if (error instanceof Error) {
  console.error("MESSAGE:", error.message);
  console.error("STACK:", error.stack);
}

    return NextResponse.json(
      { error: "Kunne ikke starte betaling" },
      { status: 500 }
    );
  }
}