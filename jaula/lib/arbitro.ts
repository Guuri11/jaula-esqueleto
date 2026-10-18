// El árbitro: integridad de la jaula, (opcional) tipos/lint y spec. Lo usan la CLI, pi, Claude Code y CI.
import { spawn, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";
import type { Config } from "./config.ts";
import { diferencias } from "./protegidos.ts";

export type Resultado = { ok: true; resumen: string } | { ok: false; paso: string; salida: string };

/** Módulos con spec propia entre los indicados. "*" o ninguno conocido → toda la spec. */
export function specsDe(raiz: string, config: Config, modulos: string[]): string[] {
  if (modulos.length === 0 || modulos.includes("*")) return [];
  const conSpec = [...new Set(modulos)].filter((m) => existsSync(join(raiz, config.spec, m)));
  if (conSpec.length === 0) return [];
  const arquitectura = join(config.spec, "arquitectura.spec.ts");
  return [
    ...conSpec.map((m) => `${config.spec}/${m}`),
    ...(existsSync(join(raiz, arquitectura)) ? [arquitectura] : []),
  ];
}

/** Módulos del núcleo con cambios sin commitear, según git (para agentes que no llevan la cuenta). */
export function modulosCambiados(raiz: string, config: Config): string[] {
  const git = spawnSync("git", ["status", "--porcelain", "-uall", "--", config.nucleo], {
    cwd: raiz,
    encoding: "utf8",
  });
  if (git.status !== 0) return ["*"];
  const prefijo = `${config.nucleo}/`;
  return git.stdout
    .split("\n")
    .map((l) => l.slice(3).trim().split(" -> ").pop() ?? "")
    .filter((f) => f.startsWith(prefijo))
    .map((f) =>
      f
        .slice(prefijo.length)
        .split("/")[0]
        .replace(/\.[cm]?[jt]sx?$/, ""),
    );
}

function ejecutar(cmd: string, args: string[], cwd: string): Promise<{ codigo: number; salida: string }> {
  return new Promise((resolver) => {
    const hijo = spawn(cmd, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let salida = "";
    const recoger = (d: Buffer) => (salida += d.toString());
    hijo.stdout.on("data", recoger);
    hijo.stderr.on("data", recoger);
    const reloj = setTimeout(() => hijo.kill(), 300_000);
    hijo.on("error", (e) => resolver({ codigo: 1, salida: e.message }));
    hijo.on("close", (codigo) => {
      clearTimeout(reloj);
      resolver({ codigo: codigo ?? 1, salida });
    });
  });
}

export async function arbitrar(
  raiz: string,
  config: Config,
  opciones: { modulos?: string[]; completo?: boolean } = {},
): Promise<Resultado> {
  const fallo = diferencias(raiz, config);
  if (fallo.length > 0) {
    return { ok: false, paso: "integridad", salida: `La jaula no coincide con jaula.lock:\n  ${fallo.join("\n  ")}` };
  }
  const specs = opciones.completo ? [] : specsDe(raiz, config, opciones.modulos ?? ["*"]);
  const pasos: Array<[string, string[]]> = [
    ...(opciones.completo ? ([["tipos y lint", config.comandos.check]] as Array<[string, string[]]>) : []),
    [specs.length > 0 ? `spec (${specs.join(", ")})` : "spec", [...config.comandos.test, ...specs]],
  ];
  for (const [paso, [cmd, ...args]] of pasos) {
    const r = await ejecutar(cmd, args, raiz);
    if (r.codigo !== 0) return { ok: false, paso, salida: r.salida.trim().split("\n").slice(-60).join("\n") };
  }
  return { ok: true, resumen: pasos.map(([p]) => p).join(" · ") };
}

export function mensajeRojo(r: Extract<Resultado, { ok: false }>, intento: number, maximo: number): string {
  return (
    `El árbitro está en ROJO (${r.paso}), intento ${intento}/${maximo}. No des la tarea por terminada. ` +
    "Arregla la implementación, nunca la spec. Si la spec es contradictoria o no decide un caso que necesitas " +
    `decidir, para y pregúntaselo al humano con un ejemplo concreto.\n\n\`\`\`\n${r.salida}\n\`\`\``
  );
}
