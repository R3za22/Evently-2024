"use client";

import { useEffect, useId, useState, type KeyboardEvent } from "react";
import Link from "next/link";
import { api, type EventDTO, type OrderDTO, type Paged } from "@/lib/api";
import { Chip, EmptyState, ErrorState, PageHeading, Pagination, Skeleton } from "@/components/ui/kit";
import { cn, formatEventDate } from "@/lib/utils";
import EventCard, { EventCardSkeleton } from "./EventCard";
import EventImage from "./EventImage";

const PAGE_SIZE = 6;
const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

type Tab = "attending" | "organised";
const TABS: { id: Tab; label: string }[] = [
  { id: "attending", label: "Attending" },
  { id: "organised", label: "Organised" },
];

type Query = { page: number; limit: number };
type ListState<T> = { kind: "loading" } | { kind: "error"; message?: string } | { kind: "ready"; items: T[]; totalPages: number };

// Module-level fetchers keep the hook's effect dependencies stable.
const fetchOrders = (a: Query) => api.getMyOrders(a);
const fetchEvents = (a: Query) => api.getMyEvents(a);

/** Paged list with its own page, loading, error and retry state. */
function usePagedList<T>(fetcher: (a: Query) => Promise<Paged<T>>) {
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ListState<T>>({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    setState({ kind: "loading" });
    fetcher({ page, limit: PAGE_SIZE })
      .then((res) => {
        if (alive) setState({ kind: "ready", items: res.data, totalPages: res.totalPages });
      })
      .catch((e: unknown) => {
        if (alive) setState({ kind: "error", message: e instanceof Error ? e.message : undefined });
      });
    return () => {
      alive = false;
    };
  }, [fetcher, page, attempt]);

  return { page, setPage, state, retry: () => setAttempt((n) => n + 1) };
}

function TicketRow({ order }: { order: OrderDTO }) {
  const { event } = order;
  const total = Number(order.totalAmount) || 0;
  const paid = total > 0;
  return (
    <li data-testid="ticket-row" className="flex min-h-[150px] items-stretch">
      <div className="flex min-w-0 flex-1 gap-4 rounded-l-card border border-r-0 border-line bg-white p-4 md:p-5">
        <EventImage src={event.imageUrl} className="h-24 w-24 shrink-0 rounded-field object-cover" />
        <div className="flex min-w-0 flex-col gap-1.5">
          <h3 className="font-display text-xl font-bold leading-tight">
            <Link href={`/events/view?id=${event._id}`} className="text-ink no-underline hover:underline">
              {event.title}
            </Link>
          </h3>
          <p className="text-sm text-slate">{formatEventDate(event.startDateTime)}</p>
          <p className="text-sm text-slate">{event.location}</p>
          <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
            <span className="font-bold">{usd.format(total)}</span>
            <Chip tone={paid ? "paid" : "tint"}>{paid ? "Paid" : "Free"}</Chip>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="w-0 border-l-2 border-dashed border-ink" />
      <div className="flex w-[104px] shrink-0 flex-col items-center justify-center gap-1 rounded-r-card bg-marquee p-2 text-center text-ink md:w-[120px]">
        <span className="text-[11px] font-bold uppercase tracking-[1px]">Order</span>
        <span className="break-all text-xs font-bold">{order._id}</span>
      </div>
    </li>
  );
}

function AttendingPanel() {
  const { page, setPage, state, retry } = usePagedList(fetchOrders);

  if (state.kind === "loading") {
    return (
      <div className="grid gap-6 md:grid-cols-2">
        <span className="sr-only">Loading your tickets</span>
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-[150px] w-full rounded-card" />
        ))}
      </div>
    );
  }
  if (state.kind === "error") {
    return <ErrorState title="We couldn’t load your tickets" message={state.message} onRetry={retry} />;
  }
  if (state.items.length === 0) {
    return (
      <EmptyState
        title="No tickets yet"
        body="When you buy a ticket it shows up here with its order reference."
        action={
          <Link href="/" className="btn btn-primary">
            Explore events
          </Link>
        }
      />
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <ul className="grid gap-6 md:grid-cols-2">
        {state.items.map((order) => (
          <TicketRow key={order._id} order={order} />
        ))}
      </ul>
      <Pagination page={page} totalPages={state.totalPages} onChange={setPage} />
    </div>
  );
}

function OrganisedPanel() {
  const { page, setPage, state, retry } = usePagedList(fetchEvents);

  if (state.kind === "loading") {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <span className="sr-only">Loading your events</span>
        {[0, 1, 2].map((i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    );
  }
  if (state.kind === "error") {
    return <ErrorState title="We couldn’t load your events" message={state.message} onRetry={retry} />;
  }
  if (state.items.length === 0) {
    return (
      <EmptyState
        title="You haven’t organised any events"
        body="Events you publish appear here, with links to their orders."
        action={
          <Link href="/events/create" className="btn btn-primary">
            Create event
          </Link>
        }
      />
    );
  }
  return (
    <div className="flex flex-col gap-6">
      <ul className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {state.items.map((event: EventDTO) => (
          <li key={event._id} className="flex flex-col gap-3">
            <EventCard event={event} showOrganizer={false} />
            <div className="flex gap-2">
              <Link href={`/orders?id=${event._id}`} className="btn flex-1 bg-indigo-tint text-indigo-dark hover:brightness-95 hover:text-indigo-dark">
                View orders
              </Link>
              <Link href={`/events/edit?id=${event._id}`} className="btn btn-outline flex-1">
                Edit
              </Link>
            </div>
          </li>
        ))}
      </ul>
      <Pagination page={page} totalPages={state.totalPages} onChange={setPage} />
    </div>
  );
}

export default function TicketsView() {
  const baseId = useId();
  const [tab, setTab] = useState<Tab>("attending");

  const select = (next: Tab) => {
    setTab(next);
    document.getElementById(`${baseId}-tab-${next}`)?.focus();
  };

  const onTabKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = TABS.findIndex((t) => t.id === tab);
    const step = e.key === "ArrowRight" ? 1 : TABS.length - 1;
    select(TABS[(i + step) % TABS.length].id);
  };

  return (
    <div className="wrapper flex flex-col gap-8 py-10 md:py-14">
      <PageHeading title="My tickets" subtitle="Tickets you bought and events you organise." />

      <div role="tablist" aria-label="Tickets and events" onKeyDown={onTabKeyDown} className="flex gap-2 border-b-2 border-line">
        {TABS.map((t) => {
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${t.id}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel-${t.id}`}
              tabIndex={selected ? 0 : -1}
              data-testid={`tab-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cn(
                "-mb-[2px] min-h-[44px] border-b-[3px] px-4 font-display text-lg font-bold transition-colors",
                selected ? "border-marquee text-ink" : "border-transparent text-slate hover:text-ink",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`${baseId}-panel-attending`} aria-labelledby={`${baseId}-tab-attending`} hidden={tab !== "attending"}>
        <AttendingPanel />
      </div>
      <div role="tabpanel" id={`${baseId}-panel-organised`} aria-labelledby={`${baseId}-tab-organised`} hidden={tab !== "organised"}>
        <OrganisedPanel />
      </div>
    </div>
  );
}
