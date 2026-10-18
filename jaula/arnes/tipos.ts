// Tipos del arnés. Los importa también el núcleo (solo como tipos).

/** Patrón Decider (Chassaing). El tipo del estado es del núcleo: la spec nunca lo nombra. */
export type Decider<C, E, S = unknown> = {
  inicial: S;
  decide: (comando: C, estado: S) => E[];
  evolve: (estado: S, evento: E) => S;
};

/** Un rechazo de negocio: `decide` lanza `new Error(codigo)`. */
export type Rechazo = { error: string };
