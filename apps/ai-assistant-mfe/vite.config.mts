/// <reference types="vitest" />
import { defineConfig } from "vite";
import angular from "@analogjs/vite-plugin-angular";
import { nxViteTsPaths } from "@nx/vite/plugins/nx-tsconfig-paths.plugin";

export default defineConfig(({ mode }) => ({
  root: __dirname,
  cacheDir: "../../node_modules/.vite/apps-ai-assistant-mfe",
  plugins: [angular(), nxViteTsPaths()],
  test: {
    watch: false,
    globals: true,
    environment: "jsdom",
    passWithNoTests: true,
    include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    setupFiles: ["src/test-setup.ts"],
    reporters: ["default"],
  },
}));