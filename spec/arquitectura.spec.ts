// Reglas de arquitectura (fitness functions): lo que el núcleo NO puede hacer, para cualquier implementación.
// Ajústalas a tu proyecto: si tu núcleo necesita algo de esta lista, pásalo como dato o como puerto.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, test } from "vite-plus/test";
import { buscarRaiz, leerConfig } from "../jaula/lib/config.ts";

const raiz = buscarRaiz(import.meta.dirname);
const config = leerConfig(raiz);
const NUCLEO = join(raiz, config.nucleo);
const relSpec = relative(NUCLEO, join(raiz, config.spec)).split("\\").join("/");

const prohibido: Array<[RegExp, string]> = [
  [/\bprocess\./, "lee el entorno del proceso"],
  [/\bfetch\s*\(/, "hace red"],
  [/\bDate\.now\b|new Date\(\s*\)/, "lee el reloj (pásalo como dato)"],
  [/\bMath\.random\b|crypto\.random/, "usa azar (pásalo como dato)"],
  [/\bconsole\./, "escribe en consola"],
  [/@ts-(ignore|expect-error|nocheck)|\bas any\b/, "desactiva el verificador de tipos"],
  [/(eslint|oxlint)-disable/, "desactiva el linter"],
  [/\bimport\s*\(/, "importa dinámicamente"],
];

/** El núcleo importa otros ficheros del núcleo y, solo como tipos, el arnés y los tipos.ts de la spec. */
function importPermitido(linea: string): boolean {
  const desde = /from\s+["']([^"']+)["']/.exec(linea)?.[1];
  if (!desde) return true;
  if (/^\.\/[\w./-]+\.ts$/.test(desde) && !desde.includes("..")) return true;
  const soloTipos = /^\s*import\s+type\b/.test(linea);
  return soloTipos && (desde === "#jaula/arnes" || new RegExp(`^${relSpec}/[\\w-]+/tipos\\.ts$`).test(desde));
}

const ficheros = existsSync(NUCLEO)
  ? readdirSync(NUCLEO, { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".ts"))
  : [];

describe("arquitectura: el núcleo es puro", () => {
  if (ficheros.length === 0) test.todo("el núcleo todavía está vacío");
  test.each(ficheros)("%s", (fichero) => {
    const codigo = readFileSync(join(NUCLEO, fichero), "utf8");
    const faltas = prohibido.filter(([re]) => re.test(codigo)).map(([, motivo]) => motivo);
    const imports = codigo.split("\n").filter((l) => /^\s*(import|export)\b.*\bfrom\b/.test(l));
    faltas.push(...imports.filter((l) => !importPermitido(l)).map((l) => `import no permitido: ${l.trim()}`));
    expect(faltas).toEqual([]);
  });
});
