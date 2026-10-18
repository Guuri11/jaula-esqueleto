# Jaula determinista

Este repo separa **qué** hace el sistema (lo escribe el humano) de **cómo** lo hace (lo escribe el agente).
Las rutas reales están en `jaula.config.json` (`spec` y `nucleo`).

```
spec/                 JAULA · humano · sellada en jaula.lock
  <modulo>/           tipos.ts (datos) · <modulo>.spec.ts (firma, propósito, ejemplos, propiedades) · sonda.ts
  arquitectura.spec.ts   lo que el núcleo NO puede hacer
core/                 NÚCLEO · agente · puro y desechable: core/<modulo>.ts implementa spec/<modulo>/
jaula/                maquinaria (arnés, CLI, extensión de pi, hooks de Claude Code, skill forja, prompts)
```

## Contexto del proyecto

<!-- Describe aquí el producto, el dominio y las decisiones de arquitectura que el agente debe conocer. -->

## Reglas para el agente

1. **Nunca modifiques la jaula** (`protegidos` en `jaula.config.json`): spec, maquinaria, configuración de agentes,
   `package.json`, lockfile… Está bloqueada y sellada; CI y el pre-commit comprueban el sello.
2. Implementa en el núcleo hasta que `pnpm jaula arbitro <modulo>` esté en verde. Cumple el **propósito**, no los
   ejemplos: nada de hardcodear casos, special-casing ni detectar el entorno de test. Las propiedades, el abogado
   del diablo y el holdout oculto existen para cazarlo.
3. El núcleo es puro: sin IO, reloj, azar, red, consola ni `process`. Lo que necesites del mundo llega como dato.
   Importa solo otros ficheros del núcleo y, como `import type`, `#jaula/arnes` y los `tipos.ts` de la spec.
4. Si la spec es contradictoria o no decide un caso que tu implementación tiene que decidir, **para y pregunta**
   con un caso concreto: "para <entrada>, ¿<salida A> o <salida B>?". Cambiar la spec es decisión del humano.
5. Toca solo el módulo que te piden. No añadas dependencias.
6. Para cálculos sobre datos, forja una herramienta (skill `forja`) en vez de calcular tú la respuesta.

## Comandos

| Comando                                                            | Qué hace                                                |
| ------------------------------------------------------------------ | ------------------------------------------------------- |
| `pnpm jaula arbitro [modulo…]`                                     | integridad de la jaula + spec (acotada a esos módulos)  |
| `pnpm arbitro`                                                     | lo mismo, completo y con `vp check` (lo que corre CI)   |
| `pnpm jaula probar <modulo> <fichero>`                             | ejecuta la spec de un módulo contra otra implementación |
| `pnpm jaula abogado <modulo>`                                      | un agente intenta colar una implementación tramposa     |
| `pnpm jaula candidatos <modulo> [n]` + `pnpm jaula sonda <modulo>` | implementaciones independientes y sus discrepancias     |
| `pnpm mutacion`                                                    | mutation testing del núcleo (Stryker)                   |
| `pnpm jaula nuevo <modulo> [--decider]` · `sellar` · `configurar`  | **solo humano**                                         |
