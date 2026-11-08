"use client";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { api, type Category, type EventDTO, type Paged } from "@/lib/api";
import { searchSchema } from "@/lib/validation";
import { EmptyState, ErrorState, Pagination } from "@/components/ui/kit";
import EventCard, { EventCardSkeleton } from "./EventCard";
import { cn } from "@/lib/utils";

const LIMIT = 6;

/** Search, category filter and paged grid. Filters live in the URL (q, category, page). Must render inside <Suspense>. */
export default function Discover() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const parsed = searchSchema.safeParse({
    query: sp.get("q") ?? "",
    category: sp.get("category") ?? "",
    page: sp.get("page") ?? 1,
    limit: LIMIT,
  });
  const { query, category, page } = parsed.success ? parsed.data : { query: "", category: "", page: 1 };

  const [text, setText] = useState(query);
  const [reloadKey, setReloadKey] = useState(0);
  const [result, setResult] = useState<Paged<EventDTO> | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [cats, setCats] = useState<Category[]>([]);
  const [catsError, setCatsError] = useState(false);
  const [catsKey, setCatsKey] = useState(0);

  // Keep the input in step with the URL (e.g. after Clear filters or browser back/forward).
  useEffect(() => {
    setText(query);
  }, [query]);

  useEffect(() => {
    let alive = true;
    setCatsError(false);
    api
      .getCategories()
      .then((c) => {
        if (alive) setCats(c);
      })
      .catch(() => {
        if (alive) setCatsError(true);
      });
    return () => {
      alive = false;
    };
  }, [catsKey]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setEventsError(null);
    api
      .getEvents({ query, category, page, limit: LIMIT })
      .then((res) => {
        if (alive) setResult(res);
      })
      .catch((e: unknown) => {
        if (alive) setEventsError(e instanceof Error ? e.message : "Please try again.");
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [query, category, page, reloadKey]);

  const navigate = useCallback(
    (next: { q?: string; category?: string; page?: number }) => {
      const p = new URLSearchParams();
      const q = (next.q ?? query).trim();
      const c = next.category ?? category;
      const pg = next.page ?? page;
      if (q) p.set("q", q);
      if (c) p.set("category", c);
      if (pg > 1) p.set("page", String(pg));
      const s = p.toString();
      router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [router, pathname, query, category, page]
  );

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = text.trim();
    if (q === query) setReloadKey((k) => k + 1);
    else navigate({ q, page: 1 });
  }

  function clearFilters() {
    setText("");
    router.replace(pathname, { scroll: false });
  }

  function changePage(p: number) {
    navigate({ page: p });
    document.getElementById("events")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const events = result?.data ?? [];
  const total = result?.total ?? 0;
  const totalPages = result?.totalPages ?? 0;
  const showEmpty = !loading && !eventsError && events.length === 0;
  const announce = loading ? "Loading events" : eventsError ? "Could not load events" : `${total} events found`;

  const chips = [{ key: "all", label: "All", value: "" }, ...cats.map((c) => ({ key: c._id, label: c.name, value: c.name }))];

  return (
    <div className="flex flex-col gap-7">
      {catsError && (
        <ErrorState title="Couldn't load categories" message="Events are still available. Try loading the filters again." onRetry={() => setCatsKey((k) => k + 1)} />
      )}

      <form role="search" onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[260px] flex-[2_1_360px] flex-col gap-1.5">
          <label htmlFor="event-search" className="text-sm font-bold">
            Search events by title
          </label>
          <div className="flex min-h-[52px] items-center gap-2.5 rounded-btn border-[1.5px] border-[#8C899E] bg-white px-4 focus-within:border-indigo">
            <Search className="h-5 w-5 shrink-0 text-slate" aria-hidden="true" />
            <input
              id="event-search"
              type="search"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Search by title"
              maxLength={100}
              autoComplete="off"
              className="min-h-[48px] w-full bg-transparent text-base text-ink placeholder:text-slate/70 outline-none"
            />
          </div>
        </div>

        <div className="flex min-w-[200px] flex-[1_1_240px] flex-col gap-1.5">
          <label htmlFor="event-category" className="text-sm font-bold">
            Category
          </label>
          <select
            id="event-category"
            value={category}
            onChange={(e) => navigate({ category: e.target.value, page: 1 })}
            className="min-h-[52px] w-full rounded-btn border-[1.5px] border-[#8C899E] bg-white px-4 text-base text-ink"
          >
            <option value="">All categories</option>
            {cats.map((c) => (
              <option key={c._id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn btn-dark btn-lg">
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {chips.map((chip) => {
          const active = category === chip.value;
          return (
            <button
              key={chip.key}
              type="button"
              aria-pressed={active}
              onClick={() => navigate({ category: chip.value, page: 1 })}
              className={cn(
                "min-h-[44px] rounded-full border-[1.5px] border-ink px-[18px] text-sm font-bold transition-colors",
                active ? "bg-ink text-white" : "bg-white text-ink hover:bg-indigo-tint"
              )}
            >
              {chip.label}
            </button>
          );
        })}
      </div>

      <p className="sr-only" aria-live="polite">
        {announce}
      </p>

      {eventsError ? (
        <ErrorState title="Couldn't load events" message={eventsError} onRetry={() => setReloadKey((k) => k + 1)} />
      ) : showEmpty ? (
        <EmptyState
          title="No events found"
          body={`Nothing matches ${query ? `“${query}”` : "your filters"}${category ? ` in ${category}` : ""}. Try another title or clear the category.`}
          action={
            <button type="button" className="btn btn-outline" onClick={clearFilters}>
              Clear filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6" aria-busy={loading}>
          {loading
            ? Array.from({ length: LIMIT }, (_, i) => (
                <div key={i} data-testid="events-skeleton">
                  <EventCardSkeleton />
                </div>
              ))
            : events.map((event) => <EventCard key={event._id} event={event} />)}
        </div>
      )}

      {!loading && !eventsError && <Pagination page={page} totalPages={totalPages} onChange={changePage} />}
    </div>
  );
}
