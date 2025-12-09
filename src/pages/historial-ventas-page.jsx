"use client"

import { useState } from "react"

const mockVentas = [
  {
    id: 1,
    fecha: "2024-01-15",
    hora: "10:30",
    cliente: "Juan Pérez",
    items: [
      { nombre: "Pilsner Premium", cantidad: 2, precio: 45000 },
      { nombre: "IPA Fuerte", cantidad: 1, precio: 50000 },
    ],
    total: 140000,
    metodoPago: "Efectivo",
    numero: "BOL001",
  },
  {
    id: 2,
    fecha: "2024-01-15",
    hora: "11:45",
    cliente: "María García",
    items: [{ nombre: "Stout Oscura", cantidad: 3, precio: 52000 }],
    total: 156000,
    metodoPago: "Transferencia",
    numero: "BOL002",
  },
  {
    id: 3,
    fecha: "2024-01-15",
    hora: "14:20",
    cliente: "Carlos López",
    items: [
      { nombre: "Lager Classic", cantidad: 4, precio: 42000 },
      { nombre: "Porter Robusto", cantidad: 2, precio: 48000 },
    ],
    total: 264000,
    metodoPago: "Débito",
    numero: "BOL003",
  },
  {
    id: 4,
    fecha: "2024-01-14",
    hora: "16:00",
    cliente: "Ana Martínez",
    items: [{ nombre: "Pilsner Premium", cantidad: 5, precio: 45000 }],
    total: 225000,
    metodoPago: "Crédito",
    numero: "BOL004",
  },
]

export default function HistorialVentasPage() {
  const [ventas, setVentas] = useState(mockVentas)
  const [filtroFecha, setFiltroFecha] = useState("")
  const [filtroCliente, setFiltroCliente] = useState("")
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)

  const ventasFiltradas = ventas.filter((venta) => {
    const cumpleFecha = !filtroFecha || venta.fecha === filtroFecha
    const cumpleCliente = !filtroCliente || venta.cliente.toLowerCase().includes(filtroCliente.toLowerCase())
    return cumpleFecha && cumpleCliente
  })

  const totalVentas = ventasFiltradas.reduce((sum, v) => sum + v.total, 0)
  const cantidadTransacciones = ventasFiltradas.length

  const iconoMetodoPago = (metodo) => {
    const iconos = {
      Efectivo: "💵",
      Transferencia: "💸",
      Débito: "💳",
      Crédito: "💰",
      Boleta: "🧾",
      Factura: "📄",
    }
    return iconos[metodo] || "💳"
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-accent flex items-center gap-3">📊 Historial de Ventas</h1>
        <p className="text-foreground/70 mt-2">Consulta el registro completo de todas tus transacciones</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-lg p-6 border border-border space-y-2">
          <p className="text-foreground/70 text-sm">Total Ventas</p>
          <p className="text-3xl font-bold text-sidebar-primary">${totalVentas.toLocaleString()}</p>
          <p className="text-xs text-foreground/60">En período filtrado</p>
        </div>

        <div className="bg-card rounded-lg p-6 border border-border space-y-2">
          <p className="text-foreground/70 text-sm">Transacciones</p>
          <p className="text-3xl font-bold text-sidebar-primary">{cantidadTransacciones}</p>
          <p className="text-xs text-foreground/60">Números de operaciones</p>
        </div>

        <div className="bg-card rounded-lg p-6 border border-border space-y-2">
          <p className="text-foreground/70 text-sm">Promedio por Venta</p>
          <p className="text-3xl font-bold text-sidebar-primary">
            ${cantidadTransacciones > 0 ? Math.round(totalVentas / cantidadTransacciones).toLocaleString() : 0}
          </p>
          <p className="text-xs text-foreground/60">Monto promedio</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-card rounded-lg p-6 border border-border space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Filtrar por Fecha</label>
            <input
              type="date"
              value={filtroFecha}
              onChange={(e) => setFiltroFecha(e.target.value)}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-sidebar-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Filtrar por Cliente</label>
            <input
              type="text"
              placeholder="Nombre del cliente..."
              value={filtroCliente}
              onChange={(e) => setFiltroCliente(e.target.value)}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-sidebar-primary"
            />
          </div>
        </div>
        {(filtroFecha || filtroCliente) && (
          <button
            onClick={() => {
              setFiltroFecha("")
              setFiltroCliente("")
            }}
            className="text-sm text-sidebar-primary hover:underline"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {/* Tabla de ventas */}
      <div className="bg-card rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-secondary border-b border-border">
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Número</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Fecha</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Cliente</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Items</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Método</th>
                <th className="px-6 py-4 text-right text-sm font-semibold text-foreground">Total</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-foreground/50">
                    No se encontraron ventas con los filtros aplicados
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map((venta) => (
                  <tr key={venta.id} className="border-b border-border hover:bg-secondary/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-sidebar-primary">{venta.numero}</td>
                    <td className="px-6 py-4 text-sm text-foreground">
                      {venta.fecha} <span className="text-foreground/60">{venta.hora}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-foreground">{venta.cliente}</td>
                    <td className="px-6 py-4 text-sm text-foreground">{venta.items.length} item(s)</td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{iconoMetodoPago(venta.metodoPago)}</span>
                        <span className="text-foreground">{venta.metodoPago}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-sidebar-primary text-right">
                      ${venta.total.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setVentaSeleccionada(venta)}
                        className="px-3 py-1 bg-sidebar-primary text-sidebar-primary-foreground rounded hover:opacity-90 transition-opacity text-xs font-medium"
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de detalles */}
      {ventaSeleccionada && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold text-sidebar-primary">Detalle de Venta</h2>
                  <p className="text-sm text-foreground/70">{ventaSeleccionada.numero}</p>
                </div>
                <button
                  onClick={() => setVentaSeleccionada(null)}
                  className="text-foreground/50 hover:text-foreground text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground/70">Fecha:</span>
                  <span className="text-foreground">{ventaSeleccionada.fecha}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Hora:</span>
                  <span className="text-foreground">{ventaSeleccionada.hora}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground/70">Cliente:</span>
                  <span className="text-foreground">{ventaSeleccionada.cliente}</span>
                </div>
              </div>

              <div className="border-t border-b border-border py-4 space-y-3">
                <h3 className="font-semibold text-foreground text-sm">Detalles de Items</h3>
                {ventaSeleccionada.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <div>
                      <p className="text-foreground">{item.nombre}</p>
                      <p className="text-xs text-foreground/70">x{item.cantidad}</p>
                    </div>
                    <p className="text-foreground font-medium">${(item.cantidad * item.precio).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-foreground/70">Método de Pago:</span>
                  <span className="flex items-center gap-2">
                    <span className="text-lg">{iconoMetodoPago(ventaSeleccionada.metodoPago)}</span>
                    <span className="text-foreground font-medium">{ventaSeleccionada.metodoPago}</span>
                  </span>
                </div>

                <div className="bg-secondary rounded-lg p-4 border border-border">
                  <p className="text-xs text-foreground/70 mb-1">TOTAL</p>
                  <p className="text-3xl font-bold text-sidebar-primary">${ventaSeleccionada.total.toLocaleString()}</p>
                </div>
              </div>

              <button
                onClick={() => setVentaSeleccionada(null)}
                className="w-full py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
