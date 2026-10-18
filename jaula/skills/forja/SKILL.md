---
name: forja
description: Convierte una petición de cálculo o transformación de datos (comparar tablas, agrupar, validar, convertir, calcular…) en una herramienta determinista y probada siguiendo HtDF, en lugar de calcular la respuesta con el modelo. Úsala cuando el usuario pida un resultado que un programa puede calcular.
---

# Forja de herramientas (HtDF)

Nunca calcules tú el resultado de una transformación de datos: forja una herramienta que lo calcule y ejecútala.
El modelo no es determinista y el código sí. Lee `jaula.config.json` para saber dónde están la spec (`spec`) y el
núcleo (`nucleo`).

## 0. ¿Ya existe?

Busca en la spec un módulo cuyo propósito encaje (cabecera "Firma y propósito" de cada `*.spec.ts`). Si existe y
está en verde, úsalo: ve al paso 5.

## 1–3. Propón la spec (la decide el humano)

No puedes escribir en la spec. Propón en el chat:

1. **Datos**: tipos de entrada y salida (`tipos.ts`).
2. **Firma y propósito**: una línea que diga _qué_ calcula, no _cómo_.
3. **Ejemplos**: 4–8 pares entrada → salida, pequeños y revisables en segundos, con casos borde (vacío,
   duplicados, orden). **Propiedades**: invariantes "para toda entrada" y, si se puede, un **modelo ingenuo**
   obviamente correcto. **Generadores** para `sonda.ts`.

Termina con las decisiones que no tienes claras, como preguntas cerradas. El humano crea el módulo con
`pnpm jaula nuevo <modulo>`, escribe la spec, aprueba **los ejemplos** (no el código) y sella.

## 4. Implementa

Implementa `<nucleo>/<modulo>.ts` hasta poner en verde `pnpm jaula arbitro <modulo>`, respetando
`arquitectura.spec.ts`. Si la spec no decide un caso que tienes que decidir, pregunta antes de elegir. Después
sugiere endurecerla: `pnpm jaula abogado <modulo>`, `pnpm jaula candidatos <modulo> 3` + `pnpm jaula sonda <modulo>`
y `pnpm mutacion`.

## 5. Ejecuta

Usa la herramienta forjada para responder a la petición original con un script de un solo uso que la importe
(Node ejecuta TypeScript directamente). Muestra el resultado y di qué herramienta lo produjo.
