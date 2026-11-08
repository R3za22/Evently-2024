"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronLeft, MapPin } from "lucide-react";
import { api, type EventDTO } from "@/lib/api";
import { useAuthState } from "@/lib/auth";
import { useMe } from "@/lib/useMe";
import { formatEventDate, formatLongDate, formatPrice } from "@/lib/utils";
import { Chip, EmptyState, ErrorState, Skeleton } from "@/components/ui/kit";
import EventCard, { EventCardSkeleton } from "./EventCard";
import EventImage from "./EventImage";

const clock = (iso: string) => new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false });
const sameDay = (a: string, b: string) => new Date(a).toDateString() === new Date(b).toDateString();

function dateRange(start: string, end: string) {
  const first = `${formatLongDate(start)}, ${clock(start)}`;
  if (!end) return first;
  return sameDay(start, end) ? `${first} – ${clock(end)}` : `${first} – ${formatLongDate(end)}, ${clock(end)}`;
}

type LoadState = { kind: "loading" } | { kind: "missing" } | { kind: "error"; message: string } | { kind: "ready"; event: EventDTO };

/** Event detail, read from ?id=. Must render inside <Suspense>. */
export default function EventDetail() {
  const router = useRouter();
  const id = useSearchParams().get("id") ?? "";
  const { status: authStatus } = useAuthState();
  const { me } = useMe();

  const [state, setState] = useState<LoadState>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setState({ kind: "missing" });
      return;
    }
    let alive = true;
    setState({ kind: "loading" });
    api
      .getEvent(id)
      .then((event) => {
        if (alive) setState(event ? { kind: "ready", event } : { kind: "missing" });
      })
      .catch((e: unknown) => {
        if (alive) setState({ kind: "error", message: e instanceof Error ? e.message : "Please try again." });
      });
    return () => {
      alive = false;
    };
  }, [id, reloadKey]);

  const loadedEvent = state.kind === "ready" ? state.event : null;

  useEffect(() => {
    if (loadedEvent) document.title = `${loadedEvent.title} · Evently`;
  }, [loadedEvent]);

  if (state.kind === "loading") return <DetailSkeleton />;

  if (state.kind === "missing") {
    return (
      <div className="wrapper py-16">
        <EmptyState
          title="Event not found"
          body="This event may have been removed, or the link is wrong."
          action={
            <Link href="/" className="btn btn-outline">
              Browse all events
            </Link>
          }
        />
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="wrapper py-16">
        <ErrorState title="Couldn't load this event" message={state.message} onRetry={() => setReloadKey((k) => k + 1)} />
      </div>
    );
  }

  const event = state.event;
  const isOwner = !!me && me._id === event.organizer?._id;
  const signedOut = authStatus === "signedOut";
  const checkoutPath = `/checkout?id=${id}`;

  async function onDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await api.deleteEvent(id);
      router.push("/");
    } catch (e) {
      setDeleteError(e instanceof Error ? e.message : "Could not delete this event. Please try again.");
      setDeleting(false);
    }
  }

  return (
    <div className="wrapper flex flex-col gap-8 pb-16 pt-8">
      <Link href="/" className="inline-flex min-h-[44px] w-fit items-center gap-1.5 font-bold no-underline">
        <ChevronLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
        All events
      </Link>

      <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-7">
          {event.imageUrl ? (
            <EventImage eager src={event.imageUrl} alt={event.title} className="h-[280px] w-full rounded-3xl object-cover sm:h-[360px] lg:h-[440px]" />
          ) : (
            <div className="h-[280px] w-full rounded-3xl bg-indigo sm:h-[360px] lg:h-[440px]" aria-hidden="true" />
          )}

          <div className="flex flex-wrap gap-2">
            <Chip tone="amber" className="px-3.5 py-1.5 text-[13px]">
              {formatPrice(event.price, event.isFree)}
            </Chip>
            {event.category?.name && <Chip className="px-3.5 py-1.5 text-[13px]">{event.category.name}</Chip>}
          </div>

          <h1 className="break-words font-display text-4xl font-extrabold leading-[1.05] tracking-[-1px] sm:text-5xl lg:text-[56px] lg:tracking-[-1.5px]">
            {event.title}
          </h1>

          {event.organizer && (
            <p className="text-[15px] text-slate">
              Organised by <span className="font-bold text-ink">{event.organizer.firstName} {event.organizer.lastName}</span>
            </p>
          )}

          <ul className="flex flex-col gap-4 text-base">
            <li className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-indigo" aria-hidden="true" />
              <span>{dateRange(event.startDateTime, event.endDateTime)}</span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-indigo" aria-hidden="true" />
              <span className="break-words">{event.location}</span>
            </li>
          </ul>

          <section aria-labelledby="about-heading" className="flex flex-col gap-3">
            <h2 id="about-heading" className="font-display text-2xl font-bold">
              About this event
            </h2>
            {event.description && <p className="max-w-[680px] whitespace-pre-line text-[17px] leading-relaxed text-[#2B2945]">{event.description}</p>}
            {event.url && (
              <a href={event.url} target="_blank" rel="noopener noreferrer" className="break-all font-bold">
                {event.url}
              </a>
            )}
          </section>
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-5 lg:sticky lg:top-6 lg:w-[400px] xl:w-[440px]">
          <div className="overflow-hidden rounded-3xl border border-line bg-white">
            <div className="flex flex-col gap-3.5 p-7">
              <span className="overline">Admit one</span>
              <p className="font-display text-[44px] font-extrabold leading-none">{formatPrice(event.price, event.isFree)}</p>
              <p className="text-sm text-slate">{formatEventDate(event.startDateTime)}</p>
            </div>
            {!isOwner && (
              <div className="flex flex-col gap-3 border-t-2 border-dashed border-line bg-[#FFF8E5] p-6">
                <Link
                  href={signedOut ? `/sign-in?next=${encodeURIComponent(checkoutPath)}` : checkoutPath}
                  className="btn btn-primary btn-lg w-full text-white"
                >
                  {event.isFree ? "Get free ticket" : "Get tickets"}
                </Link>
                <p className="text-center text-[13px] text-slate">
                  {signedOut ? "Sign in required. You’ll pay securely with Stripe." : "You’ll pay securely with Stripe."}
                </p>
              </div>
            )}
          </div>

          {isOwner && (
            <section aria-labelledby="organiser-heading" className="flex flex-col gap-3 rounded-[20px] border border-line bg-white p-5">
              <h2 id="organiser-heading" className="font-bold">
                Your own event?
              </h2>
              <div className="flex flex-wrap gap-2.5">
                <Link href={`/events/edit?id=${id}`} className="btn btn-outline">
                  Edit event
                </Link>
                <Link href={`/orders?id=${id}`} className="btn btn-outline">
                  View orders
                </Link>
                <button
                  type="button"
                  onClick={() => setConfirming(true)}
                  disabled={confirming}
                  className="btn border-2 border-error bg-transparent text-error hover:bg-error-tint hover:text-error"
                >
                  Delete event
                </button>
              </div>
              {confirming && (
                <div role="alertdialog" aria-labelledby="delete-question" className="flex flex-col gap-3 rounded-btn border border-error/30 bg-error-tint p-4">
                  <p id="delete-question" className="font-bold">
                    Delete this event? This also removes its orders.
                  </p>
                  <div className="flex flex-wrap gap-2.5">
                    <button type="button" onClick={onDelete} disabled={deleting} className="btn btn-danger">
                      Yes, delete
                    </button>
                    <button type="button" onClick={() => setConfirming(false)} disabled={deleting} className="btn btn-outline">
                      Cancel
                    </button>
                  </div>
                  {deleteError && (
                    <p role="alert" className="text-sm text-error">
                      {deleteError}
                    </p>
                  )}
                </div>
              )}
              <span className="text-[13px] text-slate">Shown to the organiser only.</span>
            </section>
          )}
        </aside>
      </div>

      {event.category?._id && <RelatedEvents eventId={event._id} categoryId={event.category._id} />}
    </div>
  );
}

function RelatedEvents({ eventId, categoryId }: { eventId: string; categoryId: string }) {
  const [state, setState] = useState<{ kind: "loading" } | { kind: "error" } | { kind: "ready"; events: EventDTO[] }>({ kind: "loading" });

  useEffect(() => {
    let alive = true;
    setState({ kind: "loading" });
    api
      .getRelatedEvents({ categoryId, eventId, limit: 3 })
      .then((res) => {
        if (alive) setState({ kind: "ready", events: res.data });
      })
      .catch(() => {
        if (alive) setState({ kind: "error" });
      });
    return () => {
      alive = false;
    };
  }, [categoryId, eventId]);

  // Hidden on error and when there is nothing related.
  if (state.kind === "error") return null;
  if (state.kind === "ready" && state.events.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="flex flex-col gap-6">
      <h2 id="related-heading" className="font-display text-3xl font-extrabold">
        Related events
      </h2>
      <div className="grid gap-6 md:grid-cols-3" aria-busy={state.kind === "loading"}>
        {state.kind === "loading"
          ? [0, 1, 2].map((i) => <EventCardSkeleton key={i} />)
          : state.events.map((e) => <EventCard key={e._id} event={e} />)}
      </div>
    </section>
  );
}

function DetailSkeleton() {
  return (
    <div className="wrapper flex flex-col gap-8 pb-16 pt-8" aria-busy="true">
      <span className="sr-only">Loading event</span>
      <Skeleton className="h-6 w-28" />
      <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <Skeleton className="h-[280px] w-full rounded-3xl sm:h-[360px] lg:h-[440px]" />
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-12 w-4/5" />
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-24 w-full" />
        </div>
        <Skeleton className="h-64 w-full shrink-0 rounded-3xl lg:w-[400px] xl:w-[440px]" />
      </div>
    </div>
  );
}
