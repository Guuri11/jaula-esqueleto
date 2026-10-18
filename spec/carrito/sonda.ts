// Generadores compartidos por la spec y por la sonda de ambigüedad (scripts/sonda.ts).
import fc from "fast-check";
import { aplicar, type Decider } from "#jaula/arnes";
import type { Comando, Evento } from "./tipos.ts";

export const comando: fc.Arbitrary<Comando> = fc.oneof(
  fc.record({
    tipo: fc.constant("Añadir" as const),
    sku: fc.constantFrom("A", "B", "C"),
    cantidad: fc.oneof(fc.integer({ min: -1, max: 5 }), fc.double({ min: 0, max: 3, noNaN: true })),
  }),
  fc.record({ tipo: fc.constant("Quitar" as const), sku: fc.constantFrom("A", "B", "C") }),
  fc.constant({ tipo: "Pagar" as const }),
);

/** Qué genera la sonda y cómo llama a cada implementación candidata. */
export const sonda = {
  exportacion: "carrito",
  entrada: fc.array(comando, { maxLength: 10 }),
  ejecutar: (impl: unknown, comandos: Comando[]) => aplicar(impl as Decider<Comando, Evento>, comandos).traza,
};
