import Stripe from "stripe";
import { NextResponse } from "next/server";
import { recordOrder } from "@/lib/server/orders";

export async function POST(request: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!secret || !key) return new NextResponse("Webhook not configured", { status: 500 });

  const signature = request.headers.get("stripe-signature");
  if (!signature) return new NextResponse("Missing signature", { status: 400 });

  // The exact raw bytes are required for signature verification.
  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = new Stripe(key).webhooks.constructEvent(body, signature, secret);
  } catch {
    return new NextResponse("Invalid signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const eventId = s.metadata?.eventId;
    const buyerId = s.metadata?.buyerId;
    if (!eventId || !buyerId) return new NextResponse("Missing metadata", { status: 400 });
    const order = await recordOrder({
      stripeId: s.id,
      eventId,
      buyerId,
      totalAmount: s.amount_total ? String(s.amount_total / 100) : "0",
    });
    return NextResponse.json({ message: "OK", order });
  }
  return new NextResponse("", { status: 200 });
}
