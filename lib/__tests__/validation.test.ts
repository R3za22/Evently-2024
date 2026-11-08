import { describe, expect, it } from "vitest";
import { cardSchema, escapeRegex, eventSchema, parseEvent, searchSchema, ValidationError } from "@/lib/validation";

const base = {
  title: "Summer rooftop session",
  description: "Music and drinks",
  location: "Rooftop Lounge",
  imageUrl: "/events/1.svg",
  startDateTime: "2030-01-01T18:00:00.000Z",
  endDateTime: "2030-01-01T21:00:00.000Z",
  categoryId: "cat_music",
  price: "20",
  isFree: false,
  url: "",
};

describe("eventSchema", () => {
  it("accepts a valid paid event and normalises price", () => {
    const e = parseEvent({ ...base, price: "20.50" });
    expect(e.price).toBe("20.5");
    expect(e.startDateTime).toBeInstanceOf(Date);
  });
  it("forces price 0 for free events", () => {
    expect(parseEvent({ ...base, isFree: true, price: "99" }).price).toBe("0");
  });
  it("rejects short titles", () => {
    expect(() => parseEvent({ ...base, title: "ab" })).toThrow(ValidationError);
  });
  it("rejects negative and missing prices", () => {
    const neg = eventSchema.safeParse({ ...base, price: "-5" });
    expect(neg.success).toBe(false);
    const none = eventSchema.safeParse({ ...base, price: "" });
    expect(none.success).toBe(false);
  });
  it("rejects end before start", () => {
    try {
      parseEvent({ ...base, endDateTime: "2029-01-01T00:00:00Z" });
      throw new Error("should fail");
    } catch (e) {
      expect((e as ValidationError).fields.endDateTime).toMatch(/after/);
    }
  });
  it("rejects bad urls but allows empty", () => {
    expect(eventSchema.safeParse({ ...base, url: "javascript:alert(1)" }).success).toBe(false);
    expect(eventSchema.safeParse({ ...base, url: "https://example.com/tickets" }).success).toBe(true);
  });
  it("requires an image and a category", () => {
    expect(eventSchema.safeParse({ ...base, imageUrl: "" }).success).toBe(false);
    expect(eventSchema.safeParse({ ...base, categoryId: "" }).success).toBe(false);
  });
});

describe("escapeRegex", () => {
  it("escapes metacharacters so input is matched literally", () => {
    const evil = "(a+)+$";
    const re = new RegExp(escapeRegex(evil), "i");
    expect(re.test("(a+)+$")).toBe(true);
    expect(re.test("aaaa")).toBe(false);
    expect(escapeRegex("a.b*c")).toBe("a\\.b\\*c");
  });
});

describe("searchSchema", () => {
  it("applies defaults and clamps", () => {
    expect(searchSchema.parse({})).toEqual({ query: "", category: "", page: 1, limit: 6 });
    expect(searchSchema.safeParse({ page: 0 }).success).toBe(false);
    expect(searchSchema.safeParse({ limit: 500 }).success).toBe(false);
    expect(searchSchema.parse({ page: "3" }).page).toBe(3);
  });
});

describe("cardSchema", () => {
  it("accepts spaced numbers", () => {
    const r = cardSchema.safeParse({ name: "Reza G", number: "4242 4242 4242 4242", expiry: "12/30", cvc: "123" });
    expect(r.success && r.data.number).toBe("4242424242424242");
  });
  it("rejects bad expiry and cvc", () => {
    expect(cardSchema.safeParse({ name: "Reza", number: "4242424242424242", expiry: "13/30", cvc: "123" }).success).toBe(false);
    expect(cardSchema.safeParse({ name: "Reza", number: "4242424242424242", expiry: "12/30", cvc: "1" }).success).toBe(false);
  });
});
