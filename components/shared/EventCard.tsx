import Link from "next/link";
import { Chip, Skeleton } from "@/components/ui/kit";
import EventImage from "./EventImage";
import { formatEventDate, formatPrice, type Locale } from "@/lib/utils";
import type { EventDTO } from "@/lib/api/types";

export default function EventCard({ event, locale = "en", showOrganizer = true }: { event: EventDTO; locale?: Locale; showOrganizer?: boolean }) {
  const fa = locale === "fa";
  const title = fa && event.fa ? event.fa.title : event.title;
  return (
    <Link href={`/events/view?id=${event._id}`} className="card group flex flex-col text-ink no-underline transition-shadow hover:text-ink hover:shadow-lg" data-testid="event-card">
      <EventImage src={event.imageUrl} className="h-[180px] w-full object-cover" />
      <div className="flex flex-1 flex-col gap-2.5 px-5 pb-5 pt-4">
        <div className="flex gap-2">
          <Chip tone="amber">{formatPrice(event.price, event.isFree, locale)}</Chip>
          <Chip>{event.category?.name}</Chip>
        </div>
        <p className="text-sm text-slate">{formatEventDate(event.startDateTime, locale)}</p>
        <h3 className="font-display text-[22px] font-bold leading-tight group-hover:underline">{title}</h3>
        {showOrganizer && event.organizer && (
          <p className="text-sm text-slate">{fa ? "برگزارکننده: " : "By "}{event.organizer.firstName} {event.organizer.lastName}</p>
        )}
      </div>
    </Link>
  );
}

export function EventCardSkeleton() {
  return (
    <div className="card" aria-hidden="true">
      <Skeleton className="h-[180px] rounded-none" />
      <div className="space-y-3 p-5">
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-6 w-4/5" />
      </div>
    </div>
  );
}
