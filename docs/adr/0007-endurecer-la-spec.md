# ADR-0007: Endurecer la spec: abogado, candidatos, sonda, mutación y holdout

- **Estado:** Aceptada
- **Fecha:** 2026-10-18

## Contexto

Que una implementación pase la spec no dice cuánto aprieta la spec. Hace falta medir sus agujeros. Y la variabilidad
de la IA, que es un problema para obtener _una_ respuesta, es útil para encontrar _dónde_ la spec no decide: si N
implementaciones independientes discrepan en una entrada, la spec es ambigua justo ahí. CodeT ([B25]) usa el acuerdo
entre muestras; el testing diferencial destapó los parches erróneos de SWE-bench ([B7]).

Límite conocido desde 1986: versiones "independientes" fallan de forma correlacionada ([B22]), y las muestras de un
mismo modelo, más. Lo vimos en la PoC: la sonda dijo "3 implementaciones coinciden" porque los tres candidatos
aceptaban cantidades decimales, igual que el primer `core/`, y el humano había decidido lo contrario.

## Decisión

Cinco herramientas, de la más barata a la más cara:

| Herramienta         | Comando                          | Qué encuentra                                                                                   |
| ------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------- |
| Mutación            | `pnpm mutacion` (Stryker, [B28]) | código del núcleo que la spec no ejercita                                                       |
| Abogado del diablo  | `pnpm jaula abogado <m>`         | la implementación más tramposa que pasa la spec (mutación semántica, como ACH de Meta, [B26])   |
| Candidatos          | `pnpm jaula candidatos <m> [n]`  | N implementaciones independientes, cada una aislada (solo ve la spec y solo escribe su fichero) |
| Sonda de ambigüedad | `pnpm jaula sonda <m>`           | la entrada **mínima** donde las implementaciones discrepan                                      |
| Holdout             | `JAULA_HOLDOUT=… pnpm arbitro`   | special-casing contra tests que el agente nunca vio ([B6], [B27])                               |

Reglas que salieron de la PoC:

- **La sonda compara siempre contra `core/`**, además de los candidatos. Coincidir entre candidatos del mismo modelo
  no prueba nada.
- **La sonda es un detector de ambigüedad, no un oráculo.** "Coinciden" significa "no discrepan dentro de lo que
  generan los generadores".
- `/endurece <m>` encadena estas herramientas desde el agente; el humano decide qué hacer con lo que encuentran.
- El agente headless de candidatos y abogado es configurable (`agenteHeadless`: `pi` o `claude`).

## Alternativas descartadas

- **Confiar en la cobertura de líneas.** No mide si las aserciones aprietan.
- **Usar el acuerdo como oráculo** (votación). Fallos correlacionados ([B22]).
- **Ocultar toda la spec.** Las trampas bajan, pero también el rendimiento legítimo ([B6]); el holdout es un
  complemento, no un sustituto.

## Consecuencias

- Endurecer cuesta inferencia (N agentes); se usa donde la lógica es densa o cara de romper.
- Cada discrepancia es una pregunta concreta para el humano ([ADR-0008]).
- Los generadores de `sonda.ts` limitan lo que se explora: hay que ampliarlos cuando el dominio tenga bordes
  (Infinity, cadenas raras, tamaños grandes).

## Referencias

[B6], [B7], [B22], [B25], [B26], [B27], [B28]

[B6]: ../bibliografia.md#b6
[B7]: ../bibliografia.md#b7
[B22]: ../bibliografia.md#b22
[B25]: ../bibliografia.md#b25
[B26]: ../bibliografia.md#b26
[B27]: ../bibliografia.md#b27
[B28]: ../bibliografia.md#b28
[ADR-0008]: 0008-la-ambiguedad-se-pregunta-y-se-convierte-en-spec.md
