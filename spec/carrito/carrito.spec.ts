// HtDF · 2. Firma y propósito
//   export const carrito: Decider<Comando, Evento>
//   Un carrito acumula productos y se paga una sola vez; pagar emite las líneas sumadas por SKU.
import fc from "fast-check";
import { expect, test } from "vite-plus/test";
import { carrito } from "#nucleo/carrito.ts";
import { aplicar, escenarios } from "#jaula/arnes";
import { comando } from "./sonda.ts";
import type { CodigoRechazo, Comando, Evento } from "./tipos.ts";

const añadido = (sku: string, cantidad: number): Evento => ({
  tipo: "ProductoAñadido",
  sku,
  cantidad,
});
const quitado = (sku: string): Evento => ({ tipo: "ProductoQuitado", sku });
const pagado = (lineas: Record<string, number>): Evento => ({ tipo: "PedidoPagado", lineas });

// HtDF · 3. Ejemplos (check-expect) como datos
escenarios<Comando, Evento, unknown, CodigoRechazo>("carrito", carrito, [
  {
    nombre: "añadir a un carrito vacío",
    dado: [],
    cuando: { tipo: "Añadir", sku: "A", cantidad: 2 },
    entonces: [añadido("A", 2)],
  },
  {
    nombre: "la cantidad tiene que ser positiva",
    dado: [],
    cuando: { tipo: "Añadir", sku: "A", cantidad: 0 },
    entonces: { error: "cantidad-invalida" },
  },
  {
    nombre: "no se quita lo que no está",
    dado: [],
    cuando: { tipo: "Quitar", sku: "A" },
    entonces: { error: "no-esta-en-carrito" },
  },
  {
    nombre: "quitar elimina la línea entera",
    dado: [añadido("A", 2)],
    cuando: { tipo: "Quitar", sku: "A" },
    entonces: [quitado("A")],
  },
  {
    nombre: "no se paga un carrito vacío",
    dado: [],
    cuando: { tipo: "Pagar" },
    entonces: { error: "carrito-vacio" },
  },
  {
    nombre: "pagar suma las líneas del mismo SKU",
    dado: [añadido("A", 2), añadido("B", 1), añadido("A", 3)],
    cuando: { tipo: "Pagar" },
    entonces: [pagado({ A: 5, B: 1 })],
  },
  {
    nombre: "lo quitado no se paga",
    dado: [añadido("A", 2), quitado("A")],
    cuando: { tipo: "Pagar" },
    entonces: { error: "carrito-vacio" },
  },
  {
    nombre: "tras pagar no se añade",
    dado: [añadido("A", 1), pagado({ A: 1 })],
    cuando: { tipo: "Añadir", sku: "B", cantidad: 1 },
    entonces: { error: "carrito-cerrado" },
  },
  {
    nombre: "no se paga dos veces",
    dado: [añadido("A", 1), pagado({ A: 1 })],
    cuando: { tipo: "Pagar" },
    entonces: { error: "carrito-cerrado" },
  },
  {
    nombre: "la cantidad tiene que ser entera",
    dado: [],
    cuando: { tipo: "Añadir", sku: "A", cantidad: 0.5 },
    entonces: { error: "cantidad-invalida" },
  },
  {
    nombre: "la cantidad inválida gana a carrito cerrado",
    dado: [añadido("A", 1), pagado({ A: 1 })],
    cuando: { tipo: "Añadir", sku: "B", cantidad: 0 },
    entonces: { error: "cantidad-invalida" },
  },
]);

// Propiedad con modelo de referencia: lo pagado es exactamente lo añadido menos lo quitado.
function lineasIngenuas(historia: Evento[]): Record<string, number> {
  const lineas: Record<string, number> = {};
  for (const e of historia) {
    if (e.tipo === "ProductoAñadido") lineas[e.sku] = (lineas[e.sku] ?? 0) + e.cantidad;
    if (e.tipo === "ProductoQuitado") delete lineas[e.sku];
    if (e.tipo === "PedidoPagado") break;
  }
  return lineas;
}

test("lo pagado coincide con el modelo ingenuo", () => {
  fc.assert(
    fc.property(fc.array(comando, { maxLength: 12 }), (comandos) => {
      const { historia } = aplicar(carrito, comandos);
      const pagos = historia.filter((e) => e.tipo === "PedidoPagado");
      expect(pagos.length).toBeLessThanOrEqual(1);
      for (const pago of pagos) expect(pago.lineas).toEqual(lineasIngenuas(historia));
    }),
  );
});
