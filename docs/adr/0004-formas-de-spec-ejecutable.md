# ADR-0004: Solo cuenta la spec que se ejecuta

- **Estado:** Aceptada
- **Fecha:** 2026-10-18

## Contexto

Tres problemas con las specs habituales:

- **Prosa.** Las herramientas de spec-driven development en Markdown dan specs tediosas de revisar, que el agente a
  veces ignora y que no producen el mismo resultado dos veces ([B10]).
- **Mocks.** Un test con mocks especifica _a quién se llama y con qué_: congela la implementación ([B14]). Prueba de
  Chad Fowler ([B4]): si reescribir el módulo en otro lenguaje rompe tu suite, los tests están en la frontera
  equivocada.
- **Solo ejemplos.** Tienen agujeros: una implementación que hardcodea los ejemplos los pasa todos ([B6]).

Y un riesgo al otro lado: una spec completa acaba siendo tan compleja como el código (la lección de MDD y CASE).

## Decisión

La spec se escribe solo con formas ejecutables y deterministas, de la más barata a la más fuerte:

| Forma                | Qué afirma                             | En el esqueleto                                              |
| -------------------- | -------------------------------------- | ------------------------------------------------------------ |
| Ejemplos             | estos casos concretos                  | `test.each` (función) o `escenarios` (Decider)               |
| Tipos                | la forma, para todo input              | `tipos.ts`; rechazos tipados (`CodigoRechazo`)               |
| Propiedades          | invariantes sobre entradas aleatorias  | fast-check ([B29]) con generadores en `sonda.ts`             |
| Modelo de referencia | "hace lo mismo que la versión ingenua" | `ingenuo` en `sonda.ts`, comparado por propiedad             |
| Prueba formal        | invariantes demostradas                | fuera del esqueleto; asequible para núcleos críticos ([B17]) |

El **modelo ingenuo** es la herramienta más infrautilizada: una versión obviamente correcta aunque lenta (O(n·m) en
`diff-tablas`), contra la que se compara la real. Es la técnica de ShardStore en S3 ([B15]).

**Especifica solo lo que te importa.** Lo que no se especifica significa "me da igual", y el agente lo decidirá. Si
resulta que sí importaba, la sonda lo encuentra ([ADR-0007]) y se convierte en un ejemplo más ([ADR-0008]).

## Alternativas descartadas

- **Specs en Markdown, Gherkin libre, historias de usuario.** No deterministas.
- **Tests con mocks como spec.** Especifican el cómo.
- **Solo ejemplos.** El special-casing los atraviesa; hacen falta propiedades.
- **Especificarlo todo.** Tan caro como el código, y rígido.

## Consecuencias

- Los ejemplos se revisan en segundos; las propiedades impiden el hardcodeo y el shrinking da contraejemplos mínimos
  (`[[{"id":0,"v":""}],[]]` cazó una implementación tramposa en la PoC).
- Los generadores viven en `sonda.ts` y los comparten la spec y la sonda de ambigüedad: si el generador nunca produce
  un caso (Infinity, SKUs raros), ni las propiedades ni la sonda lo ven. Ampliar generadores es parte de endurecer.
- Rechazos tipados: un `entonces: { error: "carrito-invalido" }` con una errata lo caza `vp check` antes de llegar a
  ningún agente (lección de la PoC, [ADR-0008]).

## Referencias

[B4], [B6], [B10], [B14], [B15], [B17], [B29]

[B4]: ../bibliografia.md#b4
[B6]: ../bibliografia.md#b6
[B10]: ../bibliografia.md#b10
[B14]: ../bibliografia.md#b14
[B15]: ../bibliografia.md#b15
[B17]: ../bibliografia.md#b17
[B29]: ../bibliografia.md#b29
[ADR-0007]: 0007-endurecer-la-spec.md
[ADR-0008]: 0008-la-ambiguedad-se-pregunta-y-se-convierte-en-spec.md
