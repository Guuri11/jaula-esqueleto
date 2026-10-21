# ADR-0012: Maquinaria separada del contenido, dentro del repo

- **Estado:** Aceptada
- **Fecha:** 2026-10-18

## Contexto

La PoC (`~/dev/jaula`) mezclaba la maquinaria (arnés, scripts, extensión de pi) con el contenido de un proyecto
concreto (la spec del carrito), con rutas fijas. Para usarla en cualquier proyecto surgió la pregunta: ¿hay que
duplicar la jaula en cada proyecto?

| Maquinaria (se escribe una vez)                              | Contenido (de cada proyecto)             |
| ------------------------------------------------------------ | ---------------------------------------- |
| arnés, CLI, guardia, árbitro, adaptadores, forja, plantillas | `spec/`, `core/`, `AGENTS.md` (contexto) |
| fragmento de Vite (`jaula/vite.ts`)                          | `jaula.config.json`, `jaula.lock`        |

## Decisión

- **Toda la maquinaria vive en `jaula/`** y no sabe nada del proyecto: lee rutas y opciones de
  `jaula.config.json` (`spec`, `nucleo`, `protegidos`, `comandos`, `agenteHeadless`, `reintentosArbitro`).
- **Se distribuye como esqueleto** (este repo): se clona, se ajusta la config, `pnpm jaula configurar` y se sella.
  `jaula/` queda dentro del repo y **sellada como parte de la jaula**.
- `jaula/package.json` ya es un paquete de pi válido (clave `pi`), cargado localmente desde `.pi/settings.json`.
- `pnpm jaula nuevo <modulo> [--decider]` genera spec y stub desde `jaula/plantillas/`.

## Alternativas descartadas (por ahora)

- **Paquete npm + paquete de pi publicado** (`@guuri11/jaula`). Actualizaciones centralizadas, pero el arnés pasaría
  a `node_modules`, donde el agente podría editarlo: habría que sellar `package.json` y lockfile, bloquear esa ruta y
  confiar en que CI instala desde cero. Más piezas para una primera versión. Queda como evolución natural.
- **Copiar la PoC tal cual.** Rutas fijas y contenido de ejemplo mezclado con la maquinaria.

## Consecuencias

- Un proyecto es autocontenido: lo que se ejecuta es exactamente lo que está sellado.
- Actualizar la maquinaria en proyectos existentes es manual (copiar `jaula/`, revisar, sellar). Si hay muchos
  proyectos, toca pasar al paquete npm.
- Monorepos: hoy, una jaula por paquete (cada uno con su `jaula.config.json`). Un árbitro por paquetes ("fichero
  tocado → paquete → su spec y la de sus dependientes") es trabajo futuro.

## Referencias

Ver [ADR-0005] y [ADR-0011].

[ADR-0005]: 0005-jaula-sellada-defensa-en-profundidad.md
[ADR-0011]: 0011-pi-y-claude-code-una-maquinaria.md
