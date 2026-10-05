import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  // @tokenseed/aurora has its own copy of the file: dependency; Aurora tokens are checked by identity, so keep one core.
  resolve: { dedupe: ["@aurora/core"] },
  test: { environment: "jsdom" },
});
