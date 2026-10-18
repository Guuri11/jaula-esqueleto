// Lanza un agente aislado y no interactivo (pi o Claude Code) en modo candidato o abogado.
import { spawn } from "node:child_process";
import type { AgenteHeadless } from "./config.ts";

export type Modo = "candidato" | "abogado";

function argumentos(agente: AgenteHeadless, prompt: string): [string, string[]] {
  if (agente === "claude") {
    // acceptEdits permite escribir; el hook PreToolUse de la jaula limita la escritura a JAULA_DESTINO.
    // El prompt va justo detrás de -p: --allowedTools es variádico y se tragaría lo que venga después.
    return [
      "claude",
      ["-p", prompt, "--permission-mode", "acceptEdits", "--allowedTools", "Bash(node jaula/cli.ts probar *)"],
    ];
  }
  return ["pi", ["-p", "--no-session", "--approve", prompt]];
}

/** Devuelve el código de salida y la respuesta final (por si en vez de escribir, pregunta). */
export function lanzarAgente(
  raiz: string,
  agente: AgenteHeadless,
  modo: Modo,
  destino: string,
  prompt: string,
): Promise<{ codigo: number; respuesta: string }> {
  const { JAULA_HOLDOUT: _, ...entorno } = process.env;
  const [cmd, args] = argumentos(agente, prompt);
  return new Promise((resolver) => {
    const hijo = spawn(cmd, args, {
      cwd: raiz,
      env: { ...entorno, JAULA_MODO: modo, JAULA_DESTINO: destino },
      stdio: ["ignore", "pipe", "inherit"],
    });
    let respuesta = "";
    hijo.stdout.on("data", (d: Buffer) => {
      respuesta += d.toString();
      process.stdout.write(".");
    });
    hijo.on("error", (e) => resolver({ codigo: 1, respuesta: `No pude lanzar ${cmd}: ${e.message}` }));
    hijo.on("close", (codigo) => resolver({ codigo: codigo ?? 1, respuesta: respuesta.trim() }));
  });
}
