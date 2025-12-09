"use client";

export default function PosVentaModal({
  show,
  carrito,
  total,
  numeroBoleta,
  metodoPago,
  setMetodoPago,
  onClose,
  onConfirm,
  metodosPago = [],
}) {
  if (!show) return null;

  const fecha = new Date();

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-6 space-y-6">
          {/* Encabezado */}
          <div className="text-center space-y-1">
            <h2 className="text-2xl font-bold text-sidebar-primary">
              BrewMaster
            </h2>
            <p className="text-xs text-foreground/70">Recibo de Venta</p>
          </div>

          {/* Recibo N° */}
          <div className="border-t border-b border-border py-4 text-center space-y-1">
            <p className="text-xs text-foreground/70">Recibo Nº</p>
            <p className="text-lg font-bold text-foreground">
              {numeroBoleta ?? "—"}
            </p>
          </div>

          {/* Fecha */}
          <div className="text-center text-xs text-foreground/60 space-y-1">
            <p>{fecha.toLocaleDateString()}</p>
            <p>{fecha.toLocaleTimeString()}</p>
          </div>

          {/* Detalle de items */}
          <div className="border-t border-b border-border py-4 space-y-3">
            {carrito.length === 0 ? (
              <p className="text-center text-foreground/60 text-sm">
                No hay items en el carrito.
              </p>
            ) : (
              carrito.map((item) => {
                const cantidad =
                  item.cantidadShops != null ? item.cantidadShops : 1;
                const precio = item.precioShop || 0;
                const subtotalItem = precio * cantidad;
                const litrosPorShop =
                  item.shotSize === "1000" ? 1 : item.shotSize === "500" ? 0.5 : 0;

                return (
                  <div
                    key={`${item.id}-${item.shotSize}`}
                    className="flex justify-between items-start text-sm"
                  >
                    <div className="space-y-[2px]">
                      <p className="font-medium text-foreground">
                        {item.tipo_cerveza || "Barril"} ·{" "}
                        {item.codigo_interno}
                      </p>
                      <p className="text-xs text-foreground/70">
                        {cantidad} x{" "}
                        {item.shotSize === "1000" ? "1 L" : "500 ml"} (
                        {(cantidad * litrosPorShop).toFixed(2)} L)
                      </p>
                    </div>
                    <div className="text-right space-y-[2px]">
                      <p className="text-xs text-foreground/60">
                        ${precio.toLocaleString()} c/u
                      </p>
                      <p className="text-foreground font-semibold">
                        ${subtotalItem.toLocaleString()}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Total */}
          <div className="text-center border-b border-border pb-4 space-y-1">
            <p className="text-xs text-foreground/70">TOTAL</p>
            <p className="text-3xl font-bold text-sidebar-primary">
              ${total.toLocaleString()}
            </p>
          </div>

          {/* Método de pago */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground text-left">
              Método de Pago
            </p>
            <div className="grid grid-cols-2 gap-2">
              {metodosPago.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMetodoPago(m.id)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                    metodoPago === m.id
                      ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary"
                      : "bg-secondary text-foreground border-border hover:border-sidebar-primary/70"
                  }`}
                >
                  <span>{m.icono}</span>
                  <span>{m.nombre}</span>
                </button>
              ))}
            </div>
            <div className="text-center text-xs text-foreground/70">
              Pago por:{" "}
              <span className="font-semibold">
                {
                  metodosPago.find((m) => m.id === metodoPago)?.nombre ??
                  "—"
                }
              </span>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-secondary border border-border text-foreground rounded-lg hover:bg-secondary/80 text-sm font-medium"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
