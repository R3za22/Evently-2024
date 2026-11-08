"use client";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { navLinks } from "./Header";

export default function MobileNav() {
  return (
    <div className="md:hidden">
      <Sheet>
        <SheetTrigger className="flex h-11 w-11 items-center justify-center rounded-btn text-white" aria-label="Open menu">
          <Menu aria-hidden="true" />
        </SheetTrigger>
        <SheetContent className="flex flex-col gap-4 bg-paper">
          <SheetTitle className="font-display text-2xl font-extrabold">Evently</SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
          <nav aria-label="Mobile" className="flex flex-col gap-1">
            {[...navLinks, { label: "فارسی", route: "/fa" }].map((l) => (
              <Link key={l.route} href={l.route} className="rounded-btn px-3 py-3 text-lg font-bold text-ink no-underline hover:bg-indigo-tint">{l.label}</Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  );
}
