"use client";
// Live adapter: thin wrappers over the (session-authenticated) server actions.
import { createEvent, deleteEvent, getAllEvents, getEventById, getEventsByUser, getRelatedEventsByCategory, updateEvent } from "@/lib/actions/event.actions";
import { getMe } from "@/lib/actions/me.actions";
import { createCategory, getAllCategories } from "@/lib/actions/category.actions";
import { checkoutOrder, getOrdersByEvent, getOrdersByUser } from "@/lib/actions/order.actions";
import type { Api } from "./types";

const empty = { data: [], total: 0, totalPages: 0 };

export const liveApi: Api = {
  getCurrentUser: async () => (await getMe()) ?? null,
  getCategories: async () => (await getAllCategories()) ?? [],
  createCategory: async (name) => createCategory({ categoryName: name }),
  getEvents: async (q = {}) => (await getAllEvents(q)) ?? empty,
  getEvent: async (id) => (await getEventById(id)) ?? null,
  getRelatedEvents: async (a) => (await getRelatedEventsByCategory(a)) ?? empty,
  getMyEvents: async (a = {}) => (await getEventsByUser(a)) ?? empty,
  createEvent: async (input) => createEvent({ event: input, path: "/" }),
  updateEvent: async (id, input) => updateEvent({ eventId: id, event: input, path: "/" }),
  deleteEvent: async (id) => {
    await deleteEvent({ eventId: id, path: "/" });
  },
  async uploadImage(file) {
    const { genUploader } = await import("uploadthing/client");
    const uploadFiles = genUploader<any>({ package: "uploadthing", url: "/api/uploadthing" });
    const res = await uploadFiles("imageUploader", { files: [file] });
    const url = res?.[0]?.url;
    if (!url) throw new Error("Upload failed. Please try again.");
    return url;
  },
  checkout: async ({ eventId }) => {
    const r = await checkoutOrder({ eventId });
    if (!r) throw new Error("Checkout failed. Please try again.");
    return r as any;
  },
  getOrdersByEvent: async (a) => (await getOrdersByEvent(a)) ?? [],
  getMyOrders: async (a = {}) => (await getOrdersByUser(a)) ?? empty,
};
