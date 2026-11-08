export type Category = { _id: string; name: string };
export type Person = { _id: string; firstName: string; lastName: string };

export type EventDTO = {
  _id: string;
  title: string;
  description: string;
  location: string;
  imageUrl: string;
  startDateTime: string; // ISO
  endDateTime: string; // ISO
  createdAt: string;
  price: string;
  isFree: boolean;
  url: string;
  category: Category;
  organizer: Person;
  /** Optional Persian copy used by the /fa home page. */
  fa?: { title: string; location: string };
};

export type OrderDTO = {
  _id: string;
  createdAt: string;
  stripeId: string;
  totalAmount: string;
  event: EventDTO;
  buyer: Person;
};

export type OrderItemDTO = {
  _id: string;
  createdAt: string;
  totalAmount: string;
  eventTitle: string;
  eventId: string;
  buyer: string;
};

export type Paged<T> = { data: T[]; totalPages: number; total: number };

export type EventsQuery = { query?: string; category?: string; page?: number; limit?: number };

export type CardDetails = { name: string; number: string; expiry: string; cvc: string };

export type CheckoutResult =
  | { status: "paid"; order: OrderDTO }
  | { status: "declined"; code: string; message: string }
  | { status: "redirect"; url: string };

export type UserDTO = Person & { email: string; username: string; photo?: string };

/** One contract, two adapters (mock | live). Every call may reject with Error(message). */
export interface Api {
  getCurrentUser(): Promise<UserDTO | null>;
  getCategories(): Promise<Category[]>;
  createCategory(name: string): Promise<Category>;
  getEvents(q?: EventsQuery): Promise<Paged<EventDTO>>;
  getEvent(id: string): Promise<EventDTO | null>;
  getRelatedEvents(a: { categoryId: string; eventId: string; limit?: number }): Promise<Paged<EventDTO>>;
  getMyEvents(a?: { page?: number; limit?: number }): Promise<Paged<EventDTO>>;
  createEvent(input: import("@/lib/validation").EventInput): Promise<EventDTO>;
  updateEvent(id: string, input: import("@/lib/validation").EventInput): Promise<EventDTO>;
  deleteEvent(id: string): Promise<void>;
  uploadImage(file: File): Promise<string>;
  checkout(a: { eventId: string; card?: CardDetails }): Promise<CheckoutResult>;
  getOrdersByEvent(a: { eventId: string; searchString?: string }): Promise<OrderItemDTO[]>;
  getMyOrders(a?: { page?: number; limit?: number }): Promise<Paged<OrderDTO>>;
}
