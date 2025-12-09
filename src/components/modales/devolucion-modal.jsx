"use client"

import { useEffect, useState } from "react"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

export default function DevolucionModal({
  show,
  motivosDevoluciones = [],
  onClose,
  onCreated,
}) {
  const [folio, setFolio] = useState("")
  const [venta, setVenta] = useState(null)
  const [detalles, setDetalles] = useState([])
  const [tipoDevolucion, setTipoDevolucion] = useState("CLIENTE")
  const [motivo, setMotivo] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [error, setError] = useState("")
  const [loadingVenta, setLoadingVenta] = useState(false)
  const [loadingSave, setLoadingSave] = useState(false)

  // Reset cada vez que se abre/cierra
  useEffect(() => {
    if (!show) {
      setFolio("")
      setVenta(null)
      setDetalles([])
      setTipoDevolucion("CLIENTE")
      setMotivo("")
      setObservaciones("")
      setError("")
      setLoadingVenta(false)
      setLoadingSave(false)
    }
  }, [show])

  if (!show) return null

  const handleBuscarVenta = async () => {
    if (!folio.trim()) {
      setError("Ingresa un número de folio")
      return
    }

    setLoadingVenta(true)
    setError("")
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/ventas/folio/${encodeURIComponent(
          folio.trim()
        )}`
      )

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || "Venta no encontrada")
      }

      const detallesEnriquecidos = (data.detalles || []).map((d) => ({
        ...d,
        selected: true,
        cantidadDevolver:
          d.unidad === "BARRIL"
            ? 1
            : Number(d.cantidad ?? d.cantidad_vendida) || 0,
      }))

      setVenta(data)
      setDetalles(detallesEnriquecidos)
    } catch (err) {
      console.error("❌ Error buscando venta por folio:", err)
      setVenta(null)
      setDetalles([])
      setError(err.message || "Error al buscar la venta")
    } finally {
      setLoadingVenta(false)
    }
  }

  const handleToggleItem = (id) => {
    setDetalles((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, selected: !d.selected } : d
      )
    )
  }

  const handleChangeCantidad = (id, value) => {
    setDetalles((prev) =>
      prev.map((d) => {
        if (d.id !== id) return d
        const max = Number(d.cantidad) || 0
        let nueva = Number(value)
        if (!Number.isFinite(nueva) || nueva < 0) nueva = 0
        if (max > 0 && nueva > max) nueva = max
        return { ...d, cantidadDevolver: nueva }
      })
    )
  }

  const handleGuardar = async () => {
    if (!venta) {
      setError("Primero debes buscar y seleccionar una venta")
      return
    }

    const seleccionados = detalles.filter(
      (d) => d.selected && (Number(d.cantidadDevolver) || 0) > 0
    )

    if (seleccionados.length === 0) {
      setError("Selecciona al menos un ítem con cantidad a devolver")
      return
    }

    const items = seleccionados.map((d) => {
      const cantidad = Number(d.cantidadDevolver) || 0
      const precio = Number(d.precio_unitario) || 0
      return {
        barril_id: d.barril_id,
        cantidad,
        unidad: d.unidad || "BARRIL",
        monto_linea: cantidad * precio,
      }
    })

    const payload = {
      venta_id: venta.id,
      cliente_id: venta.cliente_id || null,
      tipo_devolucion: tipoDevolucion,
      motivo: motivo || null,
      observaciones: observaciones || null,
      bodega_id_retorno: venta.bodega_id || null,
      items,
    }

    setLoadingSave(true)
    setError("")
    try {
      const res = await fetch(`${API_BASE_URL}/api/devoluciones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || "Error al registrar la devolución")
      }

      if (typeof onCreated === "function") {
        onCreated(data)
      }
    } catch (err) {
      console.error("❌ Error guardando devolución:", err)
      setError(err.message || "Error al registrar la devolución")
    } finally {
      setLoadingSave(false)
    }
  }

  const totalSeleccionado = detalles
    .filter((d) => d.selected)
    .reduce((sum, d) => {
      const cantidad = Number(d.cantidadDevolver) || 0
      const precio = Number(d.precio_unitario) || 0
      return sum + cantidad * precio
    }, 0)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-sidebar-primary mb-4">
          Registrar Devolución
        </h2>

        {/* Buscar venta por folio */}
        <div className="space-y-3 mb-4">
          <label className="text-sm font-medium text-foreground block">
            Número de folio / documento
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={folio}
              onChange={(e) => setFolio(e.target.value)}
              placeholder="Ej: 8432"
              className="flex-1 px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-sidebar-primary"
            />
            <button
              type="button"
              onClick={handleBuscarVenta}
              disabled={loadingVenta}
              className="px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg font-semibold hover:opacity-90 disabled:opacity-60"
            >
              {loadingVenta ? "Buscando..." : "Buscar"}
            </button>
          </div>
        </div>

        {/* Info de la venta */}
        {venta && (
          <div className="mb-4 p-3 rounded-lg bg-secondary/60 border border-border text-sm space-y-1">
            <div className="flex flex-wrap justify-between gap-2">
              <span className="font-semibold">
                {venta.tipo_documento} #{venta.numero_documento}
              </span>
              <span>
                Fecha:{" "}
                {venta.fecha_hora
                  ? new Date(venta.fecha_hora).toLocaleString("es-CL")
                  : "-"}
              </span>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <span>
                Cliente:{" "}
                <span className="font-medium">
                  {venta.cliente_nombre || "—"}
                </span>
              </span>
              <span>
                Total venta:{" "}
                <span className="font-semibold text-sidebar-primary">
                  $
                  {(Number(venta.total_neto) || 0).toLocaleString(
                    "es-CL"
                  )}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Detalle de ítems para devolver */}
        {venta && (
          <div className="mb-4 border border-border rounded-lg overflow-hidden">
            <div className="bg-secondary px-4 py-2 text-sm font-semibold text-foreground">
              Ítems de la venta
            </div>
            <div className="max-h-56 overflow-y-auto">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-border bg-card/40">
                    <th className="px-3 py-2 text-left">Sel.</th>
                    <th className="px-3 py-2 text-left">Barril</th>
                    <th className="px-3 py-2 text-left">Vendidos</th>
                    <th className="px-3 py-2 text-left">Devolver</th>
                    <th className="px-3 py-2 text-left">Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {detalles.map((d) => (
                    <tr
                      key={d.id}
                      className="border-t border-border hover:bg-secondary/40"
                    >
                      <td className="px-3 py-2 align-middle">
                        <input
                          type="checkbox"
                          checked={d.selected}
                          onChange={() => handleToggleItem(d.id)}
                        />
                      </td>
                      <td className="px-3 py-2 align-middle text-foreground">
                        <div className="font-medium">
                          {d.barril_nombre ||
                            `Barril #${d.barril_id}`}
                        </div>
                        {d.barril_codigo && (
                          <div className="text-[10px] text-foreground/60">
                            Código: {d.barril_codigo}
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 align-middle text-foreground/80">
                        {Number(d.cantidad) || 0}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <input
                          type="number"
                          min="0"
                          value={d.cantidadDevolver}
                          onChange={(e) =>
                            handleChangeCantidad(
                              d.id,
                              e.target.value
                            )
                          }
                          className="w-20 px-2 py-1 bg-secondary border border-border rounded text-foreground text-xs"
                        />
                      </td>
                      <td className="px-3 py-2 align-middle text-foreground/80">
                        {d.unidad}
                      </td>
                    </tr>
                  ))}

                  {detalles.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-3 py-4 text-center text-foreground/60"
                      >
                        No hay ítems para esta venta
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 text-xs md:text-sm flex justify-between items-center border-t border-border bg-card/70">
              <span className="text-foreground/70">
                Total seleccionado a devolver:
              </span>
              <span className="font-semibold text-sidebar-primary">
                ${totalSeleccionado.toLocaleString("es-CL")}
              </span>
            </div>
          </div>
        )}

        {/* Formulario de motivo / tipo */}
        <div className="space-y-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Tipo de devolución
              </label>
              <select
                value={tipoDevolucion}
                onChange={(e) => setTipoDevolucion(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-sidebar-primary text-sm"
              >
                <option value="CLIENTE">Cliente</option>
                <option value="INTERNA">Interna</option>
                <option value="OTRO">Otro</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground block mb-1">
                Motivo
              </label>
              <select
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-sidebar-primary text-sm"
              >
                <option value="">Selecciona un motivo</option>
                {motivosDevoluciones.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-1">
              Observaciones
            </label>
            <textarea
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Notas internas, detalles adicionales..."
              className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-sidebar-primary text-sm resize-none"
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/40 px-3 py-2 rounded">
            {error}
          </div>
        )}

        {/* Botones */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loadingSave}
            className="px-4 py-2 rounded-lg border border-border text-foreground hover:bg-secondary/70 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            disabled={loadingSave || !venta}
            className="px-5 py-2 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground font-semibold hover:opacity-90 disabled:opacity-60 text-sm"
          >
            {loadingSave ? "Guardando..." : "Registrar devolución"}
          </button>
        </div>
      </div>
    </div>
  )
}
