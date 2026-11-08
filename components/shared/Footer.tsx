import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-16 bg-ink text-[#D4D2E6]">
      <div className="wrapper flex flex-col items-start justify-between gap-6 py-10 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Logo />
          <p className="text-sm">Host, discover and book events. Built by Reza Ghamar.</p>
        </div>
        <div className="space-y-1 text-sm sm:text-end">
          <p>
            Based on the{" "}
            <a href="https://www.youtube.com/@javascriptmastery" className="font-bold text-white underline" rel="noreferrer noopener" target="_blank">JSM Evently tutorial</a>{" "}
            — redesigned and extended.
          </p>
          <p><Link href="/privacy" className="text-white underline">About &amp; privacy</Link></p>
        </div>
      </div>
    </footer>
  );
}
