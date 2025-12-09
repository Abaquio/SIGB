"use client"

export default function DevolucionModal({
  show,
  formData,
  motivosDevoluciones,
  onInputChange,
  onClose,
  onSave,
}) {
  if (!show) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border rounded-lg p-8 max-w-md w-full">
        <h2 className="text-2xl font-bold text-sidebar-primary mb-6">
          Registrar Devolución
        </h2>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Número de Recibo
            </label>
            <input
              type="text"
              name="numeroRecibo"
              value={formData.numeroRecibo}
              onChange={onInputChange}
              placeholder="Ej: 8432"
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-sidebar-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Barril
            </label>
            <input
              type="text"
              name="barril"
              value={formData.barril}
              onChange={onInputChange}
              placeholder="Ej: Pilsner Premium"
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-sidebar-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Cantidad
            </label>
            <input
              type="number"
              name="cantidad"
              value={formData.cantidad}
              onChange={onInputChange}
              min="1"
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-sidebar-primary"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Motivo
            </label>
            <select
              name="motivo"
              value={formData.motivo}
              onChange={onInputChange}
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground focus:outline-none focus:border-sidebar-primary"
            >
              <option value="">Selecciona un motivo</option>
              {motivosDevoluciones.map((motivo) => (
                <option key={motivo} value={motivo}>
                  {motivo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground block mb-2">
              Monto a Devolver
            </label>
            <input
              type="number"
              name="monto"
              value={formData.monto}
              onChange={onInputChange}
              placeholder="0"
              className="w-full px-4 py-2 bg-secondary border border-border rounded-lg text-foreground placeholder:text-foreground/50 focus:outline-none focus:border-sidebar-primary"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-secondary border border-border rounded-lg text-foreground hover:bg-secondary/80 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              className="flex-1 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90 transition-opacity font-medium"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
