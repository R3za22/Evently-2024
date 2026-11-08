"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { api, type EventDTO, type OrderItemDTO } from "@/lib/api";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/kit";
import { cn, formatEventDate } from "@/lib/utils";

const DEBOUNCE_MS = 300;
const ORGANISER_ONLY = /organi[sz]er/i;
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

type OrdersState = { status: "loading" | "ready" | "error"; items: OrderItemDTO[] | null; message?: string };
type EventState = { status: "loading" } | { status: "missing" } | { status: "error" } | { status: "ready"; event: EventDTO };

function Cell({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <td className={cn("flex items-center justify-between gap-4 py-2 md:table-cell md:px-5 md:py-4", className)}>
      <span className="text-sm text-slate md:hidden">{label}</span>
      <span className="min-w-0 break-all">{children}</span>
    </td>
  );
}

/** Organiser view of one event's orders, read from ?id=. Must render inside <Suspense>. */
export default function OrdersView() {
  const eventId = useSearchParams().get("id") ?? "";

  const [input, setInput] = useState("");
  const [query, setQuery] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [orders, setOrders] = useState<OrdersState>({ status: "loading", items: null });
  const [eventState, setEventState] = useState<EventState>({ status: "loading" });

  // 300ms debounce on the buyer search.
  useEffect(() => {
    const t = setTimeout(() => setQuery(input.trim()), DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [input]);

  useEffect(() => {
    if (!eventId) return;
    let alive = true;
    setEventState({ status: "loading" });
    api
      .getEvent(eventId)
      .then((event) => {
        if (alive) setEventState(event ? { status: "ready", event } : { status: "missing" });
      })
      .catch(() => {
        if (alive) setEventState({ status: "error" });
      });
    return () => {
      alive = false;
    };
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    let alive = true;
    // Keep the previous rows visible while a new search loads.
    setOrders((prev) => ({ ...prev, status: "loading" }));
    api
      .getOrdersByEvent({ eventId, searchString: query })
      .then((items) => {
        if (alive) setOrders({ status: "ready", items });
      })
      .catch((e: unknown) => {
        if (alive) setOrders({ status: "error", items: null, message: e instanceof Error ? e.message : undefined });
      });
    return () => {
      alive = false;
    };
  }, [eventId, query, attempt]);

  if (!eventId) {
    return (
      <div className="wrapper py-16">
        <EmptyState
          title="Choose an event"
          body="Open an event's orders from My tickets."
          action={
            <Link href="/tickets" className="btn btn-primary">
              Back to my tickets
            </Link>
          }
        />
      </div>
    );
  }

  const items = orders.items ?? [];
  const sold = items.length;
  const revenue = items.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  const title = eventState.status === "ready" ? eventState.event.title : eventState.status === "missing" ? "Event not found" : "Event orders";
  const showSkeleton = orders.items === null || (orders.status === "loading" && items.length === 0);

  return (
    <div className="wrapper flex flex-col gap-8 py-10 md:py-14">
      <header className="flex flex-col gap-3">
        <Link href="/tickets" className="inline-flex min-h-[44px] items-center gap-1.5 font-bold text-ink no-underline hover:underline">
          <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
          My tickets
        </Link>
        <span className="overline">Organiser · event orders</span>
        {eventState.status === "loading" ? (
          <Skeleton className="h-12 w-2/3" />
        ) : (
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
        )}
      </header>

      <section aria-label="Summary" className="grid grid-cols-2 gap-4">
        <div className="card p-5">
          <p className="text-sm text-slate">Tickets sold</p>
          <p className="font-display text-3xl font-extrabold md:text-4xl">{orders.items ? sold : "—"}</p>
        </div>
        <div className="card p-5">
          <p className="text-sm text-slate">Revenue</p>
          <p className="font-display text-3xl font-extrabold md:text-4xl">{orders.items ? usd.format(revenue) : "—"}</p>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <div className="field max-w-md">
          <label htmlFor="orders-buyer-search">Search by buyer name</label>
          <input
            id="orders-buyer-search"
            type="search"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="rounded-field"
          />
        </div>

        {orders.status === "error" ? (
          ORGANISER_ONLY.test(orders.message ?? "") ? (
            <div className="flex flex-col gap-4">
              <ErrorState title="Organiser access only" message={orders.message} />
              <Link href="/tickets" className="btn btn-outline self-start">
                Back to my tickets
              </Link>
            </div>
          ) : (
            <ErrorState title="We couldn’t load orders" message={orders.message} onRetry={() => setAttempt((n) => n + 1)} />
          )
        ) : showSkeleton ? (
          <div className="card flex flex-col gap-4 p-5">
            <span className="sr-only">Loading orders</span>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} data-testid="orders-skeleton" className="flex flex-col gap-2">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          query ? (
            <EmptyState
              title="No orders match your search"
              body="Check the spelling or try part of the buyer’s name."
              action={
                <button type="button" className="btn btn-outline" onClick={() => setInput("")}>
                  Clear search
                </button>
              }
            />
          ) : (
            <EmptyState
              title="No orders yet"
              body="Orders appear here as soon as someone buys a ticket. Share your event link to get started."
              action={
                <Link href={`/events/view?id=${eventId}`} className="btn btn-primary">
                  View event page
                </Link>
              }
            />
          )
        ) : (
          <div className="card">
            <table aria-busy={orders.status === "loading"} className="block w-full text-left text-[15px] md:table">
              <caption className="sr-only">Orders for this event</caption>
              <thead className="sr-only md:not-sr-only md:table-header-group">
                <tr className="bg-ink text-left text-white md:table-row">
                  <th scope="col" className="px-5 py-3.5 text-xs font-bold uppercase tracking-[1px]">Order ID</th>
                  <th scope="col" className="px-5 py-3.5 text-xs font-bold uppercase tracking-[1px]">Buyer</th>
                  <th scope="col" className="px-5 py-3.5 text-xs font-bold uppercase tracking-[1px]">Date</th>
                  <th scope="col" className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-[1px]">Amount</th>
                </tr>
              </thead>
              <tbody className="block md:table-row-group">
                {items.map((o) => (
                  <tr
                    key={o._id}
                    data-testid="order-row"
                    className="block border-t-[1.5px] border-dashed border-line px-4 py-3 first:border-t-0 md:table-row md:px-0 md:py-0"
                  >
                    <Cell label="Order ID" className="font-bold">{o._id}</Cell>
                    <Cell label="Buyer">{o.buyer}</Cell>
                    <Cell label="Date" className="text-slate">{formatEventDate(o.createdAt)}</Cell>
                    <Cell label="Amount" className="font-bold md:text-right">{usd.format(Number(o.totalAmount) || 0)}</Cell>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
