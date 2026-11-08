"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { AlertCircle, Check, ChevronLeft } from "lucide-react";
import EventImage from "@/components/shared/EventImage";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/kit";
import { api, type CardDetails, type EventDTO, type OrderDTO } from "@/lib/api";
import { cardSchema, fieldErrors } from "@/lib/validation";
import { cn, formatEventDate, formatPrice } from "@/lib/utils";

type CardField = "name" | "number" | "expiry" | "cvc";
const CARD_FIELDS: CardField[] = ["name", "number", "expiry", "cvc"];

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/** Groups of 4 digits, max 16 digits. */
const formatCardNumber = (raw: string) => raw.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})(?=\d)/g, "$1 ");

/** MM/YY, digits only. */
const formatExpiry = (raw: string) => {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
};

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {error && (
        <p id={`${id}-error`} className="hint">
          {error}
        </p>
      )}
    </div>
  );
}

function Wrap({ children }: { children: ReactNode }) {
  return <div className="wrapper py-10 md:py-14">{children}</div>;
}

type LoadState = { status: "loading" } | { status: "ready"; event: EventDTO } | { status: "notfound" } | { status: "error"; message: string };

export default function CheckoutFlow({ eventId }: { eventId: string }) {
  const [load, setLoad] = useState<LoadState>(eventId ? { status: "loading" } : { status: "notfound" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!eventId) {
      setLoad({ status: "notfound" });
      return;
    }
    let alive = true;
    setLoad({ status: "loading" });
    api
      .getEvent(eventId)
      .then((event) => {
        if (alive) setLoad(event ? { status: "ready", event } : { status: "notfound" });
      })
      .catch((err) => {
        if (alive) setLoad({ status: "error", message: errMsg(err, "Please check your connection and try again.") });
      });
    return () => {
      alive = false;
    };
  }, [eventId, attempt]);

  if (load.status === "loading") {
    return (
      <Wrap>
        <p role="status" className="sr-only">
          Loading checkout…
        </p>
        <div aria-hidden="true" className="flex flex-col gap-6">
          <Skeleton className="h-10 w-48" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
            <Skeleton className="h-[460px] w-full" />
            <Skeleton className="h-[300px] w-full" />
          </div>
        </div>
      </Wrap>
    );
  }

  if (load.status === "error") {
    return (
      <Wrap>
        <ErrorState title="Couldn't load this event" message={load.message} onRetry={() => setAttempt((n) => n + 1)} />
      </Wrap>
    );
  }

  if (load.status === "notfound") {
    return (
      <Wrap>
        <EmptyState
          title="Event not found"
          body="It may have been removed, or the link is wrong."
          action={
            <Link href="/" className="btn btn-dark">
              Back to events
            </Link>
          }
        />
      </Wrap>
    );
  }

  return <CheckoutPanel key={load.event._id} eventId={eventId} event={load.event} />;
}

function CheckoutPanel({ eventId, event }: { eventId: string; event: EventDTO }) {
  const free = event.isFree;
  const price = formatPrice(event.price, event.isFree);
  const eventHref = `/events/view?id=${eventId}`;

  const [card, setCard] = useState({ name: "", number: "", expiry: "", cvc: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [paying, setPaying] = useState(false);
  const [declined, setDeclined] = useState<{ code: string; message: string } | null>(null);
  const [fatal, setFatal] = useState<string | null>(null);
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const inputs = useRef<Partial<Record<CardField, HTMLInputElement | null>>>({});

  const updateCard = (field: CardField, value: string) => {
    setCard((c) => ({ ...c, [field]: value }));
    setErrors((e) => {
      if (!e[field]) return e;
      const next = { ...e };
      delete next[field];
      return next;
    });
  };

  async function charge(input: { eventId: string; card?: CardDetails }) {
    try {
      const r = await api.checkout(input);
      if (r.status === "redirect") {
        window.location.assign(r.url);
        return;
      }
      if (r.status === "paid") setOrder(r.order);
      else setDeclined({ code: r.code, message: r.message });
      setPaying(false);
    } catch (err) {
      setFatal(errMsg(err, "Checkout failed. Please try again."));
      setPaying(false);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (paying) return;
    setDeclined(null);
    setFatal(null);
    if (free) {
      setPaying(true);
      void charge({ eventId });
      return;
    }
    const parsed = cardSchema.safeParse(card);
    if (!parsed.success) {
      const errs = fieldErrors(parsed.error);
      setErrors(errs);
      const first = CARD_FIELDS.find((f) => errs[f]);
      if (first) inputs.current[first]?.focus();
      return;
    }
    setErrors({});
    setPaying(true);
    void charge({ eventId, card: parsed.data });
  }

  return (
    <Wrap>
      <Link href={eventHref} className="inline-flex min-h-[44px] items-center gap-1 font-bold">
        <ChevronLeft className="h-[18px] w-[18px]" aria-hidden="true" />
        Back to event
      </Link>
      <h1 className="mt-3 text-4xl font-extrabold tracking-tight md:text-5xl">Checkout</h1>
      <p className="mt-4 max-w-[760px] rounded-btn border-[1.5px] border-marquee bg-[#FFF3CC] px-4 py-3 text-sm">
        <strong>Simulated Stripe</strong> — no real payment. Test card 4242 4242 4242 4242 succeeds; 4000 0000 0000 0002 is declined.
      </p>

      {order ? (
        <TicketSuccess event={event} order={order} />
      ) : (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_420px]">
          <section aria-labelledby="payment-heading" className="flex flex-col gap-5 rounded-card border border-line bg-white p-5 md:p-8">
            <h2 id="payment-heading" className="font-display text-2xl font-bold">
              {free ? "Your ticket" : "Payment details"}
            </h2>

            {fatal && (
              <div className="flex flex-col gap-3">
                <ErrorState title="Checkout couldn't be completed" message={fatal} />
                <Link href={eventHref} className="inline-flex min-h-[44px] items-center font-bold underline underline-offset-4">
                  Back to event
                </Link>
              </div>
            )}

            <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5" aria-busy={paying || undefined}>
              {free ? (
                <p className="text-slate">No card needed. Your ticket goes straight to My tickets.</p>
              ) : (
                <>
                  <Field id="ck-name" label="Name on card" error={errors.name}>
                    <input
                      id="ck-name"
                      ref={(el) => {
                        inputs.current.name = el;
                      }}
                      type="text"
                      autoComplete="cc-name"
                      value={card.name}
                      onChange={(e) => updateCard("name", e.target.value)}
                      aria-invalid={errors.name ? true : undefined}
                      aria-describedby={errors.name ? "ck-name-error" : undefined}
                    />
                  </Field>

                  <Field id="ck-number" label="Card number" error={errors.number}>
                    <input
                      id="ck-number"
                      ref={(el) => {
                        inputs.current.number = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      placeholder="4242 4242 4242 4242"
                      maxLength={19}
                      value={card.number}
                      onChange={(e) => updateCard("number", formatCardNumber(e.target.value))}
                      aria-invalid={errors.number ? true : undefined}
                      aria-describedby={errors.number ? "ck-number-error" : undefined}
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field id="ck-expiry" label="Expiry (MM/YY)" error={errors.expiry}>
                      <input
                        id="ck-expiry"
                        ref={(el) => {
                          inputs.current.expiry = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/YY"
                        maxLength={5}
                        value={card.expiry}
                        onChange={(e) => updateCard("expiry", formatExpiry(e.target.value))}
                        aria-invalid={errors.expiry ? true : undefined}
                        aria-describedby={errors.expiry ? "ck-expiry-error" : undefined}
                      />
                    </Field>
                    <Field id="ck-cvc" label="CVC" error={errors.cvc}>
                      <input
                        id="ck-cvc"
                        ref={(el) => {
                          inputs.current.cvc = el;
                        }}
                        type="text"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="123"
                        maxLength={4}
                        value={card.cvc}
                        onChange={(e) => updateCard("cvc", e.target.value.replace(/\D/g, "").slice(0, 4))}
                        aria-invalid={errors.cvc ? true : undefined}
                        aria-describedby={errors.cvc ? "ck-cvc-error" : undefined}
                      />
                    </Field>
                  </div>
                </>
              )}

              {declined && (
                <div
                  role="alert"
                  data-testid="payment-declined"
                  className="flex items-start gap-3 rounded-btn border-[1.5px] border-error bg-error-tint p-4"
                >
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" aria-hidden="true" />
                  <div className="flex flex-col gap-1">
                    <p className="font-bold text-error">Payment declined</p>
                    <p className="text-sm text-ink">{declined.message}</p>
                  </div>
                </div>
              )}

              <button type="submit" disabled={paying} className={cn("btn btn-primary btn-lg w-full")}>
                {paying ? (free ? "Getting your ticket…" : "Processing payment…") : free ? "Get free ticket" : `Pay ${price}`}
              </button>
            </form>
          </section>

          <aside aria-label="Order summary" className="overflow-hidden rounded-card border border-line bg-white">
            <div className="flex flex-col gap-4 p-6 md:p-7">
              <p className="overline">Order summary</p>
              <div className="flex gap-4">
                <EventImage src={event.imageUrl} className="h-[84px] w-[84px] shrink-0 rounded-field object-cover" />
                <div className="min-w-0">
                  <p className="font-display text-xl font-bold leading-tight">{event.title}</p>
                  <p className="mt-1 text-sm text-slate">{formatEventDate(event.startDateTime)}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2.5 border-t-2 border-dashed border-line bg-[#FFF8E5] p-6 md:px-7">
              <div className="flex justify-between gap-4">
                <span>1 × Admit one</span>
                <span>{price}</span>
              </div>
              <div className="flex justify-between gap-4 text-xl font-bold">
                <span>Total</span>
                <span>{price}</span>
              </div>
            </div>
          </aside>
        </div>
      )}
    </Wrap>
  );
}

function TicketSuccess({ event, order }: { event: EventDTO; order: OrderDTO }) {
  return (
    <section
      data-testid="checkout-success"
      aria-labelledby="success-heading"
      className="mt-8 flex max-w-[900px] flex-col gap-6 rounded-card border border-line bg-white p-6 md:p-10"
    >
      <div className="flex flex-wrap items-center gap-6">
        <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-full bg-paid-tint text-paid">
          <Check className="h-9 w-9" aria-hidden="true" />
        </span>
        <div className="flex min-w-[260px] flex-1 flex-col gap-1.5">
          <h2 id="success-heading" className="font-display text-3xl font-bold">
            You’re going!
          </h2>
          <p className="text-slate">Your ticket for {event.title} is ready in My tickets.</p>
        </div>
      </div>

      <div className="flex flex-col overflow-hidden rounded-card border border-line sm:flex-row">
        <div className="flex flex-1 flex-col gap-1.5 p-5">
          <p className="overline">Admit one</p>
          <p className="font-display text-2xl font-bold">{event.title}</p>
          <p className="text-slate">{formatEventDate(event.startDateTime)}</p>
        </div>
        <div className="flex flex-col justify-center gap-1.5 border-t-2 border-dashed border-line bg-[#FFF8E5] p-5 sm:w-[240px] sm:border-l-2 sm:border-t-0">
          <p className="text-sm text-slate">
            Order <span className="font-bold text-ink break-all">{order._id}</span>
          </p>
          <p className="text-sm text-slate">
            Total <span className="text-lg font-bold text-ink">{formatPrice(order.totalAmount, event.isFree)}</span>
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/tickets" className="btn btn-dark btn-lg">
          View my tickets
        </Link>
        <Link href="/" className="btn btn-outline btn-lg">
          Back to events
        </Link>
      </div>
    </section>
  );
}
