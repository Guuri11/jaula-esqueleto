# Guía: proyectos nuevos con jaula

Cómo arrancar un proyecto de cualquier tipo (librería, CLI, backend, web, móvil, full stack) sobre este esqueleto. Si
no sabes por qué existe la jaula, lee antes [`README.md`](README.md).

La idea que guía todo: **cuanto más hacia fuera vas (de la lógica a la pantalla), menos se puede verificar
automáticamente y más tienes que mirar tú.** Así que mete en el núcleo todo lo que puedas y deja los bordes finos.

## 1. Antes de escribir nada: ¿qué es núcleo y qué es cáscara?

Para cada regla de tu producto, hazte una pregunta: **¿esta decisión necesita tocar el mundo (red, disco, reloj, azar,
pantalla)?**

- **No** → núcleo (`core/`), con spec completa. Precios, permisos, validaciones, cálculos, máquinas de estado,
  transformaciones de datos, el estado de una UI.
- **Sí** → cáscara (`src/`). Lo que el núcleo necesite del mundo le llega como dato (la hora, un id generado, lo leído
  de la base de datos) y lo que quiera hacer en el mundo lo devuelve como dato (eventos, comandos, una respuesta).

Y gradúa la jaula según el riesgo:

| Tipo de lógica                                         | Spec recomendada                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------------- |
| CRUD fino, pegamento                                   | escenarios en la frontera (petición→respuesta, args→salida), sin más |
| Reglas de negocio normales                             | ejemplos + una propiedad                                             |
| Lógica densa o cara de romper (dinero, permisos, sync) | ejemplos + propiedades + modelo ingenuo + sonda + mutación + holdout |

## 2. Arranque común (todos los tipos)

```bash
git clone git@github.com:Guuri11/jaula-esqueleto.git mi-app && cd mi-app
rm -rf .git && git init
pnpm install
```

1. **`jaula.config.json`**: carpetas (`spec`, `nucleo`), agente headless (`"pi"` o `"claude"`) y la lista de
   `protegidos`. Añade aquí la configuración de las herramientas que instales (por ejemplo `playwright.config.ts`).
2. **Si vas a tener cáscara**, añade `"src"` al `include` de `tsconfig.json`.
3. **Instala tú las dependencias del framework** (`pnpm add hono`, `pnpm add commander`…). El agente no puede: añadir
   dependencias es decisión humana y `package.json` está sellado.
4. `pnpm jaula configurar` para regenerar imports, `.pi/`, `.claude/` y `CLAUDE.md`.
5. Rellena **"Contexto del proyecto"** en `AGENTS.md`: qué es el producto, el dominio, qué framework usa la cáscara y
   qué está fuera del alcance del agente.
6. Borra los ejemplos cuando ya no los necesites: `rm -rf spec/carrito spec/diff-tablas core/carrito.ts core/diff-tablas.ts`.
7. `pnpm jaula sellar && git add -A && git commit -m "Esqueleto con jaula"`.

Estructura resultante:

```
spec/            JAULA · tuya · sellada
  <modulo>/      spec del núcleo (lo genera `pnpm jaula nuevo`)
  <frontera>/    spec de la cáscara: http/, cli/, flujos/… (la creas tú)
  arquitectura.spec.ts
core/            NÚCLEO · agente · puro
src/             CÁSCARA · agente · framework, IO, adaptadores
```

`src/` no está protegido: es del agente, igual que `core/`. Lo que lo controla es la spec de la frontera que escribes
en `spec/`. La regla de arquitectura solo se aplica a `core/`, así que la cáscara puede hacer IO.

## 3. El ciclo de una feature

Igual para todos los tipos de proyecto:

1. **Diseña con el agente**: `/htdf <qué debe hacer>`. Te propone datos, firma, propósito, ejemplos y propiedades en
   el chat. Tú decides.
2. **Crea el módulo**: `pnpm jaula nuevo <modulo>` (función) o `pnpm jaula nuevo <modulo> --decider` (con estado).
   Rellena `tipos.ts`, la cabecera (firma y propósito), los ejemplos y `sonda.ts` (generadores y modelo ingenuo).
3. **Escribe la spec de la frontera** si la feature se ve desde fuera (un endpoint, un subcomando, un flujo).
4. **Sella**: `pnpm jaula sellar`.
5. **Implementa**: `/implementa <modulo>`. El agente escribe `core/` y, si hace falta, `src/`. El árbitro no le deja
   terminar en rojo.
6. **Responde sus preguntas convirtiéndolas en spec.** Cada "¿A o B?" es un ejemplo nuevo; sella otra vez.
7. **Endurece si la lógica lo merece**: `/endurece <modulo>` (abogado, candidatos, sonda) y `pnpm mutacion`.
8. **Revisa tú lo que no se puede verificar** (UI, textos) y haz commit. El pre-commit comprueba el sello.

De fuera hacia dentro al especificar (el escenario visible primero, luego las reglas), de dentro hacia fuera al
implementar (núcleo, luego cáscara).

## 4. Por tipo de proyecto

### Librería o herramienta de datos

El caso más directo: todo es núcleo.

- Un módulo por función pública: `pnpm jaula nuevo parsear-csv`.
- Ejemplos con los casos borde, y una propiedad contra un modelo ingenuo (la versión lenta y obvia). Mira
  `spec/diff-tablas/` antes de borrarlo.
- Si la herramienta nace de una petición puntual ("¿qué filas hay en A y no en B?"), usa la skill `forja`.

### CLI

Una CLI es fácil de especificar: argumentos y entrada → salida y código de salida.

- El cálculo va en `core/`.
- En `src/cli.ts`, una función `ejecutar(args, entorno)` que traduce argumentos al núcleo y el resultado a texto. Recibe
  el mundo como parámetros (leer fichero, variables) para poder probarla sin disco.
- Un `src/bin.ts` minúsculo que llama a `ejecutar` con `process.argv`, `fs` y `process.exit`. Es lo único sin spec.
- La spec en `spec/cli/`:

```ts
// spec/cli/cli.spec.ts
import { expect, test } from "vite-plus/test";
import { ejecutar } from "../../src/cli.ts";

const ficheros: Record<string, string> = { "a.json": '[{"id":1},{"id":2}]', "b.json": '[{"id":2},{"id":3}]' };
const leer = (ruta: string) => ficheros[ruta];

test.each([
  [["a.json", "b.json"], { codigo: 0, salida: "- 1\n+ 3" }],
  [["a.json"], { codigo: 2, salida: "uso: diff <a.json> <b.json>" }],
])("diff %j", (args, esperado) => expect(ejecutar(args, leer)).toEqual(esperado));
```

Este patrón está probado sobre el esqueleto: `vp check` y `pnpm arbitro` en verde, y el candado deja al agente
escribir `src/cli.ts` pero no `spec/cli/`. Para salidas largas, usa snapshots (`toMatchSnapshot`) y apruébalos tú: los
ficheros de snapshot quedan dentro de `spec/` y, por tanto, sellados.

### Backend / API

Capas, de dentro hacia fuera:

| Capa         | Qué es                                             | Spec                                                                   |
| ------------ | -------------------------------------------------- | ---------------------------------------------------------------------- |
| Dominio      | Deciders y reglas puras (`core/`)                  | escenarios dado/cuando/entonces, propiedades                           |
| Puertos      | interfaces: `RepositorioPedidos`, `Pagos`, `Reloj` | **contract tests**: una suite que debe pasar cualquier implementación  |
| Adaptadores  | Postgres, Stripe… (`src/adaptadores/`)             | la misma suite de contrato, contra el real y contra un fake en memoria |
| Casos de uso | cargar → `decide` → guardar → efectos              | escenarios con fakes                                                   |
| Entrega      | rutas HTTP con el framework (Hono, Fastify, Nest…) | petición → respuesta (status, cuerpo), y OpenAPI como firma            |

- **Contract tests**: escribe en `spec/puertos/` una función `contratoRepositorio(crear: () => Repositorio)` con los
  tests, y aplícala dos veces: al fake en memoria y al adaptador real. El fake es a la vez doble de test y modelo de
  referencia (el truco de ShardStore). Los tests contra el real (base de datos en contenedor) son lentos: ponlos en
  ficheros aparte y ejecútalos en un paso de CI propio.
- **Entrega**: construye la app con sus puertos inyectados (`crearApp({ repositorio, reloj })`) para probarla sin
  servidor ni base de datos. Esbozo con Hono, que permite `app.request(...)` sin levantar servidor:

```ts
// spec/http/pedidos.spec.ts
import { expect, test } from "vite-plus/test";
import { crearApp } from "../../src/app.ts";
import { repositorioEnMemoria, relojFijo } from "../puertos/fakes.ts";

test("pagar un carrito vacío es un 409", async () => {
  const app = crearApp({ repositorio: repositorioEnMemoria(), reloj: relojFijo("2026-10-18T10:00:00Z") });
  const res = await app.request("/carritos/c1/pagar", { method: "POST" });
  expect(res.status).toBe(409);
  expect(await res.json()).toEqual({ error: "carrito-vacio" });
});
```

Fíjate en que los fakes viven en `spec/`: son parte de la jaula y los escribes tú (o los apruebas tú). Si el agente
escribiera los fakes, podría hacer que la spec dijera lo que quisiera.

- Un CRUD fino puede quedarse solo en escenarios HTTP, sin núcleo. Lleva al núcleo lo que tenga reglas.

### Web (frontend)

Se divide en dos:

- **El estado de la UI** (stores, reducers, formularios, máquinas de estado) es otro núcleo puro. Un formulario de
  pago es un Decider: comandos (`EscribirTarjeta`, `Enviar`) → eventos (`ErrorMostrado`, `PagoSolicitado`).
  Especifícalo igual que el carrito: `pnpm jaula nuevo formulario-pago --decider`.
- **La vista** (`src/`, con React, Vue, Svelte…) es cáscara: componentes que pintan el estado y despachan comandos.
  Se cubre con:
  - Recorridos de Playwright por **rol y texto** ("pulsa _Pagar_, ves _Pedido confirmado_"), nunca por selectores
    CSS, que congelan la implementación.
  - Chequeos de accesibilidad (axe), que son deterministas.
  - Snapshots visuales que apruebas tú.

Ponlos en `spec/flujos/` con un sufijo distinto de `.spec.ts` (por ejemplo `.e2e.ts`) para que Vitest no los recoja,
añade `playwright.config.ts` a `protegidos` y ejecútalos en un paso propio de CI. **Hoy el árbitro dentro del bucle
del agente no ejecuta los recorridos**: los verá CI, o tú con `pnpm exec playwright test`.

Lo que no se verifica (si se ve bien, si el flujo es cómodo, el copy) es revisión tuya. Es el límite de la
verificabilidad, no un fallo de la jaula.

### Móvil

Igual que la web:

- Con React Native o Expo, el núcleo en TypeScript se comparte tal cual (mismo `core/`, misma spec).
- Los recorridos se escriben con Maestro (YAML por texto visible) en `spec/flujos/` y se ejecutan en CI con emulador.
- Con nativo (Swift, Kotlin), la jaula de TypeScript no aplica directamente; la idea sí: núcleo puro, spec ejecutable
  sellada, árbitro en CI.

### Full stack (monorepo)

- Hoy, **una jaula por paquete**: cada paquete con su `jaula.config.json`, su `spec/` y su `core/`.
- El dominio compartido va en su propio paquete (`packages/dominio`) con la jaula más estricta; las apps (`apps/api`,
  `apps/web`, `apps/cli`) importan el dominio y especifican su frontera.
- Un árbitro que sepa "fichero tocado → paquete → su spec y la de los paquetes que dependen de él" es trabajo futuro
  ([ADR-0012](adr/0012-maquinaria-separada-del-contenido.md)).

## 5. Holdout y CI

- **Holdout**: tests que el agente nunca ve, en otro repo (por ejemplo `mi-app-holdout/`). Escribe ahí casos que
  deberían cumplirse si la implementación respeta el propósito: los que se le ocurrirían a un tester malicioso. Úsalo
  en local con `JAULA_HOLDOUT=../mi-app-holdout pnpm arbitro`.
- **CI** (`.github/workflows/arbitro.yml`): instala desde cero, ejecuta `pnpm jaula arbitro --completo` y
  `pnpm mutacion`. Para el holdout, configura la variable `HOLDOUT_REPO` y el secreto `HOLDOUT_REPO_TOKEN`.
- Añade a CI los pasos que no corre el árbitro: contract tests contra adaptadores reales, recorridos e2e.

## 6. Antipatrones

| Antipatrón                                                                   | Por qué es un problema                           | Qué hacer                                         |
| ---------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------- |
| Que el agente escriba la spec, los fakes o los snapshots y tú no los revises | el oráculo copia la implementación               | el agente propone, tú escribes, apruebas y sellas |
| Tests con mocks ("se llamó a `guardar` con…")                                | especifican el cómo y congelan la implementación | fakes en memoria + contract tests                 |
| Lógica en controladores o componentes                                        | la spec tiene que pasar por HTTP o el DOM        | sácala a `core/`                                  |
| Solo ejemplos en lógica densa                                                | el agente puede hardcodearlos                    | añade una propiedad o un modelo ingenuo           |
| Decisiones que solo viven en `core/` o en el chat                            | se pierden al regenerar                          | conviértelas en ejemplos de la spec               |
| La artillería completa en un CRUD                                            | la ceremonia mata la idea                        | gradúa la jaula según el riesgo                   |
| Recorridos e2e con selectores CSS                                            | congelan la vista                                | roles y texto                                     |
| Sellar sin leer lo que cambió                                                | el sello certifica lo que haya                   | `pnpm jaula verificar` muestra qué cambió         |

## 7. Checklist del primer día

- [ ] `jaula.config.json` ajustado y `pnpm jaula configurar` ejecutado
- [ ] `src` en `tsconfig.json` si hay cáscara; dependencias del framework instaladas por ti
- [ ] "Contexto del proyecto" en `AGENTS.md`
- [ ] Ejemplos borrados, primer módulo creado con `pnpm jaula nuevo`
- [ ] Primera spec de frontera (`spec/http/`, `spec/cli/`…) si aplica
- [ ] Sellado y primer commit (el pre-commit pasa)
- [ ] CI en verde; holdout configurado si la lógica lo merece
