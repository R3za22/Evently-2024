import { beforeEach, describe, expect, it } from "vitest";
import { mockApi, mockAuth, resetMock, setMockLatency } from "../index";
import { FAIL_KEY, STORE_KEY } from "../store";
import { DECLINED_CARD, SUCCESS_CARD, ValidationError } from "@/lib/validation";

const card = (number: string) => ({ name: "Demo User", number, expiry: "12/30", cvc: "123" });
const input = (over = {}) => ({
  title: "Test event", description: "d", location: "Somewhere", imageUrl: "/events/1.svg",
  startDateTime: "2030-05-01T10:00:00Z", endDateTime: "2030-05-01T12:00:00Z",
  categoryId: "cat_music", price: "10", isFree: false, url: "", ...over,
});

beforeEach(() => {
  localStorage.clear();
  setMockLatency(false);
  resetMock();
});

describe("seed + persistence", () => {
  it("seeds events, categories and orders", async () => {
    const all = await mockApi.getEvents({ limit: 50 });
    expect(all.total).toBe(12);
    expect((await mockApi.getCategories()).length).toBe(6);
    expect((await mockApi.getMyOrders()).total).toBe(2);
  });
  it("persists writes to localStorage", async () => {
    const e = await mockApi.createEvent(input());
    expect(localStorage.getItem(STORE_KEY)).toContain(e._id);
    expect((await mockApi.getEvent(e._id))?.title).toBe("Test event");
  });
  it("reset restores the seed", async () => {
    await mockApi.createEvent(input());
    resetMock();
    expect((await mockApi.getEvents({ limit: 50 })).total).toBe(12);
  });
});

describe("discover", () => {
  it("paginates 6 per page", async () => {
    const p1 = await mockApi.getEvents({ page: 1 });
    const p2 = await mockApi.getEvents({ page: 2 });
    expect(p1.data.length).toBe(6);
    expect(p1.totalPages).toBe(2);
    expect(p2.data.length).toBe(6);
    expect(p1.data[0]._id).not.toBe(p2.data[0]._id);
  });
  it("searches by title case-insensitively", async () => {
    const r = await mockApi.getEvents({ query: "jazz" });
    expect(r.data.map((e) => e.title)).toEqual(["Open-Air Jazz Night"]);
  });
  it("treats regex metacharacters literally", async () => {
    expect((await mockApi.getEvents({ query: ".*" })).total).toBe(0);
    expect((await mockApi.getEvents({ query: "(a+)+$" })).total).toBe(0);
    expect((await mockApi.getEvents({ category: ".*" })).total).toBe(0);
  });
  it("filters by category and returns related events", async () => {
    const tech = await mockApi.getEvents({ category: "technology" });
    expect(tech.total).toBe(2);
    const rel = await mockApi.getRelatedEvents({ categoryId: "cat_tech", eventId: "e2" });
    expect(rel.data.every((e) => e._id !== "e2" && e.category._id === "cat_tech")).toBe(true);
    expect(rel.data.length).toBe(1);
  });
});

describe("event writes", () => {
  it("validates input", async () => {
    await expect(mockApi.createEvent(input({ title: "x" }))).rejects.toBeInstanceOf(ValidationError);
    await expect(mockApi.createEvent(input({ price: "-1" }))).rejects.toBeInstanceOf(ValidationError);
  });
  it("only the organiser can edit or delete", async () => {
    await expect(mockApi.updateEvent("e2", input())).rejects.toThrow(/own events/);
    await expect(mockApi.deleteEvent("e2")).rejects.toThrow(/own events/);
    const upd = await mockApi.updateEvent("e1", input({ title: "Renamed jazz" }));
    expect(upd.title).toBe("Renamed jazz");
    await mockApi.deleteEvent("e1");
    expect(await mockApi.getEvent("e1")).toBeNull();
  });
  it("my events lists organised events", async () => {
    expect((await mockApi.getMyEvents()).data.map((e) => e._id).sort()).toEqual(["e1", "e8"]);
  });
  it("rejects non-image uploads", async () => {
    await expect(mockApi.uploadImage(new File(["x"], "a.txt", { type: "text/plain" }))).rejects.toThrow(/image/);
  });
});

describe("checkout", () => {
  it("declines test card 4000 0000 0000 0002 and creates no order", async () => {
    const r = await mockApi.checkout({ eventId: "e3", card: card(DECLINED_CARD) });
    expect(r.status).toBe("declined");
    expect((await mockApi.getMyOrders()).total).toBe(2);
  });
  it("accepts 4242 and creates an order priced from the stored event", async () => {
    const r = await mockApi.checkout({ eventId: "e3", card: card(SUCCESS_CARD) });
    expect(r.status).toBe("paid");
    if (r.status === "paid") expect(r.order.totalAmount).toBe("5");
    expect((await mockApi.getMyOrders()).total).toBe(3);
  });
  it("free events need no card", async () => {
    const r = await mockApi.checkout({ eventId: "e4" });
    expect(r.status).toBe("paid");
  });
  it("blocks duplicates and own events", async () => {
    await expect(mockApi.checkout({ eventId: "e2", card: card(SUCCESS_CARD) })).rejects.toThrow(/already/);
    await expect(mockApi.checkout({ eventId: "e1", card: card(SUCCESS_CARD) })).rejects.toThrow(/own event/);
  });
  it("rejects an invalid card with a message", async () => {
    const r = await mockApi.checkout({ eventId: "e3", card: card("12") });
    expect(r.status).toBe("declined");
  });
});

describe("orders dashboard", () => {
  it("lists and searches orders for the organiser", async () => {
    expect((await mockApi.getOrdersByEvent({ eventId: "e1" })).length).toBe(5);
    const r = await mockApi.getOrdersByEvent({ eventId: "e1", searchString: "mina" });
    expect(r.map((o) => o.buyer)).toEqual(["Mina Karimi"]);
    expect((await mockApi.getOrdersByEvent({ eventId: "e1", searchString: "(" })).length).toBe(0);
  });
  it("refuses non-organisers", async () => {
    await expect(mockApi.getOrdersByEvent({ eventId: "e2" })).rejects.toThrow(/organiser/);
  });
});

describe("auth + error injection", () => {
  it("signed-out users cannot write", async () => {
    mockAuth.signOut();
    expect(await mockApi.getCurrentUser()).toBeNull();
    await expect(mockApi.createEvent(input())).rejects.toThrow(/sign in/i);
    mockAuth.signIn();
    expect((await mockApi.getCurrentUser())?._id).toBe("user_demo");
  });
  it("can inject failures", async () => {
    localStorage.setItem(FAIL_KEY, "events");
    await expect(mockApi.getEvents()).rejects.toThrow(/went wrong/);
    expect((await mockApi.getCategories()).length).toBe(6);
  });
});
