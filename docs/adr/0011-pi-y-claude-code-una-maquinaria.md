# ADR-0011: pi y Claude Code: una maquinaria, adaptadores finos

- **Estado:** Aceptada
- **Fecha:** 2026-10-18

## Contexto

La PoC se hizo con pi ([B47]): su API de extensiones permite bloquear llamadas a herramientas (`tool_call`) y
obligar al agente a seguir antes de terminar (`agent_before_settle`). Para el esqueleto se pidió que fuera
configurable también para Claude Code ([B48]), que ofrece lo equivalente con hooks (`PreToolUse`, `Stop`) y
`permissions.deny`.

Duplicar la lógica del candado y del árbitro por agente garantizaría que diverjan.

## Decisión

- **Una implementación** de la lógica en `jaula/lib/`: `guardia.ts` (juzga una llamada: escribir, leer, bash),
  `arbitro.ts` (integridad + spec acotada), `agentes.ts` (lanzar un agente headless), `config.ts`, `protegidos.ts`.
- **Un adaptador fino por agente** que traduce eventos:

  |                     | pi (`jaula/pi/extension.ts`)      | Claude Code (`jaula/claude/hook.ts`)       |
  | ------------------- | --------------------------------- | ------------------------------------------ |
  | Candado             | `tool_call` → `{ block, reason }` | `permissions.deny` + `PreToolUse` → `deny` |
  | Árbitro en el bucle | `agent_before_settle`             | `Stop` → `decision: "block"`               |
  | Estado de sesión    | en memoria                        | `node_modules/.cache/jaula/<sesión>.json`  |
  | Contexto            | `AGENTS.md`                       | `CLAUDE.md` → enlace a `AGENTS.md`         |

- **Skill y prompts en un formato común** (`$ARGUMENTS`), cargados como paquete de pi y enlazados en `.claude/`.
- **`pnpm jaula configurar`** genera `.pi/settings.json`, `.claude/settings.json`, los enlaces y los `imports` a
  partir de `jaula.config.json`.
- El agente headless para candidatos y abogado se elige con `agenteHeadless`.

## Alternativas descartadas

- **Solo pi.** Excluye a quien trabaja con Claude Code.
- **Lógica duplicada por agente.** Divergencia garantizada.
- **Depender solo de `permissions.deny` en Claude Code.** No cubre bash ni subprocesos; el hook sí ve los comandos.

## Consecuencias

- Añadir otro agente es escribir un adaptador, no otra jaula.
- Detalles aprendidos: en Claude Code `--allowedTools` acepta varios valores y se tragaba el prompt, así que el prompt
  va justo después de `-p`; Stryker no sabe copiar los enlaces de `.claude/`, así que esa carpeta se ignora.
- Diferencia de comodidad: pi tiene `/arbitro` y comandos que validan el módulo; en Claude Code `/implementa` y
  `/endurece` son plantillas de prompt.

## Referencias

[B47], [B48]

[B47]: ../bibliografia.md#b47
[B48]: ../bibliografia.md#b48
