import { cardSchema, DECLINED_CARD } from "@/lib/validation";
import type { CardDetails } from "../types";

export type PaymentOutcome = { ok: true } | { ok: false; code: string; message: string };

/** Simulated Stripe: no network, never touches a provider. */
export function simulatePayment(card: CardDetails | undefined): PaymentOutcome {
  const parsed = cardSchema.safeParse(card ?? {});
  if (!parsed.success) {
    return { ok: false, code: "invalid_card", message: parsed.error.issues[0]?.message ?? "Check your card details." };
  }
  const n = parsed.data.number;
  if (n === DECLINED_CARD) return { ok: false, code: "card_declined", message: "Your card was declined. Try another card." };
  if (n === "4000000000009995") return { ok: false, code: "insufficient_funds", message: "Your card has insufficient funds." };
  return { ok: true };
}
