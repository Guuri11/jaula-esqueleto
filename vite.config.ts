import { defineConfig } from "vite-plus";
import { jaula } from "./jaula/vite.ts";

export default defineConfig({
  // Alias #nucleo / #jaula/arnes, sustituciones para candidatos y abogado, y holdout.
  ...jaula(import.meta.dirname),
  staged: {
    "*": "vp check --fix",
  },
  lint: {
    ignorePatterns: ["jaula/plantillas/**"],
    options: {
      typeAware: true,
      typeCheck: true,
    },
  },
  fmt: {
    printWidth: 120,
    ignorePatterns: ["jaula/plantillas/**"],
  },
});
