// HtDF · 2. Firma y propósito
//   export const __nombre__: Decider<Comando, Evento>
//   TODO: una línea con el propósito del agregado.
import { escenarios } from "#jaula/arnes";
import { __nombre__ } from "#nucleo/__modulo__.ts";
import type { CodigoRechazo, Comando, Evento } from "./tipos.ts";

// HtDF · 3. Ejemplos como datos: dado (eventos) · cuando (comando) · entonces (eventos o rechazo).
escenarios<Comando, Evento, unknown, CodigoRechazo>("__modulo__", __nombre__, [
  // { nombre: "…", dado: [], cuando: { tipo: "…" }, entonces: [{ tipo: "…" }] },
]);
