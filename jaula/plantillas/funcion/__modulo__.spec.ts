// HtDF · 2. Firma y propósito
//   export function __nombre__(entrada: Entrada): Salida
//   TODO: una línea que diga QUÉ calcula, no cómo.
import fc from "fast-check";
import { expect, test } from "vite-plus/test";
import { __nombre__ } from "#nucleo/__modulo__.ts";
import { entrada, ingenuo } from "./sonda.ts";
import type { Entrada, Salida } from "./tipos.ts";

// HtDF · 3. Ejemplos (check-expect): pequeños, con casos borde, revisables en segundos.
test.each<[Entrada, Salida]>([
  // [entrada, salidaEsperada],
])("ejemplo %#", (e, esperado) => {
  expect(__nombre__(e)).toEqual(esperado);
});

// Propiedad contra el modelo ingenuo (borra si no hay modelo y escribe invariantes).
test("coincide con el modelo ingenuo", () => {
  fc.assert(fc.property(entrada, (e) => expect(__nombre__(e)).toEqual(ingenuo(e))));
});
