/**
 * Adaptador de la jaula para pi. La lógica vive en jaula/lib (compartida con Claude Code):
 * - candado: traduce las herramientas de pi a `Llamada` y bloquea lo que diga `juzgar`
 * - árbitro en el bucle: antes de dar una petición por terminada, spec de los módulos tocados
 * - /arbitro (completo), /implementa y /endurece (validan el módulo)
 */
import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { arbitrar, mensajeRojo } from "../lib/arbitro.ts";
import { buscarRaiz, leerConfig } from "../lib/config.ts";
import { type Contexto, juzgar, type Llamada } from "../lib/guardia.ts";

const PROMPTS = join(import.meta.dirname, "..", "prompts");

export default function jaula(pi: ExtensionAPI) {
  const modo = process.env.JAULA_MODO as Contexto["modo"];
  const destino = process.env.JAULA_DESTINO;
  const holdout = process.env.JAULA_HOLDOUT;
  // Los procesos que lance el agente no heredan la ruta del holdout.
  delete process.env.JAULA_HOLDOUT;

  const tocados = new Set<string>();
  let reintentos = 0;

  const contexto = (ctx: ExtensionContext): Contexto | undefined => {
    try {
      const raiz = buscarRaiz(ctx.cwd);
      return { raiz, config: leerConfig(raiz), modo, destino, holdout };
    } catch {
      return undefined; // fuera de un proyecto con jaula: la extensión no hace nada
    }
  };

  const traducir = (toolName: string, input: Record<string, unknown>): Llamada | undefined => {
    if (toolName === "write" || toolName === "edit") return { tipo: "escribir", ruta: String(input.path) };
    if (["read", "grep", "find", "ls"].includes(toolName))
      return { tipo: "leer", ruta: typeof input.path === "string" ? input.path : "." };
    if (toolName === "bash") return { tipo: "bash", comando: String(input.command) };
    return undefined;
  };

  pi.on("input", async () => {
    tocados.clear();
    reintentos = 0;
  });

  pi.on("tool_call", async (event, ctx) => {
    const c = contexto(ctx);
    const llamada = traducir(event.toolName, event.input as Record<string, unknown>);
    if (!c || !llamada) return undefined;
    const v = juzgar(llamada, c);
    if (!v.permitir) {
      if (ctx.hasUI) ctx.ui.notify(`🔒 jaula: ${v.motivo.split(". ")[0]}`, "warning");
      return { block: true, reason: v.motivo };
    }
    for (const m of v.toca) tocados.add(m);
    return undefined;
  });

  pi.on("session_start", async (_event, ctx) => {
    const c = contexto(ctx);
    if (!c) return;
    if (modo) return ctx.ui.setStatus("jaula", `🔒 modo ${modo} → ${destino}`);
    const r = await arbitrar(c.raiz, c.config, { modulos: [] }).catch(() => undefined);
    ctx.ui.setStatus("jaula", r?.ok ? "🔒 jaula" : ctx.ui.theme.fg("warning", "⚠ jaula: árbitro en rojo"));
  });

  pi.on("agent_before_settle", async (event, ctx) => {
    const c = contexto(ctx);
    if (!c || modo || tocados.size === 0 || event.outcome !== "completed") return undefined;
    const r = await arbitrar(c.raiz, c.config, { modulos: [...tocados] });
    if (r.ok) {
      tocados.clear();
      ctx.ui.setStatus("jaula", ctx.ui.theme.fg("success", "✓ árbitro en verde"));
      return undefined;
    }
    ctx.ui.setStatus("jaula", ctx.ui.theme.fg("error", `✗ árbitro: ${r.paso}`));
    if (reintentos >= c.config.reintentosArbitro) {
      if (ctx.hasUI) ctx.ui.notify("Árbitro en rojo tras varios intentos: te devuelvo el control.", "error");
      return undefined;
    }
    reintentos++;
    const content = mensajeRojo(r, reintentos, c.config.reintentosArbitro);
    return {
      continue: true,
      entries: [{ type: "custom_message", customType: "jaula-arbitro", display: true, content }],
    };
  });

  pi.registerCommand("arbitro", {
    description: "Verificación completa: integridad de la jaula, tipos/lint y toda la spec",
    handler: async (_args, ctx) => {
      const c = contexto(ctx);
      if (!c) return ctx.ui.notify("No hay jaula.config.json en este proyecto", "warning");
      const r = await arbitrar(c.raiz, c.config, { completo: true });
      pi.sendMessage({
        customType: "jaula-arbitro",
        display: true,
        content: r.ok
          ? `✓ Árbitro en verde: ${r.resumen}`
          : `✗ Árbitro en rojo (${r.paso}):\n\n\`\`\`\n${r.salida}\n\`\`\``,
      });
    },
  });

  // Las plantillas de jaula/prompts con argumento <modulo> se registran como comandos que lo validan.
  for (const nombre of ["implementa", "endurece"]) {
    pi.registerCommand(nombre, {
      description: `/${nombre} <modulo> (jaula)`,
      handler: async (args, ctx) => {
        const c = contexto(ctx);
        const m = args.trim();
        const dir = c ? join(c.raiz, c.config.spec) : "";
        const modulos =
          c && existsSync(dir)
            ? readdirSync(dir, { withFileTypes: true })
                .filter((d) => d.isDirectory())
                .map((d) => d.name)
            : [];
        if (!modulos.includes(m))
          return ctx.ui.notify(`Uso: /${nombre} <modulo>. Módulos: ${modulos.join(", ")}`, "warning");
        const plantilla = readFileSync(join(PROMPTS, `${nombre}.md`), "utf8").replace(/^---[\s\S]*?---\s*/, "");
        pi.sendUserMessage(plantilla.replaceAll("$ARGUMENTS", m).replaceAll("$1", m));
      },
    });
  }
}
