// HtDF · 2. Firma y propósito
//   export function diffTablas(a: Fila[], b: Fila[]): Diff
//   Filas cuyo id aparece en una tabla y no en la otra, en el orden en que vienen.
import fc from "fast-check";
import { expect, test } from "vite-plus/test";
import { diffTablas } from "#nucleo/diff-tablas.ts";
import { ingenuo, tabla } from "./sonda.ts";
import type { Diff, Fila } from "./tipos.ts";

// HtDF · 3. Ejemplos (check-expect)
test.each<[Fila[], Fila[], Diff]>([
  [[{ id: 1 }], [{ id: 1 }], { soloEnA: [], soloEnB: [] }],
  [[{ id: 1 }, { id: 2 }], [{ id: 2 }], { soloEnA: [{ id: 1 }], soloEnB: [] }],
  [[], [{ id: 3 }], { soloEnA: [], soloEnB: [{ id: 3 }] }],
  [[{ id: 1, nombre: "a" }], [{ id: 1, nombre: "b" }], { soloEnA: [], soloEnB: [] }],
])("ejemplo %#", (a, b, esperado) => {
  expect(diffTablas(a, b)).toEqual(esperado);
});

// Propiedad contra el modelo ingenuo: fija también orden y duplicados.
test("coincide con el modelo ingenuo", () => {
  fc.assert(
    fc.property(tabla, tabla, (a, b) => {
      expect(diffTablas(a, b)).toEqual(ingenuo(a, b));
    }),
  );
});
