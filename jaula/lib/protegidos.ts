// Qué está dentro de la jaula y su huella sellada.
import { createHash } from "node:crypto";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { type Config, LOCK } from "./config.ts";

export const relativa = (raiz: string, ruta: string) => relative(raiz, resolve(raiz, ruta)).split(sep).join("/");

/** ¿La ruta (relativa a la raíz o absoluta) cae dentro de la jaula? */
export function esProtegida(raiz: string, config: Config, ruta: string): boolean {
  const rel = relativa(raiz, ruta);
  if (rel.startsWith("..")) return false;
  return config.protegidos.some((p) => (p.endsWith("/") ? rel === p.slice(0, -1) || rel.startsWith(p) : rel === p));
}

function listar(raiz: string, entrada: string): string[] {
  const ruta = join(raiz, entrada);
  if (!existsSync(ruta)) return [];
  if (!statSync(ruta).isDirectory()) return [entrada];
  return readdirSync(ruta, { recursive: true, encoding: "utf8" })
    .map((f) => join(entrada, f).split(sep).join("/"))
    .filter((f) => !f.split("/").includes("node_modules") && statSync(join(raiz, f)).isFile());
}

/** Huella sha256 de cada fichero protegido (salvo el propio lock). */
export function huellas(raiz: string, config: Config): Record<string, string> {
  const ficheros = [...new Set(config.protegidos.flatMap((p) => listar(raiz, p)))].filter((f) => f !== LOCK).sort();
  return Object.fromEntries(
    ficheros.map((f) => [
      f,
      createHash("sha256")
        .update(readFileSync(join(raiz, f)))
        .digest("hex"),
    ]),
  );
}

/** Diferencias entre la jaula actual y la sellada. Vacío = íntegra. */
export function diferencias(raiz: string, config: Config): string[] {
  const lock = join(raiz, LOCK);
  if (!existsSync(lock)) return [`falta ${LOCK} (sella con: pnpm jaula sellar)`];
  const sellado = JSON.parse(readFileSync(lock, "utf8")) as Record<string, string>;
  const actual = huellas(raiz, config);
  return [
    ...Object.keys(actual)
      .filter((f) => sellado[f] !== actual[f])
      .map((f) => (sellado[f] ? `modificado  ${f}` : `nuevo       ${f}`)),
    ...Object.keys(sellado)
      .filter((f) => !(f in actual))
      .map((f) => `borrado     ${f}`),
  ];
}
