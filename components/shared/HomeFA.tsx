"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Music, Search, Ticket, type LucideIcon } from "lucide-react";
import { api, type EventDTO } from "@/lib/api";
import { EmptyState, ErrorState } from "@/components/ui/kit";
import EventCard, { EventCardSkeleton } from "./EventCard";

const LIMIT = 6;

/** Persian digits via the runtime's fa-IR locale. */
const toFa = (n: number, opts?: Intl.NumberFormatOptions) => n.toLocaleString("fa-IR", opts);

const STEPS: { title: string; body: string; icon: LucideIcon }[] = [
  { title: "جستجو", body: "رویدادهای مورد علاقه‌ات را در فهرست پیدا کن.", icon: Search },
  { title: "خرید بلیت", body: "در چند کلیک بلیت خودت را رزرو و پرداخت کن.", icon: Ticket },
  { title: "لذت ببر", body: "با بلیت خودت به رویداد برو و از آن لذت ببر.", icon: Music },
];

function HeroTicket() {
  return (
    <div aria-hidden="true" className="flex h-[240px] w-full max-w-[520px] items-stretch overflow-hidden rounded-3xl">
      <div className="flex flex-1 flex-col justify-between bg-indigo p-7 text-white">
        <span className="text-[13px] font-bold text-[#E9E7FC]">ورود برای یک نفر</span>
        <div className="text-[34px] font-bold leading-[1.4]">
          رویداد تو
          <br />
          اینجا
        </div>
        <Music className="h-9 w-9 text-marquee" strokeWidth={2} />
      </div>
      <div className="perforation w-0" />
      <div className="flex w-24 items-center justify-center bg-marquee">
        <span className="text-sm font-bold tracking-[3px] text-ink [writing-mode:vertical-rl]">
          شماره {toFa(1, { minimumIntegerDigits: 4, useGrouping: false })}
        </span>
      </div>
    </div>
  );
}

/** Persian landing page: hero, the first upcoming events, and a three-step strip. */
export default function HomeFA() {
  const [events, setEvents] = useState<EventDTO[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    api
      .getEvents({ limit: LIMIT })
      .then((res) => {
        if (alive) setEvents(res.data.slice(0, LIMIT));
      })
      .catch(() => {
        if (alive) setFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  const loading = events === null && !failed;
  const status = loading ? "در حال بارگذاری رویدادها" : failed ? "بارگذاری رویدادها ناموفق بود" : "";

  return (
    <div dir="rtl" lang="fa" className="font-fa">
      <div className="wrapper flex justify-start pt-6">
        <Link href="/" lang="en" className="inline-flex min-h-[44px] items-center font-bold">
          English
        </Link>
      </div>

      <section className="wrapper flex flex-wrap items-center gap-12 pb-10 pt-10 md:pt-14">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-5">
          <span className="text-[13px] font-bold text-slate">رویدادهای نزدیک شما و آنلاین</span>
          <h1 className="font-fa text-[40px] font-bold leading-[1.35] sm:text-5xl lg:text-[60px]">شب بعدی‌ات را پیدا کن.</h1>
          <p className="max-w-[520px] text-lg leading-[1.9] text-slate md:text-[19px]">
            کنسرت، کارگاه و دورهمی‌ها را ببین، یا رویداد خودت را بساز و در چند دقیقه بلیت بفروش.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="#events" className="btn btn-primary btn-lg">
              دیدن رویدادها
            </Link>
            <Link href="/events/create" className="btn btn-outline btn-lg">
              میزبان شو
            </Link>
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_400px] justify-center">
          <HeroTicket />
        </div>
      </section>

      <section id="events" className="wrapper flex scroll-mt-6 flex-col gap-7 pb-16 pt-10 [&_.font-display]:font-fa">
        <h2 className="font-fa text-3xl font-bold md:text-[34px]">رویدادهای پیش رو</h2>
        <p className="sr-only" aria-live="polite">
          {status}
        </p>

        {failed ? (
          <ErrorState
            title="رویدادها بارگذاری نشد"
            message="اتصال خود را بررسی کنید و دوباره تلاش کنید."
            retryLabel="تلاش دوباره"
            onRetry={() => {
              setFailed(false);
              setAttempt((a) => a + 1);
            }}
          />
        ) : events !== null && events.length === 0 ? (
          <EmptyState
            title="رویدادی پیدا نشد"
            body="هنوز رویدادی منتشر نشده است. می‌توانی اولین رویداد را خودت بسازی."
            action={
              <Link href="/events/create" className="btn btn-outline">
                ساخت رویداد
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-6" aria-busy={loading}>
            {loading
              ? Array.from({ length: LIMIT }, (_, i) => <EventCardSkeleton key={i} />)
              : events?.map((event) => <EventCard key={event._id} event={event} locale="fa" />)}
          </div>
        )}
      </section>

      <section aria-labelledby="how-it-works" className="wrapper flex flex-col gap-7 pb-20">
        <h2 id="how-it-works" className="font-fa text-3xl font-bold md:text-[34px]">
          چطور کار می‌کند
        </h2>
        <ol className="flex flex-col gap-4 md:flex-row md:gap-6">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={step.title} className="relative flex flex-1 gap-4 rounded-card border border-line bg-white p-6">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-indigo-tint text-indigo-dark">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold text-slate">مرحله {toFa(i + 1)}</span>
                  <h3 className="font-fa text-xl font-bold">{step.title}</h3>
                  <p className="leading-[1.8] text-slate">{step.body}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight aria-hidden="true" className="absolute top-1/2 -end-[22px] hidden h-5 w-5 -translate-y-1/2 text-slate rtl:rotate-180 md:block" />
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
