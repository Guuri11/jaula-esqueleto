import type { Decider } from "#jaula/arnes";
import type { CodigoRechazo, Comando, Evento } from "../spec/carrito/tipos.ts";

type Estado = { lineas: Readonly<Record<string, number>>; cerrado: boolean };

const rechazar = (codigo: CodigoRechazo): never => {
  throw new Error(codigo);
};

const decider: Decider<Comando, Evento, Estado> = {
  inicial: { lineas: {}, cerrado: false },
  decide: (comando, estado) => {
    // La validez del comando se comprueba antes que el estado del carrito.
    // Cantidad válida: entero ≥ 1.
    if (comando.tipo === "Añadir" && !(Number.isInteger(comando.cantidad) && comando.cantidad >= 1)) {
      return rechazar("cantidad-invalida");
    }
    if (estado.cerrado) return rechazar("carrito-cerrado");
    switch (comando.tipo) {
      case "Añadir":
        return [{ tipo: "ProductoAñadido", sku: comando.sku, cantidad: comando.cantidad }];
      case "Quitar":
        if (!Object.hasOwn(estado.lineas, comando.sku)) return rechazar("no-esta-en-carrito");
        return [{ tipo: "ProductoQuitado", sku: comando.sku }];
      case "Pagar":
        if (Object.keys(estado.lineas).length === 0) return rechazar("carrito-vacio");
        return [{ tipo: "PedidoPagado", lineas: { ...estado.lineas } }];
    }
  },
  evolve: (estado, evento) => {
    switch (evento.tipo) {
      case "ProductoAñadido":
        return {
          ...estado,
          lineas: { ...estado.lineas, [evento.sku]: (estado.lineas[evento.sku] ?? 0) + evento.cantidad },
        };
      case "ProductoQuitado": {
        const { [evento.sku]: _, ...resto } = estado.lineas;
        return { ...estado, lineas: resto };
      }
      case "PedidoPagado":
        return { ...estado, cerrado: true };
    }
  },
};

/** El estado es interno del núcleo: se expone opaco, el arnés solo lo hace circular. */
export const carrito = decider as unknown as Decider<Comando, Evento>;
