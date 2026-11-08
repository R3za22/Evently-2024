import { escapeRegex, parseEvent, searchSchema, ValidationError } from "@/lib/validation";
import type { Api, EventDTO, OrderDTO, Paged, UserDTO } from "../types";
import { DEMO_USER } from "./fixtures";
import { simulatePayment } from "./payment";
import { load, nextId, resetMock, save, simulate } from "./store";

export { resetMock, setMockLatency } from "./store";

const page = <T,>(all: T[], p: number, limit: number): Paged<T> => ({
  data: all.slice((p - 1) * limit, p * limit),
  totalPages: Math.max(1, Math.ceil(all.length / limit)) * (all.length ? 1 : 0),
  total: all.length,
});

const byNewest = (a: { createdAt: string }, b: { createdAt: string }) => b.createdAt.localeCompare(a.createdAt);

function requireUser(): UserDTO {
  if (!load().signedIn) throw new Error("Please sign in to continue.");
  return DEMO_USER;
}

// ---- mock auth (used by lib/auth/mock.tsx) ----
export const mockAuth = {
  isSignedIn: () => load().signedIn,
  signIn() {
    const s = load();
    s.signedIn = true;
    save(s);
  },
  signOut() {
    const s = load();
    s.signedIn = false;
    save(s);
  },
};

export const mockApi: Api = {
  async getCurrentUser() {
    await simulate("user");
    return load().signedIn ? DEMO_USER : null;
  },

  async getCategories() {
    await simulate("categories");
    return [...load().categories];
  },

  async createCategory(name) {
    await simulate("categories");
    requireUser();
    const clean = name.trim();
    if (clean.length < 2 || clean.length > 40) throw new ValidationError({ name: "Category name must be 2-40 characters." });
    const s = load();
    const existing = s.categories.find((c) => c.name.toLowerCase() === clean.toLowerCase());
    if (existing) return existing;
    const c = { _id: nextId(s, "cat_"), name: clean };
    s.categories.push(c);
    save(s);
    return c;
  },

  async getEvents(q = {}) {
    await simulate("events");
    const { query, category, page: p, limit } = searchSchema.parse(q);
    const s = load();
    const re = query ? new RegExp(escapeRegex(query), "i") : null;
    const cat = category ? s.categories.find((c) => new RegExp(`^${escapeRegex(category)}$`, "i").test(c.name)) : null;
    if (category && !cat) return page<EventDTO>([], p, limit);
    const list = s.events
      .filter((e) => (!re || re.test(e.title)) && (!cat || e.category._id === cat._id))
      .sort(byNewest);
    return page(list, p, limit);
  },

  async getEvent(id) {
    await simulate("event");
    return load().events.find((e) => e._id === id) ?? null;
  },

  async getRelatedEvents({ categoryId, eventId, limit = 3 }) {
    await simulate("events");
    const list = load().events.filter((e) => e.category._id === categoryId && e._id !== eventId).sort(byNewest);
    return page(list, 1, limit);
  },

  async getMyEvents({ page: p = 1, limit = 6 } = {}) {
    await simulate("events");
    const u = requireUser();
    return page(load().events.filter((e) => e.organizer._id === u._id).sort(byNewest), p, limit);
  },

  async createEvent(input) {
    await simulate("write");
    const u = requireUser();
    const data = parseEvent(input);
    const s = load();
    const category = s.categories.find((c) => c._id === data.categoryId);
    if (!category) throw new ValidationError({ categoryId: "Choose a category." });
    const ev: EventDTO = {
      _id: nextId(s, "e"),
      title: data.title,
      description: data.description,
      location: data.location,
      imageUrl: data.imageUrl,
      startDateTime: data.startDateTime.toISOString(),
      endDateTime: data.endDateTime.toISOString(),
      createdAt: new Date().toISOString(),
      price: data.price,
      isFree: data.isFree,
      url: data.url,
      category,
      organizer: { _id: u._id, firstName: u.firstName, lastName: u.lastName },
    };
    s.events.unshift(ev);
    save(s);
    return ev;
  },

  async updateEvent(id, input) {
    await simulate("write");
    const u = requireUser();
    const data = parseEvent(input);
    const s = load();
    const idx = s.events.findIndex((e) => e._id === id);
    if (idx < 0) throw new Error("Event not found.");
    if (s.events[idx].organizer._id !== u._id) throw new Error("You can only edit your own events.");
    const category = s.categories.find((c) => c._id === data.categoryId);
    if (!category) throw new ValidationError({ categoryId: "Choose a category." });
    const next: EventDTO = {
      ...s.events[idx],
      title: data.title,
      description: data.description,
      location: data.location,
      imageUrl: data.imageUrl,
      startDateTime: data.startDateTime.toISOString(),
      endDateTime: data.endDateTime.toISOString(),
      price: data.price,
      isFree: data.isFree,
      url: data.url,
      category,
    };
    s.events[idx] = next;
    s.orders = s.orders.map((o) => (o.event._id === id ? { ...o, event: next } : o));
    save(s);
    return next;
  },

  async deleteEvent(id) {
    await simulate("write");
    const u = requireUser();
    const s = load();
    const ev = s.events.find((e) => e._id === id);
    if (!ev) throw new Error("Event not found.");
    if (ev.organizer._id !== u._id) throw new Error("You can only delete your own events.");
    s.events = s.events.filter((e) => e._id !== id);
    s.orders = s.orders.filter((o) => o.event._id !== id);
    save(s);
  },

  /** Mock upload: no network. Returns a data URL (downscaled in the browser when possible). */
  async uploadImage(file) {
    await simulate("upload");
    requireUser();
    if (!file.type.startsWith("image/")) throw new Error("Choose an image file (PNG, JPG, WebP or SVG).");
    if (file.size > 4 * 1024 * 1024) throw new Error("Image must be 4 MB or smaller.");
    return downscale(file);
  },

  async checkout({ eventId, card }) {
    await simulate("checkout");
    const u = requireUser();
    const s = load();
    const ev = s.events.find((e) => e._id === eventId);
    if (!ev) throw new Error("Event not found.");
    if (ev.organizer._id === u._id) throw new Error("You can't buy a ticket to your own event.");
    if (s.orders.some((o) => o.event._id === eventId && o.buyer._id === u._id)) throw new Error("You already have a ticket for this event.");
    const amount = ev.isFree ? 0 : Number(ev.price); // price comes from the stored event, never the client
    if (amount > 0) {
      const r = simulatePayment(card);
      if (!r.ok) return { status: "declined", code: r.code, message: r.message };
    }
    const order: OrderDTO = {
      _id: nextId(s, "o"),
      createdAt: new Date().toISOString(),
      stripeId: `mock_pi_${s.seq}`,
      totalAmount: String(amount),
      event: ev,
      buyer: { _id: u._id, firstName: u.firstName, lastName: u.lastName },
    };
    s.orders.unshift(order);
    save(s);
    return { status: "paid", order };
  },

  async getOrdersByEvent({ eventId, searchString = "" }) {
    await simulate("orders");
    const u = requireUser();
    const s = load();
    const ev = s.events.find((e) => e._id === eventId);
    if (!ev) throw new Error("Event not found.");
    if (ev.organizer._id !== u._id) throw new Error("Only the organiser can see these orders.");
    const re = new RegExp(escapeRegex(searchString.trim()), "i");
    return s.orders
      .filter((o) => o.event._id === eventId)
      .map((o) => ({ _id: o._id, createdAt: o.createdAt, totalAmount: o.totalAmount, eventTitle: o.event.title, eventId, buyer: `${o.buyer.firstName} ${o.buyer.lastName}` }))
      .filter((o) => re.test(o.buyer))
      .sort(byNewest);
  },

  async getMyOrders({ page: p = 1, limit = 6 } = {}) {
    await simulate("orders");
    const u = requireUser();
    return page(load().orders.filter((o) => o.buyer._id === u._id).sort(byNewest), p, limit);
  },
};

async function downscale(file: File): Promise<string> {
  const read = () =>
    new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => rej(new Error("Could not read the image."));
      r.readAsDataURL(file);
    });
  const url = await read();
  if (typeof document === "undefined" || file.type === "image/svg+xml") return url;
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const max = 900;
    const k = Math.min(1, max / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * k);
    c.height = Math.round(img.height * k);
    c.getContext("2d")?.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", 0.8);
  } catch {
    return url;
  }
}

