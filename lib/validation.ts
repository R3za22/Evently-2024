import { z } from "zod";

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const dateField = z.preprocess(
  (v) => (v instanceof Date ? v : typeof v === "string" || typeof v === "number" ? new Date(v) : v),
  z.date({ invalid_type_error: "Enter a valid date and time." })
);

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, "Title must be at least 3 characters.").max(120, "Title must be 120 characters or fewer."),
    description: z.string().trim().max(1000, "Description must be 1000 characters or fewer.").default(""),
    location: z.string().trim().min(3, "Location must be at least 3 characters.").max(200, "Location is too long."),
    imageUrl: z.string().min(1, "Add an event image."),
    startDateTime: dateField,
    endDateTime: dateField,
    categoryId: z.string().min(1, "Choose a category."),
    price: z.string().trim().default(""),
    isFree: z.boolean().default(false),
    url: z
      .string()
      .trim()
      .default("")
      .refine((v) => v === "" || /^https?:\/\/[^\s]+\.[^\s]+$/i.test(v), "Enter a full URL starting with http:// or https://."),
  })
  .superRefine((v, ctx) => {
    if (v.endDateTime.getTime() <= v.startDateTime.getTime()) {
      ctx.addIssue({ code: "custom", path: ["endDateTime"], message: "End must be after the start." });
    }
    if (!v.isFree) {
      const n = Number(v.price);
      if (v.price === "" || Number.isNaN(n)) ctx.addIssue({ code: "custom", path: ["price"], message: "Enter a price or mark the event as free." });
      else if (n < 0) ctx.addIssue({ code: "custom", path: ["price"], message: "Price can't be negative." });
      else if (n > 10000) ctx.addIssue({ code: "custom", path: ["price"], message: "Price can't be more than 10,000." });
    }
  })
  .transform((v) => ({ ...v, price: v.isFree ? "0" : String(Number(v.price)) }));

export type EventInput = z.input<typeof eventSchema>;
export type EventData = z.output<typeof eventSchema>;

/** Returns field -> message map (first message per field), or null when valid. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of error.issues) {
    const k = String(i.path[0] ?? "form");
    if (!(k in out)) out[k] = i.message;
  }
  return out;
}

export const idSchema = z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_-]+$/, "Invalid id.");

export const searchSchema = z.object({
  query: z.string().trim().max(100).default(""),
  category: z.string().trim().max(60).default(""),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(6),
});

/** Test cards for the simulated Stripe form. */
export const DECLINED_CARD = "4000000000000002";
export const SUCCESS_CARD = "4242424242424242";

export const cardSchema = z.object({
  name: z.string().trim().min(2, "Enter the name on the card."),
  number: z
    .string()
    .transform((v) => v.replace(/\s+/g, ""))
    .refine((v) => /^\d{16}$/.test(v), "Card number must be 16 digits."),
  expiry: z.string().refine((v) => {
    const m = /^(\d{2})\s*\/\s*(\d{2})$/.exec(v.trim());
    if (!m) return false;
    const mm = Number(m[1]);
    return mm >= 1 && mm <= 12;
  }, "Use MM/YY."),
  cvc: z.string().regex(/^\d{3,4}$/, "CVC is 3 or 4 digits."),
});
export type CardInput = z.input<typeof cardSchema>;

export class ValidationError extends Error {
  fields: Record<string, string>;
  constructor(fields: Record<string, string>) {
    super(Object.values(fields)[0] ?? "Invalid input.");
    this.name = "ValidationError";
    this.fields = fields;
  }
}

/** Parse event input or throw ValidationError with per-field messages. */
export function parseEvent(input: unknown): EventData {
  const r = eventSchema.safeParse(input);
  if (!r.success) throw new ValidationError(fieldErrors(r.error));
  return r.data;
}
