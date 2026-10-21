# ADR-0009: TypeScript y Vite+

- **Estado:** Aceptada
- **Fecha:** 2026-10-18

## Contexto

La pregunta inicial: ¿importa el lenguaje? Un compilador estricto como el de Rust da más verificación por iteración,
pero la legibilidad y la ergonomía de los tests importan tanto o más, porque la spec es lo que el humano escribe y lee.

Lo que aporta un lenguaje en este modelo:

- **Un verificador gratis.** Los tipos afirman cosas para todos los inputs; el 94 % de los errores de compilación del
  código generado por LLM son de tipos ([B30]).
- **Velocidad del bucle.** Bucles rápidos y simples funcionan mejor con agentes ([B32]). Rust da más verificación por
  iteración, pero cada iteración es más lenta y cara; Beck vio a la IA atascarse con el ownership y se desbloqueó
  resolviendo primero en Python con los mismos tests ([B3]).
- **Fluidez del modelo.** Depende de verificabilidad, atención en el entrenamiento y cobertura de datos ([B2]).
  TypeScript lidera en GitHub, en parte por este efecto ([B34], [B35]); Elixir destaca por inmutabilidad y estabilidad
  ([B33]).
- **Estabilidad de API.** Con código atado a versiones concretas, los modelos rondan el 50 % ([B36]).

Importa menos que la arquitectura: un núcleo puro se testea bien en cualquier lenguaje.

## Decisión

- **TypeScript** para el esqueleto: tipos estrictos, la mayor cobertura de entrenamiento, y fast-check ([B29]) y
  Stryker ([B28]) maduros.
- **Vite+** (`vp`, [B46]) como toolchain única: Vitest para la spec, Oxlint y Oxfmt, y tsgo (TypeScript 7) para tipos.
  Un solo comando (`vp check`) y un bucle muy rápido.
- **pnpm** con versión fijada (`devEngines`) y `package.json#imports` (`#nucleo/*`, `#jaula/arnes`) para que Node y
  Vite resuelvan igual.
- **Separar el lenguaje de la spec del de la implementación** es posible y deseable a largo plazo: si los ejemplos y
  escenarios son datos y el arnés es mínimo, el lenguaje del núcleo pasa a ser una decisión de despliegue (como Cedar,
  [B16], o las suites de conformidad tipo Test262).

## Alternativas descartadas

- **Rust por defecto.** Más verificación por iteración, iteraciones más caras. Recomendado para núcleos donde manden
  corrección o rendimiento (proptest, cargo-mutants, Kani/Verus).
- **Python + Hypothesis.** La mejor ergonomía para propiedades, pero tipos opcionales y más magia en tiempo de
  ejecución.

## Consecuencias

- Stryker 10 usa la API JS de TypeScript que TS 7 ya no expone: su preprocesado de tsconfig está desactivado (ver
  `stryker.config.json`).
- La regla de arquitectura se escribe con expresiones regulares sobre el código TS; en otro lenguaje habría que
  reescribirla.

## Referencias

[B2], [B3], [B16], [B28], [B29], [B30], [B32], [B33], [B34], [B35], [B36], [B46]

[B2]: ../bibliografia.md#b2
[B3]: ../bibliografia.md#b3
[B16]: ../bibliografia.md#b16
[B28]: ../bibliografia.md#b28
[B29]: ../bibliografia.md#b29
[B30]: ../bibliografia.md#b30
[B32]: ../bibliografia.md#b32
[B33]: ../bibliografia.md#b33
[B34]: ../bibliografia.md#b34
[B35]: ../bibliografia.md#b35
[B36]: ../bibliografia.md#b36
[B46]: ../bibliografia.md#b46
