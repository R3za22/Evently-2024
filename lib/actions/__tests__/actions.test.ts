import { beforeEach, describe, expect, it, vi } from "vitest";

const SESSION = "507f1f77bcf86cd799439011";
const state = { signedIn: true };

vi.mock("@/lib/server/session", () => ({
  getClerkId: async () => (state.signedIn ? "clerk_1" : null),
  requireUserId: async () => {
    if (!state.signedIn) throw new Error("Please sign in to continue.");
    return SESSION;
  },
}));
vi.mock("@/lib/database", () => ({ connectToDatabase: async () => {} }));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const chain = (result: unknown) => {
  const q: any = { sort: () => q, skip: () => q, limit: () => q, populate: () => q, then: (r: any) => r(result) };
  return q;
};
const Event = {
  find: vi.fn(() => chain([])),
  findById: vi.fn(),
  findByIdAndUpdate: vi.fn(),
  findByIdAndDelete: vi.fn(),
  create: vi.fn(),
  countDocuments: vi.fn(async () => 0),
};
const Category = { findOne: vi.fn(async () => ({ _id: "c1" })), findById: vi.fn(async () => ({ _id: "c1" })), find: vi.fn(), create: vi.fn() };
const Order = { exists: vi.fn(async () => null), findOne: vi.fn(async () => null), create: vi.fn() };
vi.mock("@/lib/database/models/event.model", () => ({ default: Event }));
vi.mock("@/lib/database/models/category.model", () => ({ default: Category }));
vi.mock("@/lib/database/models/order.model", () => ({ default: Order }));
vi.mock("@/lib/database/models/user.model", () => ({ default: {} }));

const stripeCreate = vi.fn(async () => ({ url: "https://checkout.stripe.test/s" }));
const constructEvent = vi.fn();
vi.mock("stripe", () => ({
  default: class {
    checkout = { sessions: { create: stripeCreate } };
    webhooks = { constructEvent };
  },
}));

const valid = {
  title: "Launch party", description: "", location: "Rooftop", imageUrl: "/events/1.svg",
  startDateTime: "2030-01-01T10:00:00Z", endDateTime: "2030-01-01T12:00:00Z",
  categoryId: "c1", price: "10", isFree: false, url: "",
};

beforeEach(() => {
  vi.clearAllMocks();
  state.signedIn = true;
  process.env.STRIPE_SECRET_KEY = "sk_test_x";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_x";
  process.env.NEXT_PUBLIC_SERVER_URL = "https://app.test";
});

describe("event actions", () => {
  it("createEvent uses the session user, ignoring any client userId", async () => {
    const { createEvent } = await import("../event.actions");
    Event.create.mockResolvedValue({ _id: "e9" });
    Event.findById.mockReturnValue(chain({ _id: "e9" }));
    await createEvent({ userId: "evil", event: valid } as any);
    expect(Event.create).toHaveBeenCalledWith(expect.objectContaining({ organizer: SESSION }));
  });
  it("createEvent rejects invalid data and anonymous callers", async () => {
    const { createEvent } = await import("../event.actions");
    await expect(createEvent({ event: { ...valid, title: "x" } })).rejects.toThrow(/Title/);
    state.signedIn = false;
    await expect(createEvent({ event: valid })).rejects.toThrow(/sign in/i);
    expect(Event.create).not.toHaveBeenCalled();
  });
  it("updateEvent refuses non-owners", async () => {
    const { updateEvent } = await import("../event.actions");
    Event.findById.mockResolvedValue({ organizer: "someone-else" });
    await expect(updateEvent({ eventId: "e1", event: valid })).rejects.toThrow(/Unauthorized/);
    expect(Event.findByIdAndUpdate).not.toHaveBeenCalled();
  });
  it("deleteEvent refuses non-owners and allows owners", async () => {
    const { deleteEvent } = await import("../event.actions");
    Event.findById.mockResolvedValue({ organizer: "someone-else" });
    await expect(deleteEvent({ eventId: "e1" })).rejects.toThrow(/Unauthorized/);
    Event.findById.mockResolvedValue({ organizer: { toString: () => SESSION }, toString: () => "" });
    Event.findById.mockResolvedValue({ organizer: SESSION });
    await deleteEvent({ eventId: "e1" });
    expect(Event.findByIdAndDelete).toHaveBeenCalledWith("e1");
  });
  it("escapes the search and category regex", async () => {
    const { getAllEvents } = await import("../event.actions");
    await getAllEvents({ query: "(a+)+$", category: ".*" });
    expect(Event.find).toHaveBeenCalledWith({ $and: [{ title: { $regex: "\\(a\\+\\)\\+\\$", $options: "i" } }, { category: "c1" }] });
    expect(Category.findOne).toHaveBeenCalledWith({ name: { $regex: "^\\.\\*$", $options: "i" } });
  });
  it("rejects malformed ids", async () => {
    const { getEventById } = await import("../event.actions");
    await expect(getEventById("{$ne:1}")).rejects.toThrow();
  });
});

describe("checkoutOrder", () => {
  it("prices from the DB and takes the buyer from the session", async () => {
    const { checkoutOrder } = await import("../order.actions");
    Event.findById.mockResolvedValue({ _id: "e1", title: "Paid", price: "25", isFree: false, organizer: "other" });
    const r = await checkoutOrder({ eventId: "e1", price: "0.01", buyerId: "evil" } as any);
    expect(r).toEqual({ status: "redirect", url: "https://checkout.stripe.test/s" });
    const arg = (stripeCreate.mock.calls[0] as any)[0];
    expect(arg.line_items[0].price_data.unit_amount).toBe(2500);
    expect(arg.metadata).toEqual({ eventId: "e1", buyerId: SESSION });
  });
  it("blocks buying your own event or twice", async () => {
    const { checkoutOrder } = await import("../order.actions");
    Event.findById.mockResolvedValue({ _id: "e1", price: "5", organizer: SESSION });
    await expect(checkoutOrder({ eventId: "e1" })).rejects.toThrow(/own event/);
    Event.findById.mockResolvedValue({ _id: "e1", price: "5", organizer: "other" });
    Order.exists.mockResolvedValueOnce({ _id: "o" } as any);
    await expect(checkoutOrder({ eventId: "e1" })).rejects.toThrow(/already/);
  });
  it("free events skip Stripe", async () => {
    const { checkoutOrder } = await import("../order.actions");
    Event.findById.mockResolvedValue({ _id: "e2", price: "0", isFree: true, organizer: "other" });
    Order.create.mockResolvedValue({ _id: "o1" });
    const r: any = await checkoutOrder({ eventId: "e2" });
    expect(r.status).toBe("paid");
    expect(stripeCreate).not.toHaveBeenCalled();
  });
});

describe("stripe webhook", () => {
  const req = (sig?: string) =>
    new Request("http://x/api/webhook/stripe", { method: "POST", body: "{}", headers: sig ? { "stripe-signature": sig } : {} });
  it("rejects missing and invalid signatures", async () => {
    const { POST } = await import("@/app/api/webhook/stripe/route");
    expect((await POST(req())).status).toBe(400);
    constructEvent.mockImplementation(() => {
      throw new Error("bad sig");
    });
    expect((await POST(req("t=1,v1=bad"))).status).toBe(400);
    expect(Order.create).not.toHaveBeenCalled();
  });
  it("records the order for a verified checkout.session.completed", async () => {
    const { POST } = await import("@/app/api/webhook/stripe/route");
    constructEvent.mockReturnValue({
      type: "checkout.session.completed",
      data: { object: { id: "cs_1", amount_total: 2500, metadata: { eventId: "e1", buyerId: SESSION } } },
    });
    Order.create.mockResolvedValue({ _id: "o1" });
    const res = await POST(req("t=1,v1=ok"));
    expect(res.status).toBe(200);
    expect(Order.create).toHaveBeenCalledWith(expect.objectContaining({ stripeId: "cs_1", totalAmount: "25", buyer: SESSION }));
  });
});
