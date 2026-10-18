import type { Decider } from "#jaula/arnes";
import type { Comando, Evento } from "__relspec__/__modulo__/tipos.ts";

// Stub (HtDF · 2): la implementación es del agente.
export const __nombre__: Decider<Comando, Evento> = {
  inicial: undefined,
  decide: () => {
    throw new Error("TODO");
  },
  evolve: (estado) => estado,
};
