// Fragmento de configuración de Vite/Vitest para la jaula. Uso en vite.config.ts:
//   export default defineConfig({ ...jaula(import.meta.dirname), ...lo tuyo })
import { resolve } from "node:path";
import { leerConfig } from "./lib/config.ts";

export function jaula(raiz: string) {
  const config = leerConfig(raiz);
  // JAULA_SUSTITUIR="modulo=/ruta/impl.ts,…" ejecuta la spec contra otra implementación (candidatos, abogado).
  const sustituciones = (process.env.JAULA_SUSTITUIR ?? "")
    .split(",")
    .filter(Boolean)
    .map((par) => {
      const [modulo, fichero] = par.split("=");
      return { find: new RegExp(`^#nucleo/${modulo}(\\.ts)?$`), replacement: resolve(fichero) };
    });
  // El holdout vive fuera del repo y solo lo conocen el humano y CI.
  const holdout = process.env.JAULA_HOLDOUT;
  return {
    resolve: {
      // Los imports de package.json (#nucleo, #jaula/arnes) también se resuelven desde el holdout.
      alias: [
        ...sustituciones,
        { find: /^#nucleo\//, replacement: `${resolve(raiz, config.nucleo)}/` },
        { find: /^#jaula\/arnes$/, replacement: resolve(raiz, "jaula", "arnes", "index.ts") },
      ],
    },
    test: {
      include: [`${config.spec}/**/*.spec.ts`, ...(holdout ? [`${resolve(holdout)}/**/*.spec.ts`] : [])],
    },
  };
}
