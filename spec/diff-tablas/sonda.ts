import fc from "fast-check";
import type { Diff, Fila } from "./tipos.ts";

export const tabla: fc.Arbitrary<Fila[]> = fc.array(fc.record({ id: fc.nat(20), v: fc.string({ maxLength: 3 }) }));

/** Modelo de referencia: O(n·m) y obviamente correcto. */
export function ingenuo(a: Fila[], b: Fila[]): Diff {
  const fuera = (xs: Fila[], ys: Fila[]) => xs.filter((x) => !ys.some((y) => y.id === x.id));
  return { soloEnA: fuera(a, b), soloEnB: fuera(b, a) };
}

export const sonda = {
  exportacion: "diffTablas",
  entrada: fc.tuple(tabla, tabla),
  ejecutar: (impl: unknown, [a, b]: [Fila[], Fila[]]) => (impl as (a: Fila[], b: Fila[]) => Diff)(a, b),
};
