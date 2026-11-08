import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname), "server-only": path.resolve(__dirname, "lib/__tests__/empty.ts") } },
  test: { environment: "jsdom", include: ["lib/**/*.test.ts"], setupFiles: [] },
});
