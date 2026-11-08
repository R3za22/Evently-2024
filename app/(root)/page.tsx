import Link from "next/link";
import { Suspense } from "react";
import Discover from "@/components/shared/Discover";

export const metadata = { title: "Discover events" };

function Ticket() {
  return (
    <div className="flex h-[260px] w-full max-w-[520px] items-stretch" aria-hidden="true">
      <div className="flex flex-1 flex-col justify-between rounded-l-3xl bg-indigo p-7 text-white">
        <span className="overline text-[#E9E7FC]">Admit one</span>
        <div className="font-display text-4xl font-extrabold leading-[1.05]">
          Your event
          <br />
          here
        </div>
        <svg viewBox="0 0 24 24" className="h-10 w-10" fill="none" stroke="#FFB400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 18V5l12-2v13" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </div>
      <div className="perforation w-0" />
      <div className="flex w-[104px] items-center justify-center rounded-r-3xl bg-marquee">
        <span className="text-sm font-extrabold tracking-[3px] [writing-mode:vertical-rl]">No. 0001</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="wrapper flex flex-wrap items-center gap-12 pb-12 pt-14 md:pt-[72px]">
        <div className="flex min-w-0 flex-[1_1_560px] flex-col gap-6">
          <span className="overline">Events near you and online</span>
          <h1 className="font-display text-[44px] font-extrabold leading-none tracking-[-1.5px] sm:text-6xl lg:text-[72px] lg:tracking-[-2px]">
            Find your next night out.
          </h1>
          <p className="max-w-[520px] text-lg text-slate md:text-xl">
            Browse concerts, workshops and meetups, or host your own and sell tickets in minutes.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="#events" className="btn btn-primary btn-lg text-white">
              Explore events
            </Link>
            <Link href="/events/create" className="btn btn-outline btn-lg">
              Host an event
            </Link>
          </div>
        </div>
        <div className="flex min-w-0 flex-[1_1_400px] items-center justify-center">
          <Ticket />
        </div>
      </section>

      <section id="events" className="wrapper flex scroll-mt-6 flex-col gap-7 pb-20 pt-6">
        <h2 className="font-display text-4xl font-extrabold tracking-[-0.5px]">Upcoming events</h2>
        <Suspense fallback={null}>
          <Discover />
        </Suspense>
      </section>
    </>
  );
}
