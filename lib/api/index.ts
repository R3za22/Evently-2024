import type { Api } from "./types";

// Constant-folded by the bundler: the unused adapter (and server actions in the static demo) is dropped.
export const api: Api = process.env.NEXT_PUBLIC_API_MODE === "mock"
  ? (require("./mock") as typeof import("./mock")).mockApi
  : (require("./live") as typeof import("./live")).liveApi;

export * from "./types";
