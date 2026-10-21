# ADR-0006: Árbitro dentro del bucle del agente, acotado al módulo

- **Estado:** Aceptada
- **Fecha:** 2026-10-18

## Contexto

Un agente puede dar una tarea por terminada con la spec en rojo, o con un resumen optimista. Si el árbitro solo vive
en CI, nos enteramos tarde.

La primera versión de la PoC ejecutaba **toda** la spec cada vez que pi intentaba terminar. En la primera sesión real,
pidiendo solo `diff-tablas`, el árbitro vio `carrito` (aún sin implementar) en rojo y le dijo a pi que no había
terminado; pi acabó implementando `carrito` sin que nadie se lo pidiera. El árbitro estaba empujando al agente fuera
del encargo.

## Decisión

- **El árbitro corre dentro del bucle del agente.** Cuando el agente va a terminar, se ejecuta; si está en rojo, se le
  devuelve la salida y se le obliga a seguir, hasta `reintentosArbitro` veces (3 por defecto). Mensaje fijo:
  "arregla la implementación, nunca la spec; si la spec te parece contradictoria, dilo y para".
  - pi: evento `agent_before_settle`.
  - Claude Code: hook `Stop` con `decision: "block"` ([B48]).
- **Acotado a lo que el agente tocó**: la spec de los módulos de `core/` que ha escrito más la regla de arquitectura.
  Si no se puede saber qué tocó (bash ambiguo, ficheros fuera del núcleo) se ejecuta la spec completa.
- **La verificación completa** (integridad + `vp check` + toda la spec) queda para `pnpm arbitro`, `/arbitro` y CI.
- Una única implementación (`jaula/lib/arbitro.ts`) para los dos agentes ([ADR-0011]).

## Alternativas descartadas

- **Árbitro solo en CI.** Feedback tardío.
- **Toda la spec en el bucle.** Probado y descartado por la sesión descrita arriba.
- **Reintentos infinitos.** Si la spec es contradictoria el agente nunca saldría; el límite deja que el humano
  intervenga.

## Consecuencias

- El agente no puede "terminar" en rojo sin que se le diga, con la salida exacta del fallo.
- Un módulo roto que el agente no tocó no bloquea su encargo; lo verá CI.
- Tocar ficheros fuera del núcleo (cáscara) ejecuta la spec completa en el bucle: más lento, pero seguro.

## Referencias

[B48]

[B48]: ../bibliografia.md#b48
[ADR-0011]: 0011-pi-y-claude-code-una-maquinaria.md
