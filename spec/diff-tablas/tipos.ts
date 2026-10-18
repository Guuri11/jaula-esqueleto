// HtDF · 1. Datos

/** Una fila de una tabla. `id` la identifica; el resto de columnas no cuenta para el diff. */
export type Fila = { id: number; [columna: string]: unknown };

export type Diff = { soloEnA: Fila[]; soloEnB: Fila[] };
