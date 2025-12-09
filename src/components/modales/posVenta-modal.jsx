"use client"

const metodosPago = [
  { id: "boleta", nombre: "Boleta", icono: "🧾" },
  { id: "factura", nombre: "Factura", icono: "📄" },
  { id: "transferencia", nombre: "Transferencia", icono: "💸" },
  { id: "debito", nombre: "Débito", icono: "💳" },
  { id: "efectivo", nombre: "Efectivo", icono: "💵" },
  { id: "credito", nombre: "Crédito", icono: "💰" },
]

export default function PosVentaModal({
  show,
  carrito,
  total,
  metodoPago,
  setMetodoPago,
  onClose,
  onConfirm,
}) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Encabezado */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-sidebar-primary">BrewMaster</h2>
            <p className="text-sm text-foreground/70">Recibo de Venta</p>
          </div>

          {/* Número de boleta */}
          <div className="border-t border-b border-border py-4 text-center">
            <p className="text-xs text-foreground/70">Recibo Nº</p>
            <p className="text-lg font-bold text-foreground">
              {Math.floor(Math.random() * 10000)}
            </p>
          </div>

          {/* Fecha */}
          <div className="text-xs text-foreground/70 text-center">
            <p>{new Date().toLocaleDateString()}</p>
            <p>{new Date().toLocaleTimeString()}</p>
          </div>

          {/* Detalle de items */}
          <div className="space-y-2 text-left border-t border-b border-border py-4">
            {carrito.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <div>
                  <p className="text-foreground">{item.nombre}</p>
                  <p className="text-xs text-foreground/70">x{item.cantidad}</p>
                </div>
                <p className="text-foreground font-medium">
                  ${(item.precio * item.cantidad).toLocaleString()}
                </p>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="text-center border-b border-border pb-4">
            <p className="text-xs text-foreground/70 mb-1">TOTAL</p>
            <p className="text-3xl font-bold text-sidebar-primary">
              ${total.toLocaleString()}
            </p>
          </div>

          {/* Métodos de pago */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Método de Pago
            </label>
            <div className="grid grid-cols-2 gap-2">
              {metodosPago.map((metodo) => (
                <button
                  key={metodo.id}
                  onClick={() => setMetodoPago(metodo.id)}
                  className={`p-3 rounded-lg border transition-all text-center ${
                    metodoPago === metodo.id
                      ? "bg-sidebar-primary border-sidebar-primary text-sidebar-primary-foreground"
                      : "bg-secondary border-border text-foreground hover:border-sidebar-primary"
                  }`}
                >
                  <div className="text-xl mb-1">{metodo.icono}</div>
                  <p className="text-xs font-medium">{metodo.nombre}</p>
                </button>
              ))}
            </div>
            <div className="text-center pt-2 px-3 py-2 bg-secondary rounded-lg border border-border">
              <p className="text-sm text-foreground/70">Pago por:</p>
              <p className="text-foreground font-semibold">
                {metodosPago.find((m) => m.id === metodoPago)?.nombre}
              </p>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-secondary border border-border rounded-lg text-foreground hover:bg-secondary/80 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
