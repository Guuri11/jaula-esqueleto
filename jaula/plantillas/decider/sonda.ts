// Generadores compartidos por la spec y por `pnpm jaula sonda __modulo__`.
import fc from "fast-check";
import { aplicar, type Decider } from "#jaula/arnes";
import type { Comando, Evento } from "./tipos.ts";

export const comando: fc.Arbitrary<Comando> = fc.constant({ tipo: "TODO" as const });

export const sonda = {
  exportacion: "__nombre__",
  entrada: fc.array(comando, { maxLength: 10 }),
  ejecutar: (impl: unknown, comandos: Comando[]) => aplicar(impl as Decider<Comando, Evento>, comandos).traza,
};
