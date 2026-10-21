# jaula-esqueleto

Esqueleto para proyectos donde **la spec es tuya y la implementación es desechable**. Tú escribes el _qué_ (datos,
firma, propósito, ejemplos, propiedades); el agente escribe el _cómo_; un árbitro determinista decide si vale.
Dentro de la jaula la IA es libre; la jaula no la toca.

Funciona igual con **[pi](https://github.com/earendil-works/pi)** y con **[Claude Code](https://code.claude.com)**:
el candado y el árbitro son una sola implementación (`jaula/lib/`) con un adaptador fino para cada agente.

**¿Nuevo aquí?** Lee [por qué existe](docs/README.md), las [decisiones (ADR)](docs/adr/README.md), la
[bibliografía](docs/bibliografia.md) y la [guía para proyectos nuevos](docs/guia-proyectos-nuevos.md).

Stack: TypeScript · [Vite+](https://viteplus.dev) (`vp`: Vitest, Oxlint, Oxfmt, tsgo) · fast-check · Stryker.

## Empezar un proyecto

```bash
git clone git@github.com:Guuri11/jaula-esqueleto.git mi-app && cd mi-app
rm -rf .git && git init
pnpm install

# 1. Ajusta jaula.config.json (carpetas, protegidos, agente para candidatos/abogado: "pi" o "claude")
# 2. Regenera lo que depende de la config: imports, .pi/settings.json, .claude/ y CLAUDE.md
pnpm jaula configurar
# 3. Quita los ejemplos cuando ya no los necesites
rm -rf spec/carrito spec/diff-tablas core/carrito.ts core/diff-tablas.ts
# 4. Rellena "Contexto del proyecto" en AGENTS.md (CLAUDE.md es un enlace a él)
# 5. Sella y haz el primer commit
pnpm jaula sellar && git add -A && git commit -m "Esqueleto con jaula"
```

## Qué hay dentro

```
spec/                     JAULA · humano · sellada en jaula.lock
  carrito/                ejemplo Decider: escenarios given/when/then como datos + propiedad
  diff-tablas/            ejemplo de función: ejemplos + propiedad contra un modelo ingenuo
  arquitectura.spec.ts    el núcleo es puro (sin IO, reloj, azar, red, process…)
core/                     NÚCLEO · agente · core/<modulo>.ts implementa spec/<modulo>/
jaula/                    maquinaria (protegida)
  arnes/                  Decider, escenarios, aplicar → import "#jaula/arnes"
  lib/                    config · protegidos · guardia (candado) · arbitro · agentes
  cli.ts                  pnpm jaula <comando>
  pi/extension.ts         adaptador pi        ┐ misma guardia
  claude/hook.ts          adaptador Claude    ┘ y mismo árbitro
  skills/forja/           HtDF: convertir una petición en una herramienta probada
  prompts/                /htdf · /implementa · /endurece (formato común pi + Claude)
  plantillas/             lo que genera `pnpm jaula nuevo`
  vite.ts                 alias #nucleo, sustituciones (candidatos/abogado) y holdout
.pi/settings.json         carga jaula/ como paquete de pi
.claude/                  settings.json (deny + hooks), skills y commands enlazados a jaula/
jaula.config.json         la configuración de este proyecto
```

## Flujo de trabajo

| Paso              | Quién       | Cómo                                                                                        |
| ----------------- | ----------- | ------------------------------------------------------------------------------------------- |
| Diseñar un módulo | tú + agente | `/htdf <qué debe hacer>`: el agente propone datos, firma, ejemplos y propiedades en el chat |
| Crearlo           | tú          | `pnpm jaula nuevo <modulo>` (o `--decider`), rellenas la spec, `pnpm jaula sellar`          |
| Implementarlo     | agente      | `/implementa <modulo>`; si da la tarea por terminada en rojo, el árbitro le obliga a seguir |
| Endurecer la spec | agente + tú | `/endurece <modulo>`: abogado del diablo, candidatos independientes y sonda de ambigüedad   |
| Mutación          | CI / tú     | `pnpm mutacion` (Stryker sobre el núcleo)                                                   |
| Verificar todo    | CI / tú     | `pnpm arbitro` (integridad + check + toda la spec)                                          |

Cada discrepancia que encuentra la sonda, o cada pregunta que te hace el agente, es una línea más de spec.

## Cómo protege cada agente

|                     | pi                                                                  | Claude Code                            |
| ------------------- | ------------------------------------------------------------------- | -------------------------------------- |
| Candado             | extensión (`tool_call`)                                             | `permissions.deny` + hook `PreToolUse` |
| Árbitro en el bucle | `agent_before_settle`                                               | hook `Stop` (`decision: block`)        |
| Comandos            | `/arbitro`, `/implementa`, `/endurece` (validan el módulo), `/htdf` | `/implementa`, `/endurece`, `/htdf`    |
| Skill forja         | paquete de pi                                                       | `.claude/skills/forja`                 |
| Contexto            | `AGENTS.md`                                                         | `CLAUDE.md` → `AGENTS.md`              |

El candado de bash es heurístico: frena los intentos normales, no a un agente decidido. La garantía real es
`jaula.lock`, comprobado en el pre-commit y en CI (que instala desde cero, así que tocar `node_modules` no cuela).

## Holdout

Tests que el agente nunca ve, fuera del repo:

```bash
JAULA_HOLDOUT=../mi-app-holdout pnpm arbitro
```

En CI se clonan desde un repo privado (variable `HOLDOUT_REPO`, secreto `HOLDOUT_REPO_TOKEN`).

## Apps full stack

La jaula cubre el **dominio puro** (`spec/` + `core/`). El resto de la app vive fuera y usa el núcleo:

- Puertos (repositorios, pagos, reloj) con **contract tests**: la misma suite contra el fake en memoria y el real.
- Casos de uso con escenarios sobre fakes; entrega (API, CLI, web, móvil) con escenarios de petición→respuesta,
  golden tests o recorridos e2e. Lo que no es verificable (la UI) queda para tu revisión.

Para un monorepo, la forma más simple hoy es una jaula por paquete (cada uno con su `jaula.config.json`).

## Límites conocidos

- Stryker 10 usa la API JS de TypeScript, que TS 7 ya no tiene: `stryker.config.json` desactiva su preprocesado de
  tsconfig y excluye la regla de arquitectura (Stryker añade `@ts-nocheck` a los mutantes).
- Que la sonda no encuentre discrepancias no prueba que la spec esté completa: implementaciones del mismo modelo
  fallan de forma correlacionada. Por eso compara siempre contra `core/`.
