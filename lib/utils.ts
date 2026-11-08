import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export { escapeRegex } from "@/lib/validation";


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export type Locale = "en" | "fa";

/** Prefix for root-absolute public assets when the app is served under a base path (static demo). */
export const withBase = (src: string) =>
  src.startsWith("/") && !src.startsWith("//") ? `${process.env.NEXT_PUBLIC_BASE_PATH ?? ""}${src}` : src;

export function formatEventDate(iso: string, locale: Locale = "en") {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const tag = locale === "fa" ? "fa-IR" : "en-GB";
  const date = d.toLocaleDateString(tag, { weekday: "short", day: "numeric", month: "short" });
  const time = d.toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit", hour12: false });
  return `${date} · ${time}`;
}

export function formatLongDate(iso: string, locale: Locale = "en") {
  return new Date(iso).toLocaleDateString(locale === "fa" ? "fa-IR" : "en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}

export function formatPrice(price: string | number, isFree = false, locale: Locale = "en") {
  const n = Number(price);
  if (isFree || !n) return locale === "fa" ? "رایگان" : "Free";
  if (locale === "fa") return `${n.toLocaleString("fa-IR")} دلار`;
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

/** Value for <input type="datetime-local"> from an ISO string (local time). */
export function toLocalInput(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export const handleError = (error: unknown): never => {
  const message = typeof error === "string" ? error : error instanceof Error ? error.message : "Something went wrong.";
  throw new Error(message);
};
