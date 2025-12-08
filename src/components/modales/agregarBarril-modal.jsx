"use client"

import { useEffect, useState } from "react"
import QRCode from "react-qr-code"

const EMPTY_FORM = {
  tipo_cerveza: "",
  capacidad_litros: 50,
  estado_actual: "DISPONIBLE",
  ubicacion_actual: "",
}

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

export default function AgregarBarrilModal({
  isOpen,
  onClose,
  mode = "create",
  initialBarril = null,
  onSubmit,
}) {
  const isEdit = mode === "edit"

  const [formData, setFormData] = useState(EMPTY_FORM)
  const [beerTypes, setBeerTypes] = useState([])
  const [bodegas, setBodegas] = useState([])
  const [loadingCatalogos, setLoadingCatalogos] = useState(false)

  // Cargar catálogos desde la API cuando se abre el modal
  useEffect(() => {
    if (!isOpen) return

    const loadCatalogos = async () => {
      setLoadingCatalogos(true)
      try {
        const [resCats, resBods] = await Promise.all([
          fetch(`${API_BASE_URL}/api/categorias-cerveza`),
          fetch(`${API_BASE_URL}/api/bodegas`),
        ])

        const cats = resCats.ok ? await resCats.json() : []
        const bods = resBods.ok ? await resBods.json() : []

        setBeerTypes(cats || [])
        setBodegas(bods || [])
      } catch (err) {
        console.error("❌ Error cargando catálogos:", err)
      } finally {
        setLoadingCatalogos(false)
      }
    }

    loadCatalogos()

    if (isEdit && initialBarril) {
      setFormData({
        id: initialBarril.id,
        tipo_cerveza:
          initialBarril.tipo_cerveza ||
          initialBarril.categorias_cerveza?.nombre ||
          "",
        capacidad_litros: Number(initialBarril.capacidad_litros) || 50,
        estado_actual: initialBarril.estado_actual || "DISPONIBLE",
        ubicacion_actual:
          initialBarril.ubicacion_actual || initialBarril.bodegas?.nombre || "",
        codigo_interno: initialBarril.codigo_interno,
        codigo_qr: initialBarril.codigo_qr,
      })
    } else {
      setFormData(EMPTY_FORM)
    }
  }, [isOpen, isEdit, initialBarril])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "capacidad_litros" ? Number(value) : value,
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const payload = { ...formData }
    delete payload.codigo_interno
    delete payload.codigo_qr

    onSubmit(payload)
  }

  if (!isOpen) return null

  // Para evitar que en edición se pierda el valor si no está en la lista
  const hasTipoInList =
    formData.tipo_cerveza &&
    beerTypes.some((c) => c.nombre === formData.tipo_cerveza)

  const hasBodegaInList =
    formData.ubicacion_actual &&
    bodegas.some((b) => b.nombre === formData.ubicacion_actual)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in">
      <div className="bg-card border border-border rounded-lg p-6 w-full max-w-2xl animate-in zoom-in">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-accent">
            {isEdit ? "Editar Barril" : "Agregar Nuevo Barril"}
          </h2>
          <button
            onClick={onClose}
            className="text-foreground hover:text-accent text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* QR SOLO EN EDICIÓN */}
        {isEdit && formData.codigo_qr && (
          <div className="mb-5 flex items-center gap-4">
            <div className="bg-background p-3 rounded-lg border border-border">
              <QRCode value={formData.codigo_qr} size={96} />
            </div>
            <div className="text-sm">
              <p className="text-muted-foreground">Código QR asignado:</p>
              <p className="font-mono text-foreground break-all">
                {formData.codigo_qr}
              </p>

              {formData.codigo_interno && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Código interno:{" "}
                  <span className="font-mono text-foreground">
                    {formData.codigo_interno}
                  </span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* FORM */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de cerveza */}
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Tipo de Cerveza
            </label>
            <select
              name="tipo_cerveza"
              value={formData.tipo_cerveza}
              onChange={handleChange}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground"
              required
            >
              <option value="">
                {loadingCatalogos ? "Cargando..." : "Selecciona un tipo"}
              </option>

              {/* opción de edición si no está en la lista */}
              {isEdit && formData.tipo_cerveza && !hasTipoInList && (
                <option value={formData.tipo_cerveza}>
                  {formData.tipo_cerveza} (actual)
                </option>
              )}

              {beerTypes.map((cat) => (
                <option key={cat.id} value={cat.nombre}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Capacidad */}
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Capacidad (Litros)
            </label>
            <input
              type="number"
              name="capacidad_litros"
              value={formData.capacidad_litros}
              onChange={handleChange}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground"
              min={0}
            />
          </div>

          {/* Estado */}
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Estado
            </label>
            <select
              name="estado_actual"
              value={formData.estado_actual}
              onChange={handleChange}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground"
            >
              <option value="DISPONIBLE">Disponible</option>
              <option value="EN_USO">En Uso</option>
              <option value="LIMPIEZA">Limpieza</option>
              <option value="MANTENIMIENTO">Mantenimiento</option>
            </select>
          </div>

          {/* Ubicación / Bodega */}
          <div>
            <label className="block text-foreground text-sm font-medium mb-2">
              Ubicación (Bodega)
            </label>
            <select
              name="ubicacion_actual"
              value={formData.ubicacion_actual}
              onChange={handleChange}
              className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-foreground"
            >
              <option value="">
                {loadingCatalogos ? "Cargando..." : "Selecciona una bodega"}
              </option>

              {isEdit && formData.ubicacion_actual && !hasBodegaInList && (
                <option value={formData.ubicacion_actual}>
                  {formData.ubicacion_actual} (actual)
                </option>
              )}

              {bodegas.map((b) => (
                <option key={b.id} value={b.nombre}>
                  {b.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-lg hover:bg-secondary/80"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground rounded-lg hover:opacity-90"
            >
              {isEdit ? "Guardar Cambios" : "Agregar Barril"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
