// Configuración de la jaula de este proyecto (jaula.config.json en la raíz del repo).
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";

export type AgenteHeadless = "pi" | "claude";

export type Config = {
  /** Carpeta de la spec (humana, sellada). Cada subcarpeta es un módulo. */
  spec: string;
  /** Carpeta del núcleo (agente, desechable). `<nucleo>/<modulo>.ts` implementa `<spec>/<modulo>/`. */
  nucleo: string;
  /** Rutas que el agente no puede modificar. Las terminadas en "/" son carpetas. */
  protegidos: string[];
  /** Comandos que usa el árbitro. A `test` se le añaden las rutas de spec cuando va acotado. */
  comandos: { test: string[]; check: string[] };
  /** Agente que lanzan `candidatos` y `abogado`. */
  agenteHeadless: AgenteHeadless;
  /** Veces que el árbitro obliga al agente a seguir antes de devolverte el control. */
  reintentosArbitro: number;
};

const PORDEFECTO: Config = {
  spec: "spec",
  nucleo: "core",
  protegidos: [],
  comandos: { test: ["vp", "test", "run"], check: ["vp", "check"] },
  agenteHeadless: "pi",
  reintentosArbitro: 3,
};

export const FICHERO_CONFIG = "jaula.config.json";
export const LOCK = "jaula.lock";

/** Sube desde `desde` hasta encontrar jaula.config.json. */
export function buscarRaiz(desde: string): string {
  let dir = desde;
  while (!existsSync(join(dir, FICHERO_CONFIG))) {
    const padre = dirname(dir);
    if (padre === dir) throw new Error(`No encuentro ${FICHERO_CONFIG} desde ${desde}`);
    dir = padre;
  }
  return dir;
}

export function leerConfig(raiz: string): Config {
  const datos = JSON.parse(readFileSync(join(raiz, FICHERO_CONFIG), "utf8")) as Partial<Config>;
  return { ...PORDEFECTO, ...datos, comandos: { ...PORDEFECTO.comandos, ...datos.comandos } };
}
