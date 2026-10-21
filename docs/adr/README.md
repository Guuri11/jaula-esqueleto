# Registro de decisiones de arquitectura (ADR)

Cada ADR recoge **una** decisión: el contexto que la provocó, qué decidimos, qué alternativas descartamos y qué
consecuencias aceptamos. Formato de Nygard ([B18]). Si no conoces el proyecto, lee antes [`../README.md`](../README.md).

| ADR                                                              | Decisión                                                          | Estado   |
| ---------------------------------------------------------------- | ----------------------------------------------------------------- | -------- |
| [0001](0001-optimizar-la-verificacion.md)                        | Optimizar el coste de verificar, no el de generar                 | Aceptada |
| [0002](0002-htdf-frontera-humano-ia.md)                          | HtDF como frontera entre humano e IA                              | Aceptada |
| [0003](0003-nucleo-puro-y-framework-como-cascara.md)             | Núcleo puro (Decider) y framework como cáscara                    | Aceptada |
| [0004](0004-formas-de-spec-ejecutable.md)                        | Solo cuenta la spec que se ejecuta: ejemplos, tipos, propiedades… | Aceptada |
| [0005](0005-jaula-sellada-defensa-en-profundidad.md)             | Jaula sellada con defensa en profundidad                          | Aceptada |
| [0006](0006-arbitro-en-el-bucle-acotado.md)                      | Árbitro dentro del bucle del agente, acotado al módulo            | Aceptada |
| [0007](0007-endurecer-la-spec.md)                                | Endurecer la spec: abogado, candidatos, sonda, mutación, holdout  | Aceptada |
| [0008](0008-la-ambiguedad-se-pregunta-y-se-convierte-en-spec.md) | La ambigüedad se pregunta y se convierte en spec                  | Aceptada |
| [0009](0009-typescript-y-vite-plus.md)                           | TypeScript y Vite+                                                | Aceptada |
| [0010](0010-forja-la-ia-fabrica-herramientas.md)                 | Forja: la IA fabrica herramientas, no respuestas                  | Aceptada |
| [0011](0011-pi-y-claude-code-una-maquinaria.md)                  | pi y Claude Code: una maquinaria, adaptadores finos               | Aceptada |
| [0012](0012-maquinaria-separada-del-contenido.md)                | Maquinaria separada del contenido, dentro del repo                | Aceptada |

## Cómo añadir un ADR

1. Copia el formato de cualquiera: título, estado, fecha, contexto, decisión, alternativas, consecuencias, referencias.
2. Numera con el siguiente número libre. No reescribas ADR aceptados: si una decisión cambia, escribe uno nuevo que la
   **sustituya** y marca el antiguo como `Sustituida por ADR-00NN`.
3. Las referencias usan las claves de [`../bibliografia.md`](../bibliografia.md).

[B18]: ../bibliografia.md#b18
