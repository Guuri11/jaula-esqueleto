// Generadores compartidos por la spec y por `pnpm jaula sonda __modulo__`.
import fc from "fast-check";
import type { Entrada, Salida } from "./tipos.ts";

export const entrada: fc.Arbitrary<Entrada> = fc.anything(); // TODO: generador realista

/** Modelo de referencia: lento y obviamente correcto. */
export function ingenuo(_e: Entrada): Salida {
  throw new Error("TODO");
}

export const sonda = {
  exportacion: "__nombre__",
  entrada,
  ejecutar: (impl: unknown, e: Entrada) => (impl as (e: Entrada) => Salida)(e),
};
