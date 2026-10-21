# Por qué existe la jaula

Si acabas de llegar al proyecto, empieza aquí. Este documento cuenta **qué problema resuelve la jaula, de dónde sale
la idea y cómo llegamos al esqueleto actual**. Las decisiones concretas están en [`adr/`](adr/README.md), las fuentes
en la [bibliografía](bibliografia.md) y el uso práctico en la [guía de proyectos nuevos](guia-proyectos-nuevos.md).

## La idea en un párrafo

Durante décadas la arquitectura de software ha optimizado **cómo escriben código las personas**: módulos, inversión
de dependencias, capas. Con agentes de IA escribir código es casi gratis, pero el resultado no es determinista: cada
intento puede salir distinto y el agente puede equivocarse con total seguridad. Lo que sigue siendo caro (y sigue
siendo nuestro) es **decir qué tiene que hacer el sistema y comprobar que lo hace**. La jaula invierte el foco: el
humano escribe la especificación ejecutable (tipos, firmas, ejemplos, propiedades), la sella, y el agente implementa
con libertad total dentro de ella. Un árbitro determinista decide si vale. _Dentro de la jaula la IA es libre; la
jaula no la toca._

## El problema que resolvemos

1. **La IA no es determinista.** Pedir lo mismo dos veces da código distinto. Ni siquiera temperatura 0 lo garantiza
   ([B31]). El determinismo tiene que venir de fuera del modelo.
2. **"Si pasa los tests, me da igual el código" no se sostiene tal cual.** Los agentes borran tests, hardcodean casos
   y detectan el entorno de test cuando la tarea les aprieta ([B6], [B7], [B8]). Los tests tienen agujeros y se
   aprovechan.
3. **Si la IA escribe los tests leyendo el código, copia sus bugs** ([B9]). El oráculo lo tiene que poner alguien que
   sepa qué _debería_ pasar, antes de que exista el código.
4. **Una spec en Markdown no es determinista.** Las herramientas de spec-driven development en prosa producen specs
   difíciles de revisar que el agente a veces ignora ([B10]). Solo es determinista la spec que se ejecuta.

## Cómo llegamos hasta aquí

| Fecha      | Paso                        | Qué aprendimos                                                                                                                                                                                           |
| ---------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-18 | Reflexión inicial           | El código que _especifica_ (tests) gana importancia frente al que _implementa_. ¿Qué arquitectura da buena DX para eso?                                                                                  |
| 2026-10-18 | Investigación               | La tesis tiene respaldo (Karpathy, Beck, Chad Fowler, Kleppmann) pero hay que corregirla: tests con agujeros, oráculos copiados, specs en prosa                                                          |
| 2026-10-18 | Propuesta: la jaula         | Spec humana sellada + núcleo puro (Decider) + framework como cáscara + árbitro + sonda de ambigüedad + forja de herramientas (HtDF)                                                                      |
| 2026-10-18 | Prueba de concepto (pi)     | TypeScript + Vite+ + extensión de pi. pi implementó `diff-tablas` y `carrito` dentro de la jaula                                                                                                         |
| 2026-10-18 | Primera sesión real         | El árbitro empujó a pi fuera del encargo → árbitro acotado al módulo ([ADR-0006](adr/0006-arbitro-en-el-bucle-acotado.md))                                                                               |
| 2026-10-18 | Sonda "todo coincide"       | Tres candidatos del mismo modelo coincidían… en el error. La sonda incluye siempre `core/` ([ADR-0007](adr/0007-endurecer-la-spec.md))                                                                   |
| 2026-10-18 | Un escenario contradictorio | Los candidatos se negaron a implementar y el script decía ✓. Candidatos validados y rechazos tipados ([ADR-0008](adr/0008-la-ambiguedad-se-pregunta-y-se-convierte-en-spec.md))                          |
| 2026-10-18 | PoC cerrada                 | Ciclo completo: implementar → sonda encuentra hueco → humano decide → spec → 4 implementaciones coinciden                                                                                                |
| 2026-10-18 | Esqueleto reutilizable      | Maquinaria separada del contenido, configurable por proyecto, para pi y Claude Code ([ADR-0011](adr/0011-pi-y-claude-code-una-maquinaria.md), [ADR-0012](adr/0012-maquinaria-separada-del-contenido.md)) |

La lección que se repite en cada fila: **cuando algo salió mal, el arreglo nunca fue "pedirle mejor al agente"; fue
convertir la regla en algo que se ejecuta.** Una regla en `AGENTS.md` es una sugerencia; un ejemplo en la spec es una
ley.

## Filosofía

Seis principios. Cada uno tiene su ADR.

1. **Optimiza el coste de verificar, no el de generar** ([ADR-0001](adr/0001-optimizar-la-verificacion.md)). Generar
   es casi gratis; lo que limita es cuánto cuesta saber si algo está bien.
2. **El qué es humano, el cómo es desechable** ([ADR-0002](adr/0002-htdf-frontera-humano-ia.md)). La receta HtDF parte
   el trabajo justo por la mitad: datos, firma, propósito y ejemplos son tuyos; plantilla, código y tests extra, del
   agente. Revisas ejemplos, no código.
3. **Las decisiones viven en un núcleo puro; el framework es la cáscara**
   ([ADR-0003](adr/0003-nucleo-puro-y-framework-como-cascara.md)). Lo que se puede verificar barato va al centro.
4. **Solo cuenta la spec que se ejecuta** ([ADR-0004](adr/0004-formas-de-spec-ejecutable.md)). Ejemplos, tipos,
   propiedades, modelo ingenuo. Nada de mocks que congelan el cómo ni de prosa que el agente interpreta.
5. **La jaula no se negocia** ([ADR-0005](adr/0005-jaula-sellada-defensa-en-profundidad.md),
   [ADR-0006](adr/0006-arbitro-en-el-bucle-acotado.md)). Sellada con hashes, bloqueada en el agente, comprobada en
   el pre-commit y en CI. El árbitro no deja al agente dar por terminado algo en rojo.
6. **El no-determinismo de la IA es una sonda, no solo un problema** ([ADR-0007](adr/0007-endurecer-la-spec.md),
   [ADR-0008](adr/0008-la-ambiguedad-se-pregunta-y-se-convierte-en-spec.md)). N implementaciones independientes que
   discrepan señalan exactamente dónde tu spec no decide.

Y dos consecuencias prácticas:

- **La IA fabrica herramientas, no respuestas** ([ADR-0010](adr/0010-forja-la-ia-fabrica-herramientas.md)). Para
  "¿qué filas hay en A y no en B?", el agente no calcula: forja `diff-tablas` con su spec y la ejecuta. La próxima vez,
  cero inferencia.
- **Gradúa la jaula según el riesgo.** Un CRUD fino no necesita sonda ni mutación. Precios, permisos, facturación o
  sincronización, sí. El exceso de ceremonia mata la idea antes que cualquier bug.

## Qué no es nuevo (y qué sí)

Ninguna pieza es nueva: TDD, property-based testing, el Decider, modelos de referencia, programación N-versión,
mutation testing, programación por ejemplos, bibliotecas de skills. **Lo nuevo es la economía**: con implementaciones
casi gratis se vuelve asequible generar N versiones para sondear ambigüedades, regenerar en vez de mantener y mantener
una biblioteca de herramientas verificadas que se amortiza sola.

## Límites honestos

- El candado de bash del agente es heurístico. La garantía real es `jaula.lock` en el pre-commit y en CI.
- Que la sonda no encuentre discrepancias no prueba que la spec esté completa: los modelos fallan de forma
  correlacionada ([B22]).
- Lo que no se puede verificar (gusto visual, comodidad de un flujo, el copy) sigue siendo revisión humana. No es un
  fallo de la jaula: es el límite de la verificabilidad.
- Escribir specs es ingeniería de requisitos, y cuesta ([B5]). La jaula no lo hace gratis; lo hace explícito.

## Mapa de la documentación

- [`adr/`](adr/README.md): las decisiones, una por fichero, con contexto, alternativas y consecuencias.
- [`bibliografia.md`](bibliografia.md): todas las fuentes, comentadas, con las claves `[B…]` que usan los ADR.
- [`guia-proyectos-nuevos.md`](guia-proyectos-nuevos.md): cómo montar un proyecto nuevo (librería, CLI, backend, web,
  móvil, full stack).

[B5]: bibliografia.md#b5
[B6]: bibliografia.md#b6
[B7]: bibliografia.md#b7
[B8]: bibliografia.md#b8
[B9]: bibliografia.md#b9
[B10]: bibliografia.md#b10
[B22]: bibliografia.md#b22
[B31]: bibliografia.md#b31
