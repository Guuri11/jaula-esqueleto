# ADR-0005: Jaula sellada con defensa en profundidad

- **Estado:** Aceptada
- **Fecha:** 2026-10-18

## Contexto

Si el agente puede editar la spec, la spec no vale nada. ImpossibleBench ([B6]) muestra que, ante tareas imposibles,
los agentes borran o reescriben tests. También muestra que con tests de solo lectura dejan de hacerlo **sin perder
rendimiento legítimo**, y que con tests ocultos las trampas bajan casi a cero; pero ninguna de las dos frena el
special-casing.

No basta con proteger `spec/`: quien controle el arnés, la configuración de Vite o del agente, `package.json` o el
lockfile puede cambiar lo que significa la spec sin tocarla.

## Decisión

**La jaula es todo lo listado en `protegidos` de `jaula.config.json`**: `spec/`, `jaula/` (maquinaria), `.pi/`,
`.claude/`, `.github/`, el hook de pre-commit, `AGENTS.md`/`CLAUDE.md`, `vite.config.ts`, `tsconfig.json`,
`package.json`, lockfile, `pnpm-workspace.yaml`, `stryker.config.json`, la propia config y `jaula.lock`.

Se protege en capas, de la más cómoda a la más fuerte:

1. **Candado en el agente** (`jaula/lib/guardia.ts`). Bloquea escrituras en la jaula por las herramientas de edición
   y, heurísticamente, por bash (redirecciones, `sed -i`, `rm`… sobre rutas protegidas, ignorando cuerpos de heredoc).
   También bloquea `--no-verify`, `jaula sellar|configurar|nuevo` y añadir dependencias. En Claude Code se suma
   `permissions.deny` ([B48]).
2. **Sello** (`jaula.lock`): sha256 de cada fichero protegido. Solo el humano sella (`pnpm jaula sellar`).
3. **Pre-commit**: `jaula verificar` falla si la jaula no coincide con el sello.
4. **CI**: instala desde cero (así que tocar `node_modules` no sobrevive) y ejecuta el árbitro completo: integridad,
   tipos y lint, toda la spec y mutación.
5. **Holdout**: tests que viven fuera del repo y que el agente no puede leer (`JAULA_HOLDOUT`); en CI se clonan de un
   repo privado. Es la defensa contra el special-casing que el solo-lectura no frena.

Opcional y recomendado en equipos: CODEOWNERS sobre la jaula.

## Alternativas descartadas

- **Confiar en las reglas de `AGENTS.md`.** Son sugerencias. En la PoC pi respetó el candado, pero la garantía no
  puede depender de eso.
- **Solo el candado del agente.** El bloqueo de bash es heurístico: frena los intentos normales, no a un agente
  decidido, ni a un subproceso que abra el fichero.
- **Solo CI.** Correcto pero tardío: el agente perdería tiempo en un camino que acabará en rojo.

## Consecuencias

- Cambiar algo protegido (incluido instalar una dependencia) es un acto humano explícito: editar, `pnpm jaula sellar`
  y commit.
- El candado de bash dará falsos positivos y falsos negativos; la verdad la tiene el sello.
- `jaula/` vive en el repo y se sella como el resto ([ADR-0012]).

## Referencias

[B6], [B48]

[B6]: ../bibliografia.md#b6
[B48]: ../bibliografia.md#b48
[ADR-0012]: 0012-maquinaria-separada-del-contenido.md
