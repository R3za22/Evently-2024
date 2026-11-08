"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import MobileNav from "./MobileNav";
import { SignedIn, SignedOut, useAuthState } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const navLinks = [
  { label: "Discover", route: "/" },
  { label: "Create event", route: "/events/create" },
  { label: "My tickets", route: "/tickets" },
];

export default function Header() {
  const pathname = usePathname() || "/";
  const { user, signOut } = useAuthState();
  const fa = pathname.startsWith("/fa");
  return (
    <header className="bg-ink text-white">
      <div className="wrapper flex min-h-[72px] items-center gap-6">
        <Logo />
        <nav aria-label="Main" className="hidden flex-1 gap-2 md:flex">
          {navLinks.map((l) => {
            const active = l.route === "/" ? pathname === "/" || pathname === "" : pathname.startsWith(l.route);
            return (
              <Link key={l.route} href={l.route} aria-current={active ? "page" : undefined}
                className={cn("border-b-[3px] px-4 py-3 no-underline hover:text-white", active ? "border-marquee font-bold text-white" : "border-transparent text-[#D4D2E6]")}>
                {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <Link href={fa ? "/" : "/fa"} lang={fa ? "en" : "fa"} className="hidden rounded-btn px-3 py-2 text-sm font-bold text-[#D4D2E6] no-underline hover:text-white sm:block">
            {fa ? "English" : "فارسی"}
          </Link>
          <SignedIn>
            <span className="hidden items-center gap-2 sm:flex">
              <span aria-hidden="true" className="flex h-9 w-9 items-center justify-center rounded-full bg-marquee text-sm font-extrabold text-ink">{user?.initials}</span>
              <span className="sr-only">Signed in as {user?.name}</span>
            </span>
            <button type="button" onClick={() => signOut()} className="btn min-h-[44px] border border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white">
              Sign out
            </button>
          </SignedIn>
          <SignedOut>
            <Link href="/sign-in" className="btn btn-amber">Sign in</Link>
          </SignedOut>
          <MobileNav />
        </div>
      </div>
    </header>
  );
}
