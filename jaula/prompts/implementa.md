---
description: Implementa un módulo del núcleo hasta poner su spec en verde
argument-hint: "<modulo>"
---

Implementa el módulo `$ARGUMENTS` del núcleo (rutas en `jaula.config.json`) para que cumpla su spec. Si el módulo
no existe en la spec, dímelo y para. Lee primero la spec completa (tipos, firma, propósito, ejemplos y propiedades) y
`arquitectura.spec.ts`. Itera con `pnpm jaula arbitro $ARGUMENTS` hasta estar en verde y termina con `vp check`.
Implementa el propósito, no los ejemplos. Toca solo este módulo. Si la spec no decide un caso que tu implementación
tiene que decidir, para y pregúntame antes de elegir.
