// El candado, independiente del agente: pi y Claude Code traducen sus herramientas a `Llamada`
// y aplican lo que diga `juzgar`.
import { relative, resolve } from "node:path";
import type { Config } from "./config.ts";
import { esProtegida, relativa } from "./protegidos.ts";

export type Llamada =
  | { tipo: "escribir"; ruta: string }
  | { tipo: "leer"; ruta: string }
  | { tipo: "bash"; comando: string };

export type Contexto = {
  raiz: string;
  config: Config;
  /** Modo aislado de candidatos y abogado: solo ven la spec y solo escriben `destino`. */
  modo?: "candidato" | "abogado";
  destino?: string;
  /** Ruta del holdout, si la hay: el agente no puede verla. */
  holdout?: string;
};

export type Veredicto =
  | { permitir: true; /** módulos del núcleo que puede estar tocando ("*" si no se sabe) */ toca: string[] }
  | { permitir: false; motivo: string };

const ESCRITURA_BASH =
  /((?<![0-9&=-])>{1,2}(?!&)|\btee\b|\bsed\s+-i|\bperl\s+-[pi]|\brm\b|\bmv\b|\bcp\b|\btruncate\b|\bchmod\b|\bln\b|\bgit\s+(checkout|restore|reset|stash|apply|mv|rm)\b|writeFile|\bpatch\b)/;
const DEPENDENCIA = /\b(pnpm|npm|yarn|bun|vp)\s+(add|install|i)\s+[^-\s]/;
const PROHIBIDO_BASH = /--no-verify|\bjaula(\s+|\/cli\.ts\s+)(sellar|configurar|nuevo)\b/;

export const MOTIVO_JAULA =
  "Está dentro de la jaula (la spec y su configuración son del humano). No la cambies ni la rodees. " +
  "Si crees que la spec está mal o es ambigua, para y explícaselo al humano con un ejemplo concreto.";

/** Quita el cuerpo de los heredocs: su texto es contenido, no rutas sobre las que se actúa. */
const sinHeredocs = (cmd: string) => cmd.replace(/<<-?\s*['"]?(\w+)['"]?[^\n]*\n[\s\S]*?\n\1(?=\n|$)/g, "<<…");
const escapar = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** ¿Aparece la ruta como ruta (no como palabra suelta) en el comando? */
function mencionaRuta(cmd: string, ruta: string): boolean {
  const despues = ruta.endsWith("/") ? "" : `($|[\\s'";&|)])`;
  return new RegExp(`(^|[\\s'"=:(;&|])(\\.{1,2}/)*` + escapar(ruta) + despues).test(cmd);
}

function moduloDe(ctx: Contexto, rel: string): string | undefined {
  const prefijo = `${ctx.config.nucleo}/`;
  if (!rel.startsWith(prefijo)) return undefined;
  return rel
    .slice(prefijo.length)
    .split("/")[0]
    .replace(/\.[cm]?[jt]sx?$/, "");
}

export function juzgar(llamada: Llamada, ctx: Contexto): Veredicto {
  const no = (motivo: string): Veredicto => ({ permitir: false, motivo });
  const enHoldout = (ruta: string) =>
    !!ctx.holdout && !relative(resolve(ctx.holdout), resolve(ctx.raiz, ruta)).startsWith("..");
  const aislada = (rel: string) =>
    !!ctx.modo &&
    rel !== ctx.destino &&
    (rel === ctx.config.nucleo ||
      rel.startsWith(`${ctx.config.nucleo}/`) ||
      rel.startsWith(".candidatos/") ||
      rel.startsWith(".abogado/"));

  if (llamada.tipo === "escribir") {
    const rel = relativa(ctx.raiz, llamada.ruta);
    if (ctx.modo)
      return rel === ctx.destino
        ? { permitir: true, toca: [] }
        : no(`En modo ${ctx.modo} solo puedes escribir ${ctx.destino}.`);
    if (enHoldout(llamada.ruta)) return no("Ruta no disponible.");
    if (esProtegida(ctx.raiz, ctx.config, rel)) return no(`"${rel}": ${MOTIVO_JAULA}`);
    return { permitir: true, toca: [moduloDe(ctx, rel) ?? "*"] };
  }

  if (llamada.tipo === "leer") {
    if (enHoldout(llamada.ruta)) return no("Ruta no disponible.");
    const rel = relativa(ctx.raiz, llamada.ruta);
    if (aislada(rel)) return no(`En modo ${ctx.modo} trabajas solo con la spec: no puedes leer ${rel}.`);
    return { permitir: true, toca: [] };
  }

  const original = llamada.comando;
  const cmd = sinHeredocs(original);
  if (ctx.holdout && (cmd.includes(resolve(ctx.holdout)) || cmd.includes("JAULA_HOLDOUT")))
    return no("Ruta no disponible.");
  if (PROHIBIDO_BASH.test(cmd)) return no(`Sellar la jaula o saltarse los hooks es cosa del humano. ${MOTIVO_JAULA}`);
  if (DEPENDENCIA.test(cmd))
    return no("Añadir dependencias es decisión del humano: el núcleo debería poder vivir sin ellas.");
  if (ctx.modo) {
    const resto = ctx.destino ? cmd.replaceAll(ctx.destino, "") : cmd;
    if (mencionaRuta(resto, `${ctx.config.nucleo}/`) || /\.candidatos\/|\.abogado\//.test(resto)) {
      return no(`En modo ${ctx.modo} trabajas solo con la spec.`);
    }
  }
  const enJaula = ctx.config.protegidos.filter((p) => mencionaRuta(cmd, p));
  if (enJaula.length > 0 && ESCRITURA_BASH.test(cmd)) {
    return no(`El comando parece modificar ${enJaula.join(", ")}. ${MOTIVO_JAULA}`);
  }
  if (ctx.modo || !ESCRITURA_BASH.test(cmd)) return { permitir: true, toca: [] };
  const nucleo = escapar(ctx.config.nucleo);
  const modulos = [...original.matchAll(new RegExp(`\\b${nucleo}/([\\w-]+)`, "g"))].map((m) =>
    m[1].replace(/\.[cm]?[jt]sx?$/, ""),
  );
  return { permitir: true, toca: modulos.length > 0 ? modulos : ["*"] };
}
