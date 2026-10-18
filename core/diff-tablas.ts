import type { Diff, Fila } from "../spec/diff-tablas/tipos.ts";

/** Filas de `xs` cuyo id no aparece en `ys`, conservando orden y duplicados. */
function fuera(xs: Fila[], ys: Fila[]): Fila[] {
  const ids = new Set(ys.map((y) => y.id));
  return xs.filter((x) => !ids.has(x.id));
}

export function diffTablas(a: Fila[], b: Fila[]): Diff {
  return { soloEnA: fuera(a, b), soloEnB: fuera(b, a) };
}
