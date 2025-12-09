"use client"

import { useState } from "react"
import PosVentaModal from "../components/modales/posVenta-modal"

const mockBarriles = [
  { id: 1, nombre: "Pilsner Premium", qr: "QR001", precio: 45000, stock: 10 },
  { id: 2, nombre: "IPA Fuerte", qr: "QR002", precio: 50000, stock: 8 },
  { id: 3, nombre: "Stout Oscura", qr: "QR003", precio: 52000, stock: 5 },
  { id: 4, nombre: "Lager Classic", qr: "QR004", precio: 42000, stock: 15 },
  { id: 5, nombre: "Porter Robusto", qr: "QR005", precio: 48000, stock: 7 },
]

export default function POSPage() {
  const [carrito, setCarrito] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [qrInput, setQrInput] = useState("")
  const [showBoleta, setShowBoleta] = useState(false)
  const [metodoPago, setMetodoPago] = useState("boleta")

  const handleAgregarAlCarrito = (barril) => {
    const existe = carrito.find((item) => item.id === barril.id)
    if (existe) {
      setCarrito(
        carrito.map((item) =>
          item.id === barril.id ? { ...item, cantidad: item.cantidad + 1 } : item,
        ),
      )
    } else {
      setCarrito([...carrito, { ...barril, cantidad: 1 }])
    }
    setSearchTerm("")
    setQrInput("")
  }

  const handleBuscarPorQR = () => {
    const barrilEncontrado = mockBarriles.find(
      (b) => b.qr.toLowerCase() === qrInput.toLowerCase(),
    )
    if (barrilEncontrado && barrilEncontrado.stock > 0) {
      handleAgregarAlCarrito(barrilEncontrado)
    } else {
      alert("Barril no encontrado o sin stock")
    }
  }

  const handleBuscarPorNombre = () => {
    const barrilEncontrado = mockBarriles.find((b) =>
      b.nombre.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    if (barrilEncontrado && barrilEncontrado.stock > 0) {
      handleAgregarAlCarrito(barrilEncontrado)
    } else {
      alert("Barril no encontrado o sin stock")
    }
  }

  const handleEliminarDelCarrito = (id) => {
    setCarrito(carrito.filter((item) => item.id !== id))
  }

  const handleCambiarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad <= 0) {
      handleEliminarDelCarrito(id)
    } else {
      setCarrito(
        carrito.map((item) =>
          item.id === id ? { ...item, cantidad: nuevaCantidad } : item,
        ),
      )
    }
  }

  const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0)
  const items = carrito.reduce((sum, item) => sum + item.cantidad, 0)

  const generarBoleta = () => {
    if (carrito.length === 0) {
      alert("El carrito está vacío")
      return
    }
    setShowBoleta(true)
  }

  const finalizarVenta = () => {
    setCarrito([])
    setShowBoleta(false)
    setMetodoPago("boleta")
    alert("Venta completada exitosamente")
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-accent flex items-center gap-3">
          💳 Sistema de Ventas (POS)
        </h1>
        <p className="text-foreground/70 mt-2">
          Gestiona tus ventas de barriles en tiempo real
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Búsqueda y Agregar */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-lg p-6 border border-border space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Buscar Barril</h2>

            {/* Búsqueda por QR */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Escanear QR</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleBuscarPorQR()}
                  placeholder="Ingresa código QR..."
                  className="flex-1 px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-sidebar-primary"
                />
                <button
                  onClick={handleBuscarPorQR}
                  className="px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  📱
                </button>
              </div>
            </div>

            {/* Búsqueda por Nombre */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Buscar por Nombre
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleBuscarPorNombre()}
                  placeholder="Ej: Pilsner, IPA..."
                  className="flex-1 px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-sidebar-primary"
                />
                <button
                  onClick={handleBuscarPorNombre}
                  className="px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
                >
                  🔍
                </button>
              </div>
            </div>

            {/* Lista de productos disponibles */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Productos Disponibles
              </label>
              <div className="grid gap-2 max-h-64 overflow-y-auto">
                {mockBarriles.map((barril) => (
                  <button
                    key={barril.id}
                    onClick={() => handleAgregarAlCarrito(barril)}
                    disabled={barril.stock === 0}
                    className={`p-3 rounded-lg border transition-all text-left ${
                      barril.stock === 0
                        ? "bg-secondary/50 border-border text-foreground/50 cursor-not-allowed"
                        : "bg-secondary border-border hover:border-sidebar-primary hover:bg-secondary/80 text-foreground"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{barril.nombre}</p>
                        <p className="text-xs text-foreground/70">QR: {barril.qr}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-sidebar-primary">
                          ${barril.precio.toLocaleString()}
                        </p>
                        <p className="text-xs text-foreground/70">
                          Stock: {barril.stock}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Carrito */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-card rounded-lg p-6 border border-border h-fit sticky top-6 space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Carrito</h2>

            {carrito.length === 0 ? (
              <p className="text-center text-foreground/50 py-8">
                El carrito está vacío
              </p>
            ) : (
              <>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {carrito.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-secondary rounded-lg border border-border space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {item.nombre}
                          </p>
                          <p className="text-xs text-foreground/70">
                            ${item.precio.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleEliminarDelCarrito(item.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="flex gap-2 items-center">
                        <button
                          onClick={() =>
                            handleCambiarCantidad(item.id, item.cantidad - 1)
                          }
                          className="px-2 py-1 bg-secondary border border-border rounded hover:border-sidebar-primary text-foreground text-sm"
                        >
                          −
                        </button>
                        <input
                          type="number"
                          value={item.cantidad}
                          onChange={(e) =>
                            handleCambiarCantidad(
                              item.id,
                              Number.parseInt(e.target.value) || 1,
                            )
                          }
                          min="1"
                          className="w-12 px-2 py-1 bg-secondary border border-border rounded text-center text-foreground text-sm focus:outline-none focus:border-sidebar-primary"
                        />
                        <button
                          onClick={() =>
                            handleCambiarCantidad(item.id, item.cantidad + 1)
                          }
                          className="px-2 py-1 bg-secondary border border-border rounded hover:border-sidebar-primary text-foreground text-sm"
                        >
                          +
                        </button>
                      </div>
                      <div className="text-right text-sm font-semibold text-sidebar-primary">
                        ${(item.precio * item.cantidad).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/70">Items:</span>
                    <span className="text-foreground font-medium">{items}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-foreground">Total:</span>
                    <span className="text-sidebar-primary">
                      ${total.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={generarBoleta}
                    className="w-full py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-semibold"
                  >
                    Generar Boleta
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Boleta */}
      <PosVentaModal
        show={showBoleta}
        carrito={carrito}
        total={total}
        metodoPago={metodoPago}
        setMetodoPago={setMetodoPago}
        onClose={() => setShowBoleta(false)}
        onConfirm={finalizarVenta}
      />
    </div>
  )
}
