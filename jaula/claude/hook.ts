// Adaptador de la jaula para Claude Code. `.claude/settings.json` lo invoca como:
//   node "$CLAUDE_PROJECT_DIR/jaula/claude/hook.ts" <pre|prompt|stop>
// con el evento en stdin (JSON). La lógica vive en jaula/lib, compartida con pi.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { arbitrar, mensajeRojo } from "../lib/arbitro.ts";
import { buscarRaiz, leerConfig } from "../lib/config.ts";
import { type Contexto, juzgar, type Llamada } from "../lib/guardia.ts";

type Evento = {
  session_id?: string;
  cwd?: string;
  tool_name?: string;
  tool_input?: Record<string, unknown>;
  stop_hook_active?: boolean;
};

const fase = process.argv[2];
const evento = JSON.parse(readFileSync(0, "utf8") || "{}") as Evento;

let raiz: string;
try {
  raiz = buscarRaiz(process.env.CLAUDE_PROJECT_DIR ?? evento.cwd ?? process.cwd());
} catch {
  process.exit(0); // fuera de un proyecto con jaula
}
const config = leerConfig(raiz);
const ctx: Contexto = {
  raiz,
  config,
  modo: process.env.JAULA_MODO as Contexto["modo"],
  destino: process.env.JAULA_DESTINO,
  holdout: process.env.JAULA_HOLDOUT,
};

// Estado por sesión: módulos tocados y reintentos del árbitro.
type Estado = { tocados: string[]; reintentos: number };
const dirEstado = join(raiz, "node_modules", ".cache", "jaula");
const ficheroEstado = join(dirEstado, `${evento.session_id ?? "sesion"}.json`);
const leerEstado = (): Estado =>
  existsSync(ficheroEstado)
    ? (JSON.parse(readFileSync(ficheroEstado, "utf8")) as Estado)
    : { tocados: [], reintentos: 0 };
const guardarEstado = (e: Estado) => {
  mkdirSync(dirEstado, { recursive: true });
  writeFileSync(ficheroEstado, JSON.stringify(e));
};

function traducir(herramienta: string, input: Record<string, unknown>): Llamada | undefined {
  if (["Edit", "Write", "MultiEdit"].includes(herramienta)) return { tipo: "escribir", ruta: String(input.file_path) };
  if (herramienta === "NotebookEdit") return { tipo: "escribir", ruta: String(input.notebook_path) };
  if (herramienta === "Read") return { tipo: "leer", ruta: String(input.file_path) };
  if (herramienta === "Grep" || herramienta === "Glob")
    return { tipo: "leer", ruta: typeof input.path === "string" ? input.path : "." };
  if (herramienta === "Bash") return { tipo: "bash", comando: String(input.command) };
  return undefined;
}

if (fase === "pre") {
  const llamada = traducir(evento.tool_name ?? "", evento.tool_input ?? {});
  if (!llamada) process.exit(0);
  const v = juzgar(llamada, ctx);
  if (!v.permitir) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: "PreToolUse",
          permissionDecision: "deny",
          permissionDecisionReason: v.motivo,
        },
      }),
    );
    process.exit(0);
  }
  if (v.toca.length > 0 && !ctx.modo) {
    const e = leerEstado();
    guardarEstado({ ...e, tocados: [...new Set([...e.tocados, ...v.toca])] });
  }
} else if (fase === "prompt") {
  guardarEstado({ tocados: [], reintentos: 0 });
} else if (fase === "stop") {
  const e = leerEstado();
  if (ctx.modo || e.tocados.length === 0) process.exit(0);
  const r = await arbitrar(raiz, config, { modulos: e.tocados });
  if (r.ok) {
    guardarEstado({ tocados: [], reintentos: 0 });
    process.exit(0);
  }
  if (e.reintentos >= config.reintentosArbitro) {
    process.stdout.write(
      JSON.stringify({ systemMessage: `Árbitro en rojo (${r.paso}) tras ${e.reintentos} intentos.` }),
    );
    process.exit(0);
  }
  guardarEstado({ ...e, reintentos: e.reintentos + 1 });
  process.stdout.write(
    JSON.stringify({ decision: "block", reason: mensajeRojo(r, e.reintentos + 1, config.reintentosArbitro) }),
  );
}
