import Link from "next/link";

export function TicketMark({ size = 28, color = "#FFB400" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M4 8h32v8a4 4 0 0 0 0 8v8H4v-8a4 4 0 0 0 0-8z" fill={color} />
    </svg>
  );
}

export default function Logo({ dark = true }: { dark?: boolean }) {
  return (
    <Link href="/" className={`flex items-center gap-2.5 font-display text-2xl font-extrabold no-underline ${dark ? "text-white hover:text-white" : "text-ink hover:text-ink"}`} aria-label="Evently home">
      <TicketMark />
      Evently
    </Link>
  );
}
