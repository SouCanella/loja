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
    /** threads + singleThread evita crash do tinypool ao terminar forks em alguns Node/OS. */
    pool: "threads",
    poolOptions: {
      threads: { singleThread: true },
    },
    include: ["__tests__/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      reportsDirectory: "./coverage",
      /** Foco em lógica testável; páginas Next cobrem-se sobretudo com E2E. */
      include: ["lib/**/*.ts"],
    },
  },
});
