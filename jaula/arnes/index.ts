// Arnés de la jaula: pequeño, genérico y humano. Si este fichero miente, toda la spec miente,
// así que nunca lo escribe el agente (está bloqueado y sellado como el resto de la jaula).
import { describe, expect, test } from "vite-plus/test";

import type { Decider, Rechazo } from "./tipos.ts";

export type { Decider, Rechazo };

/** `R` acota los códigos de rechazo válidos: una errata en la spec es un error de tipos. */
export type Escenario<C, E, R extends string = string> = {
  nombre: string;
  dado: E[];
  cuando: C;
  entonces: E[] | { error: R };
};

export function estadoTras<C, E, S>(decider: Decider<C, E, S>, eventos: E[]): S {
  return eventos.reduce(decider.evolve, decider.inicial);
}

/** Ejecuta un comando y devuelve sus eventos o el rechazo, como dato comparable. */
export function decidir<C, E, S>(decider: Decider<C, E, S>, comando: C, estado: S): E[] | Rechazo {
  try {
    return decider.decide(comando, estado);
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

/** Aplica una secuencia de comandos; los rechazados no cambian el estado. */
export function aplicar<C, E, S>(decider: Decider<C, E, S>, comandos: C[]) {
  let estado = decider.inicial;
  const historia: E[] = [];
  const traza: Array<E[] | Rechazo> = [];
  for (const comando of comandos) {
    const resultado = decidir(decider, comando, estado);
    traza.push(resultado);
    if (Array.isArray(resultado)) {
      historia.push(...resultado);
      estado = resultado.reduce(decider.evolve, estado);
    }
  }
  return { historia, traza };
}

/** Escenarios como datos: dado (eventos) · cuando (comando) · entonces (eventos o rechazo). */
export function escenarios<C, E, S, R extends string = string>(
  titulo: string,
  decider: Decider<C, E, S>,
  lista: Escenario<C, E, R>[],
) {
  describe(titulo, () => {
    if (lista.length === 0) test.todo("sin escenarios todavía (HtDF · 3)");
    for (const e of lista) {
      test(e.nombre, () => {
        expect(decidir(decider, e.cuando, estadoTras(decider, e.dado))).toEqual(e.entonces);
      });
    }
  });
}
