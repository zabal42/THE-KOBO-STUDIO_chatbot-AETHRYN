import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    // Mismo alias que "paths" en tsconfig.json: "@/*" → "./src/*".
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    // Solo hay tests de servidor (lógica pura y rutas API): no hace falta DOM.
    environment: "node",
    // Lista cada caso por nombre (criterio de hecho de KOBO-02).
    reporters: ["verbose"],
    include: ["src/**/*.test.ts"],
    // Los mocks se declaran por fichero; se limpian entre tests.
    clearMocks: true,
  },
});
