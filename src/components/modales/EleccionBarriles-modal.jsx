"use client"

import { useMemo, useState, useEffect } from "react"

export default function EleccionBarrilesModal({
  isOpen,
  onClose,
  barriles = [],
  selectedIds = [],
  onConfirm,
}) {
  // ✅ Hooks SIEMPRE arriba (nunca después de un return condicional)
  const [search, setSearch] = useState("")
  const [localSelected, setLocalSelected] = useState(new Set())

  // ✅ Sincroniza selección cuando se abre el modal o cambian selectedIds
  useEffect(() => {
    if (isOpen) {
      setLocalSelected(new Set(selectedIds))
    }
  }, [isOpen, selectedIds])

  // ✅ Filtrado (hook siempre ejecutado)
  const filtrados = useMemo(() => {
    const term = (search || "").trim().toLowerCase()
    if (!term) return barriles

    return barriles.filter((b) => {
      const nombre = (b.tipo_cerveza || "").toLowerCase()
      const codigo = (b.codigo_interno || "").toLowerCase()
      const qr = (b.codigo_qr || "").toLowerCase()
      const ubic = (b.ubicacion_actual || "").toLowerCase()
      return (
        nombre.includes(term) ||
        codigo.includes(term) ||
        qr.includes(term) ||
        ubic.includes(term)
      )
    })
  }, [barriles, search])

  const toggle = (id) => {
    setLocalSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleConfirm = () => {
    const ids = Array.from(localSelected)
    const seleccionados = barriles.filter((b) => ids.includes(b.id))
    onConfirm?.(seleccionados)
  }

  // ✅ Recién aquí retornamos null (después de hooks)
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in duration-200">
      {/* Modal “L” */}
      <div className="bg-card border border-border rounded-xl shadow-xl w-full max-w-6xl mx-4 p-6 md:p-8 animate-in zoom-in duration-300">
        <div className="flex items-start justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-bold text-accent">Elección de barriles</h2>
            <p className="text-foreground/70 text-sm mt-1">
              Selecciona los barriles que estarán en uso para vender en POS.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-foreground hover:text-accent transition-colors text-2xl leading-none"
            title="Cerrar"
            type="button"
          >
            ×
          </button>
        </div>

        {/* Buscador */}
        <div className="flex flex-col md:flex-row gap-3 mb-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por IPA, código, QR, ubicación..."
            className="flex-1 px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-sidebar-primary"
          />

          <div className="px-4 py-2 rounded-lg bg-secondary border border-border text-sm text-foreground/80 flex items-center justify-center">
            Seleccionados:{" "}
            <span className="ml-2 font-semibold text-foreground">
              {localSelected.size}
            </span>
          </div>
        </div>

        {/* Lista */}
        <div className="border border-border rounded-lg bg-secondary/40 p-3">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[60vh] overflow-y-auto pr-1">
            {filtrados.length === 0 ? (
              <p className="text-sm text-foreground/60 py-6 col-span-full text-center">
                No hay barriles disponibles con ese filtro.
              </p>
            ) : (
              filtrados.map((b) => {
                const isSel = localSelected.has(b.id)
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => toggle(b.id)}
                    className={`p-4 rounded-lg border text-left transition-all bg-secondary text-foreground
                      ${isSel
                        ? "border-sidebar-primary ring-2 ring-sidebar-primary/30"
                        : "border-border hover:border-sidebar-primary/70"
                      }
                    `}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1">
                        <p className="font-semibold text-sm">
                          {b.tipo_cerveza || "Barril"}
                        </p>
                        <p className="text-xs text-foreground/70">
                          Código interno: {b.codigo_interno || "-"}
                        </p>
                        {b.codigo_qr ? (
                          <p className="text-xs text-foreground/70">QR: {b.codigo_qr}</p>
                        ) : null}
                        {b.ubicacion_actual ? (
                          <p className="text-xs text-foreground/70">
                            Ubicación: {b.ubicacion_actual}
                          </p>
                        ) : null}
                      </div>

                      <span
                        className={`text-xs px-2 py-1 rounded-full border whitespace-nowrap
                          ${isSel
                            ? "border-sidebar-primary text-sidebar-primary"
                            : "border-border text-foreground/70"
                          }
                        `}
                      >
                        {isSel ? "Seleccionado" : "Disponible"}
                      </span>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className="flex flex-col sm:flex-row gap-3 pt-5">
          <button
            type="button"
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
          >
            Confirmar selección
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-secondary border border-border rounded-lg hover:bg-secondary/80 transition-colors font-medium"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
