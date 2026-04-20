import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(root, "."),
    },
  },
  test: {
    environment: "node",
    fileParallelism: false,
    maxConcurrency: 1,
    /** Evita falhas do worker (tinypool) em alguns ambientes/CI sandbox. */
    pool: "forks",
    poolOptions: {
      forks: { singleFork: true },
    },
    include: ["__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
    },
  },
});
