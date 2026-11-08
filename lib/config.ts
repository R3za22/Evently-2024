/** `mock` = seeded localStorage data + mock auth (static demo, e2e). `live` = server actions, Clerk, Mongo, Stripe. */
export const API_MODE: "mock" | "live" =
  process.env.NEXT_PUBLIC_API_MODE === "mock" || process.env.NEXT_PUBLIC_DEMO === "1" ? "mock" : "live";
export const IS_MOCK = API_MODE === "mock";
