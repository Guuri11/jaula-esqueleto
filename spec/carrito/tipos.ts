// HtDF · 1. Datos. Comandos y eventos son el lenguaje de la spec; el estado lo decide el núcleo.

export type Sku = string;

export type Comando = { tipo: "Añadir"; sku: Sku; cantidad: number } | { tipo: "Quitar"; sku: Sku } | { tipo: "Pagar" };

export type Evento =
  | { tipo: "ProductoAñadido"; sku: Sku; cantidad: number }
  | { tipo: "ProductoQuitado"; sku: Sku }
  | { tipo: "PedidoPagado"; lineas: Record<Sku, number> };

/** Códigos de rechazo (el mensaje del Error que lanza `decide`). */
export type CodigoRechazo = "cantidad-invalida" | "no-esta-en-carrito" | "carrito-vacio" | "carrito-cerrado";
