# ADR-0010: Forja: la IA fabrica herramientas, no respuestas

- **Estado:** Aceptada
- **Fecha:** 2026-10-18

## Contexto

Un modelo no es fiable para _calcular_ "¿qué filas hay en esta tabla y no en la otra?": no es determinista ([B31]) y
cada respuesta habría que revisarla. Pero sí es bueno _escribiendo una herramienta_ que lo calcule. Si esa herramienta
nace con su spec (ejemplos, propiedades, modelo ingenuo), es determinista y probada, y la próxima vez que se pida lo
mismo no hace falta inferencia.

Precedentes: el modelo escribe el programa y el intérprete calcula ([B38]); un modelo fabrica herramientas que otros
usan, una "caché funcional" ([B39]); bibliotecas de skills de código ejecutable ([B40], [B41], [B42]); revisar la
fórmula en vez de cada resultado ([B43], [B44]).

## Decisión

Skill **`forja`** (`jaula/skills/forja/SKILL.md`), compartida por pi y Claude Code:

1. Ante una petición de cálculo sobre datos, buscar si ya existe una herramienta con esa firma y propósito. Si existe,
   ejecutarla.
2. Si no existe, proponer HtDF ([ADR-0002]): datos, firma, propósito, ejemplos, propiedades y modelo ingenuo. **El
   humano aprueba los ejemplos, no el código.**
3. El humano crea el módulo (`pnpm jaula nuevo`), pega la spec aprobada y sella; el agente implementa bajo el árbitro;
   se endurece si merece la pena.
4. La herramienta queda en `spec/` + `core/` y se usa en adelante.

Regla en `AGENTS.md`: "para cálculos sobre datos, forja una herramienta en vez de calcular tú la respuesta".

## Alternativas descartadas

- **Pedir el resultado al modelo cada vez.** Caro, no determinista, sin verificar.
- **Herramientas sin spec.** Código generado sin oráculo: no sabemos si está bien.

## Consecuencias

- Con el uso se acumula una biblioteca personal de herramientas verificadas: cada inferencia se convierte en un activo.
- Si un día se quiere una versión más rápida o en otro lenguaje, la spec viaja con ella.
- Requiere disciplina para no forjar lo trivial; la forja es para cálculos que se repiten o importan.

## Referencias

[B31], [B38], [B39], [B40], [B41], [B42], [B43], [B44]

[B31]: ../bibliografia.md#b31
[B38]: ../bibliografia.md#b38
[B39]: ../bibliografia.md#b39
[B40]: ../bibliografia.md#b40
[B41]: ../bibliografia.md#b41
[B42]: ../bibliografia.md#b42
[B43]: ../bibliografia.md#b43
[B44]: ../bibliografia.md#b44
[ADR-0002]: 0002-htdf-frontera-humano-ia.md
