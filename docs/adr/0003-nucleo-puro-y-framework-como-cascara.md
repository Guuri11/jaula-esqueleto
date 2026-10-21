# ADR-0003: Núcleo puro (Decider) y framework como cáscara

- **Estado:** Aceptada
- **Fecha:** 2026-10-18

## Contexto

Una spec que tiene que pasar por HTTP, base de datos y reloj es lenta, no es hermética y queda atada al framework.
Una spec rápida y determinista necesita que las decisiones de negocio vivan en funciones puras.

Al mismo tiempo surgió la pregunta: si con IA "da igual el código", ¿hace falta un framework? ¿Por qué no que la IA lo
escriba todo desde cero? Un framework maduro (Spring Boot, Rails, Laravel…) es verificación ya pagada: miles de tests,
millones de usuarios, convenciones que reducen el espacio de búsqueda y muchísimo código de entrenamiento. Escribirlo
desde cero optimiza el coste que ya no importa: generar. Pero Chad Fowler ([B4], _Compile to Architecture_) avisa: si
la lógica vive en modelos ActiveRecord o controladores, la spec queda atada al framework.

## Decisión

Tres zonas:

- **Núcleo (`core/`)**: puro y desechable, lo escribe el agente. Sin IO, reloj, azar, red, consola ni `process`; lo
  que necesita del mundo le llega como dato. Para lógica con estado se usa el **Decider** ([B12]):
  `decide(comando, estado) → eventos | rechazo` y `evolve(estado, evento) → estado`. Mismo estado y comando, mismos
  eventos. Base: _Functional Core, Imperative Shell_ ([B13]) y la A-Frame Architecture ([B14]).
- **Cáscara**: el framework (HTTP, persistencia, auth, colas, UI) con adaptadores finos que llaman al núcleo. Se
  verifica desde fuera: escenarios petición→respuesta, contract tests de puertos, recorridos.
- **Jaula (`spec/`)**: humana y sellada ([ADR-0005]).

La pureza no es una convención: `spec/arquitectura.spec.ts` la comprueba como _fitness function_ (sin `process.`,
`fetch`, `Date.now`, `Math.random`, `console.`, `@ts-ignore`, `as any`, imports dinámicos; solo imports del núcleo y,
como tipos, del arnés y de los `tipos.ts` de la spec).

**El arnés que ejecuta la spec es pequeño, genérico y nuestro** (`jaula/arnes`). Si el agente escribiera el pegamento
(step definitions, fixtures, mocks) podría vaciar la spec sin tocar un escenario. Es el _trusted computing base_ de la
spec, y por eso está protegido.

## Alternativas descartadas

- **Sin framework, todo generado.** Optimiza la generación; multiplica lo que hay que especificar y verificar.
- **Lógica dentro del framework.** Specs lentas, no herméticas y acopladas.
- **Gherkin con step definitions escritas por el agente.** El agente controlaría el significado de la spec.

## Consecuencias

- La spec del núcleo tarda milisegundos y no necesita mocks; los escenarios del Decider son datos (dado/cuando/entonces).
- Elegir framework se reduce a tres criterios: estabilidad de su API ([B36]), su ecosistema de verificación y lo que
  el equipo lea con soltura, porque la cáscara es lo que más se revisa.
- La regla de arquitectura se ajusta por proyecto: si el núcleo necesita algo prohibido, se pasa como dato o puerto.
- Stryker instrumenta los mutantes con `@ts-nocheck`, así que la regla de arquitectura se excluye de la ejecución de
  mutación (ver `stryker.config.json`).

## Referencias

[B4], [B12], [B13], [B14], [B36]

[B4]: ../bibliografia.md#b4
[B12]: ../bibliografia.md#b12
[B13]: ../bibliografia.md#b13
[B14]: ../bibliografia.md#b14
[B36]: ../bibliografia.md#b36
[ADR-0005]: 0005-jaula-sellada-defensa-en-profundidad.md
