# ADR-0002: HtDF como frontera entre humano e IA

- **Estado:** Aceptada
- **Fecha:** 2026-10-18

## Contexto

Si el agente escribe los tests leyendo su propio código, los oráculos reflejan lo que el programa _hace_, no lo que
_debería_ hacer ([B9]). Alguien tiene que fijar el _qué_ antes de que exista el _cómo_, y tiene que poder revisarlo
rápido: revisar ocho pares entrada/salida lleva segundos; revisar doscientas líneas, no.

La receta _How to Design Functions_ de HtDP ([B19]) tiene seis pasos: datos, firma con propósito y stub, ejemplos,
plantilla, implementación y tests. Los estudios sobre aclarar la intención con tests ([B20], [B21]) muestran que los
ejemplos concretos mejoran el resultado y bajan la carga cognitiva.

## Decisión

**Los pasos 1–3 de HtDF son del humano y los 4–6 del agente.**

| Paso HtDF                           | Dónde vive                                   | Quién  |
| ----------------------------------- | -------------------------------------------- | ------ |
| 1. Datos                            | `spec/<modulo>/tipos.ts`                     | humano |
| 2. Firma, propósito                 | cabecera de `spec/<modulo>/<modulo>.spec.ts` | humano |
| 3. Ejemplos (+ propiedades)         | `spec/<modulo>/<modulo>.spec.ts`, `sonda.ts` | humano |
| 4–6. Plantilla, código, tests extra | `core/<modulo>.ts`                           | agente |

El agente puede _proponer_ los pasos 1–3 en el chat (`/htdf`), pero solo el humano los escribe en `spec/` y los sella.
**Se aprueban ejemplos, no código.** Las plantillas de `pnpm jaula nuevo` siguen esta numeración.

## Alternativas descartadas

- **El agente escribe código y tests a la vez.** Tests que confirman la implementación en vez de especificarla.
- **Especificar en prosa** (historias de usuario, Markdown). No se ejecuta; ver [ADR-0004].
- **El humano revisa el código.** Es justo el coste que queremos dejar de pagar.

## Consecuencias

- La spec sirve de documentación viva: para saber cómo trata el carrito una cantidad decimal no hace falta leer
  `core/`, lo dice un escenario.
- El humano necesita aprender a escribir buenos ejemplos y propiedades; la skill `forja` y `/htdf` ayudan a
  proponerlos.
- La spec también puede estar mal (el ejemplo oficial de HtDF tiene un error, [B19]); la sonda y los candidatos
  existen para destaparlo ([ADR-0007], [ADR-0008]).

## Referencias

[B9], [B19], [B20], [B21]

[B9]: ../bibliografia.md#b9
[B19]: ../bibliografia.md#b19
[B20]: ../bibliografia.md#b20
[B21]: ../bibliografia.md#b21
[ADR-0004]: 0004-formas-de-spec-ejecutable.md
[ADR-0007]: 0007-endurecer-la-spec.md
[ADR-0008]: 0008-la-ambiguedad-se-pregunta-y-se-convierte-en-spec.md
