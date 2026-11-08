import * as React from "react";
import Link from "next/link";
import { AlertCircle, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} aria-hidden="true" />;
}

export function EmptyState({ title, body, action, icon }: { title: string; body?: string; action?: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 rounded-card border border-dashed border-line bg-white px-6 py-14 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-tint text-indigo">{icon ?? <Search aria-hidden="true" />}</div>
      <p className="font-display text-xl font-bold">{title}</p>
      {body && <p className="max-w-md text-slate">{body}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry, retryLabel = "Try again", title = "Something went wrong" }: { message?: string; onRetry?: () => void; retryLabel?: string; title?: string }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-card border border-error/30 bg-error-tint p-5">
      <AlertCircle className="mt-0.5 shrink-0 text-error" aria-hidden="true" />
      <div className="flex-1">
        <p className="font-bold">{title}</p>
        <p className="text-sm text-slate">{message ?? "Please check your connection and try again."}</p>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn btn-outline min-h-[44px]">
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export function Pagination({ page, totalPages, onChange, labels }: { page: number; totalPages: number; onChange: (p: number) => void; labels?: { prev: string; next: string; page: (p: number, t: number) => string } }) {
  if (totalPages <= 1) return null;
  const l = labels ?? { prev: "Previous", next: "Next", page: (p: number, t: number) => `Page ${p} of ${t}` };
  return (
    <nav aria-label="Pagination" className="mt-2 flex items-center justify-center gap-2">
      <button type="button" className="btn btn-outline" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        <ChevronLeft className="h-4 w-4 rtl:rotate-180" aria-hidden="true" /> {l.prev}
      </button>
      <span className="px-3 text-sm text-slate" aria-live="polite">{l.page(page, totalPages)}</span>
      <button type="button" className="btn btn-outline" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
        {l.next} <ChevronRight className="h-4 w-4 rtl:rotate-180" aria-hidden="true" />
      </button>
    </nav>
  );
}

export function Chip({ tone = "tint", children, className }: { tone?: "tint" | "amber" | "paid" | "error" | "ink"; children: React.ReactNode; className?: string }) {
  const tones = { tint: "bg-indigo-tint text-indigo-dark", amber: "bg-marquee text-ink", paid: "bg-paid-tint text-paid", error: "bg-error-tint text-error", ink: "bg-ink text-white" };
  return <span className={cn("chip", tones[tone], className)}>{children}</span>;
}

export function TextLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return <Link href={href} className={cn("font-bold underline-offset-4 hover:underline", className)}>{children}</Link>;
}

/** Stable shell for a page section with a heading. */
export function PageHeading({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-lg text-slate">{subtitle}</p>}
      </div>
      {actions}
    </div>
  );
}
