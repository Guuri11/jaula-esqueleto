# ADR-0001: Optimizar el coste de verificar, no el de generar

- **Estado:** Aceptada
- **Fecha:** 2026-10-18

## Contexto

La arquitectura de software clásica (capas, módulos, inversión de dependencias) optimiza que _personas_ escriban y
mantengan código. Con agentes, generar código cuesta casi nada y se puede repetir cuantas veces haga falta. Lo que no
se abarata solo es saber si el código hace lo que queremos. Además, el modelo no es determinista: dos intentos dan
código distinto, y ni temperatura 0 lo garantiza ([B31]).

Karpathy lo resume: "Software 2.0 easily automates what you can verify" ([B1]). Una tarea es verificable si se puede
reintentar, repetir muchas veces y juzgar automáticamente. Beck ([B3]) reescribió la misma librería en Rust, Python y
C contra los mismos tests; Chad Fowler ([B4]) trata la implementación como una caché y las evaluaciones como el
verdadero código; Kleppmann ([B11]) señala que con un verificador da igual que la IA alucine.

## Decisión

El principio que ordena el resto del proyecto: **toda decisión de diseño se evalúa por cuánto abarata verificar.**

La formulación concreta de "me da igual el código" es: _me da igual cómo esté escrito siempre que_

1. cumpla la spec,
2. respete las reglas de arquitectura,
3. no empeore las métricas no funcionales que nos importan,
4. siga siendo barato de cambiar.

Las cuatro tienen que poder comprobarse automáticamente. Lo que no se puede comprobar no se delega a ciegas.

## Alternativas descartadas

- **"Si pasa los tests, vale" sin más.** Los agentes explotan tests débiles: borran tests, hacen special-casing,
  detectan el entorno ([B6], [B7], [B8]). Hace falta además que la jaula sea inviolable ([ADR-0005]) y que la spec
  tenga propiedades que impidan el hardcodeo ([ADR-0004]).
- **Optimizar la generación** (prompts más largos, más contexto, reglas en Markdown). Ataca el coste que ya no importa
  y no aporta determinismo.

## Consecuencias

- El núcleo puro ([ADR-0003]), las formas de spec ([ADR-0004]), la elección de lenguaje ([ADR-0009]) y la forja
  ([ADR-0010]) se derivan de aquí.
- Lo no verificable (UI, gusto, copy) queda explícitamente fuera y se revisa a mano.
- La implementación es desechable: se puede regenerar o cambiar de lenguaje sin tocar la spec. El aviso de Fowler
  ("the implementation remembers", [B4]) obliga a capturar en la spec las lecciones que hoy solo viven en el código
  antes de regenerarlo.

## Referencias

[B1], [B3], [B4], [B6], [B7], [B8], [B11], [B31]

[B1]: ../bibliografia.md#b1
[B3]: ../bibliografia.md#b3
[B4]: ../bibliografia.md#b4
[B6]: ../bibliografia.md#b6
[B7]: ../bibliografia.md#b7
[B8]: ../bibliografia.md#b8
[B11]: ../bibliografia.md#b11
[B31]: ../bibliografia.md#b31
[ADR-0003]: 0003-nucleo-puro-y-framework-como-cascara.md
[ADR-0004]: 0004-formas-de-spec-ejecutable.md
[ADR-0005]: 0005-jaula-sellada-defensa-en-profundidad.md
[ADR-0009]: 0009-typescript-y-vite-plus.md
[ADR-0010]: 0010-forja-la-ia-fabrica-herramientas.md
