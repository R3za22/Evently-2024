import "server-only";
import { connectToDatabase } from "@/lib/database";
import Order from "@/lib/database/models/order.model";

/** Internal: called by the signature-verified Stripe webhook (and the free-ticket path). Idempotent on stripeId. */
export async function recordOrder(o: { stripeId: string; eventId: string; buyerId: string; totalAmount: string }) {
  await connectToDatabase();
  const existing = await Order.findOne({ stripeId: o.stripeId });
  if (existing) return JSON.parse(JSON.stringify(existing));
  const created = await Order.create({ stripeId: o.stripeId, totalAmount: o.totalAmount, event: o.eventId, buyer: o.buyerId });
  return JSON.parse(JSON.stringify(created));
}
