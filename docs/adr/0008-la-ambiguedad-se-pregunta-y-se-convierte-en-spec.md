# ADR-0008: La ambigüedad se pregunta y se convierte en spec

- **Estado:** Aceptada
- **Fecha:** 2026-10-18

## Contexto

Tres episodios de la PoC:

1. **pi decidió primero y preguntó después.** La spec del carrito no decía si `cantidad: 2.5` era válida ni qué error
   gana si la cantidad es inválida _y_ el carrito está cerrado. pi eligió, lo dejó en un comentario de `core/` y al
   terminar preguntó. Las decisiones quedaron solo en `core/`: la próxima regeneración podía perderlas.
2. **Un escenario contradictorio.** Al fijar esas reglas se coló un escenario con `cantidad: 0` y un código de error
   inexistente (`carrito-invalido`), que contradecía otro escenario. Los tres candidatos hicieron lo correcto: no
   escribieron nada y preguntaron "¿A) `cantidad-invalida` o B) `carrito-invalido`?". Pero en modo headless esa
   pregunta se perdía, `candidatos` daba ✓ por el código de salida y la sonda comparaba ficheros viejos.
3. **El abogado tenía el mismo agujero**, y peor: si no escribía nada, la spec "rechazaba" un fichero inexistente y
   daba un falso "el abogado no cabe".

## Decisión

- **Regla para el agente** (en `AGENTS.md` y en los prompts): si la spec es contradictoria o no decide un caso que
  la implementación tiene que decidir, **para y pregunta con un caso concreto**: "para \<entrada\>, ¿\<A\> o \<B\>?".
  Cambiar la spec es decisión del humano.
- **La respuesta del humano se convierte en un ejemplo de la spec** y se sella. Mientras viva solo en `core/` o en el
  chat, no es una decisión: es una casualidad.
- **Los candidatos y el abogado se validan, no se creen**: se borran los ficheros viejos antes de empezar; un
  candidato solo cuenta si su fichero existe y pasa la spec; si no, se muestra la respuesta del agente (donde está la
  pregunta). El abogado falla si no produce fichero.
- **Rechazos tipados en el arnés** (`Escenario<C, E, R extends string>`): una errata en un código de rechazo es un
  error de tipos, no un escenario imposible.

## Alternativas descartadas

- **Dejar que el agente decida y documentarlo en comentarios.** Se pierde al regenerar y nadie lo revisa.
- **Reglas más enfáticas en el prompt.** El arreglo que funcionó siempre fue hacer la regla ejecutable.
- **Fiarse del código de salida del agente headless.** Probado y descartado.

## Consecuencias

- El ciclo completo de la PoC: implementar → la sonda encuentra un hueco → el humano decide → la spec lo fija →
  cuatro implementaciones (`core/` y tres candidatos) coinciden en 2000 entradas aleatorias.
- La spec crece por las preguntas, no por adivinar casos de antemano: se especifica lo que importa cuando se descubre
  que importa.
- Ya no hace falta leer `core/` para saber cómo se comporta el sistema en esos casos.

## Referencias

Ver [ADR-0004] y [ADR-0007].

[ADR-0004]: 0004-formas-de-spec-ejecutable.md
[ADR-0007]: 0007-endurecer-la-spec.md
