"use client";

import { useState, useEffect } from "react";
import PosVentaModal from "../components/modales/posVenta-modal";
import ValidadoCard from "../components/ui/validado";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

// PRECIOS SUGERIDOS PARA SHOPS
const PRECIOS_SHOP = {
  "500": 2000,  // 500 ml = $2.000
  "1000": 3500, // 1 L   = $3.500
};

const metodosPago = [
  { id: "boleta", nombre: "Boleta", icono: "🧾" },
  { id: "factura", nombre: "Factura", icono: "📄" },
  { id: "transferencia", nombre: "Transferencia", icono: "💸" },
  { id: "tarjeta", nombre: "Tarjeta", icono: "💳" },
];

export default function POSPage() {
  const [barriles, setBarriles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [carrito, setCarrito] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [qrInput, setQrInput] = useState("");

  const [shotSize, setShotSize] = useState("500"); // "500" o "1000" (1 L)
  const [showBoleta, setShowBoleta] = useState(false);
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] =
    useState("boleta");

  // Descuentos
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);
  const [descuentoMonto, setDescuentoMonto] = useState(0);

  // Número de boleta proveniente de BD
  const [numeroBoleta, setNumeroBoleta] = useState(null);
  const [cargandoNumeroBoleta, setCargandoNumeroBoleta] = useState(false);

  // Confirmación visual
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState("");

  // ===========================
  // 1) Cargar barriles reales
  // ===========================
  useEffect(() => {
    const fetchBarriles = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await fetch(`${API_BASE_URL}/api/barriles`);
        if (!res.ok) {
          const raw = await res.text();
          console.error("Error /api/barriles:", res.status, raw);
          throw new Error("Error al cargar barriles");
        }

        const data = await res.json();
        setBarriles(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error cargando barriles:", err);
        setError("No se pudieron cargar los barriles.");
      } finally {
        setLoading(false);
      }
    };

    fetchBarriles();
  }, []);

  // Solo barriles disponibles
  const barrilesDisponibles = barriles.filter((b) => {
    if (!b.estado_actual) return false;
    const estado = String(b.estado_actual).trim().toLowerCase();
    return estado === "disponible";
  });

  // ===========================
  // 2) Carrito + shops
  // ===========================
  const handleAgregarAlCarrito = (barril) => {
    const precioShop = PRECIOS_SHOP[shotSize];

    setCarrito((prev) => {
      const idx = prev.findIndex(
        (item) => item.id === barril.id && item.shotSize === shotSize
      );

      // Si ya existe el mismo barril con el mismo tamaño → sumamos un shop
      if (idx !== -1) {
        const copia = [...prev];
        copia[idx] = {
          ...copia[idx],
          cantidadShops: copia[idx].cantidadShops + 1,
        };
        return copia;
      }

      // Si no existe, lo agregamos
      return [
        ...prev,
        {
          ...barril,
          cantidadShops: 1,
          shotSize,
          precioShop,
        },
      ];
    });
  };

  const cambiarCantidad = (id, nuevaCantidad) => {
    if (nuevaCantidad < 1) return;
    setCarrito((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, cantidadShops: nuevaCantidad } : item
      )
    );
  };

  const handleEliminarDelCarrito = (id) => {
    setCarrito((prev) => prev.filter((item) => item.id !== id));
  };

  // ===========================
  // 3) Búsquedas
  // ===========================
  const handleBuscarPorQR = () => {
    const qr = qrInput.trim().toLowerCase();
    if (!qr) return;

    const barrilEncontrado = barrilesDisponibles.find(
      (b) => (b.codigo_qr || "").toLowerCase() === qr
    );

    if (barrilEncontrado) {
      handleAgregarAlCarrito(barrilEncontrado);
      setQrInput("");
    } else {
      alert("Barril no encontrado o no disponible.");
    }
  };

  const handleBuscarPorNombre = () => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return;

    const barrilEncontrado = barrilesDisponibles.find((b) => {
      const nombre = (b.tipo_cerveza || "").toLowerCase();
      const codigo = (b.codigo_interno || "").toLowerCase();
      const qr = (b.codigo_qr || "").toLowerCase();
      const ubicacion = (b.ubicacion_actual || "").toLowerCase();
      return (
        nombre.includes(term) ||
        codigo.includes(term) ||
        qr.includes(term) ||
        ubicacion.includes(term)
      );
    });

    if (barrilEncontrado) {
      handleAgregarAlCarrito(barrilEncontrado);
      setSearchTerm("");
    } else {
      alert("Barril no encontrado.");
    }
  };

  // ===========================
  // 4) Totales + descuentos
  // ===========================
  const subtotal = carrito.reduce(
    (sum, item) => sum + (item.precioShop || 0) * (item.cantidadShops || 0),
    0
  );

  const descuento1 =
    descuentoPorcentaje > 0 ? (subtotal * descuentoPorcentaje) / 100 : 0;

  const descuento2 =
    descuentoMonto > 0 && descuentoMonto < 1000000 ? descuentoMonto : 0;

  const total = Math.max(0, subtotal - descuento1 - descuento2);

  // ===========================
  // 5) Número de boleta desde BD
  // ===========================
  const obtenerNumeroBoleta = async () => {
    try {
      setCargandoNumeroBoleta(true);
      setNumeroBoleta(null);

      const res = await fetch(`${API_BASE_URL}/api/ventas/siguiente-numero`);
      if (!res.ok) {
        throw new Error("Error obteniendo correlativo");
      }
      const data = await res.json();
      setNumeroBoleta(data?.nextNumero ?? 1);
    } catch (err) {
      console.error("Error obteniendo número de boleta:", err);
      // fallback simple
      setNumeroBoleta(1);
    } finally {
      setCargandoNumeroBoleta(false);
      setShowBoleta(true);
    }
  };

  const generarBoleta = () => {
    if (carrito.length === 0) {
      alert("El carrito está vacío");
      return;
    }
    obtenerNumeroBoleta();
  };

  // ===========================
  // 6) Finalizar venta → POST /api/ventas
  // ===========================
  const finalizarVenta = async () => {
    try {
      if (!carrito.length) {
        alert("No hay barriles en el carrito.");
        return;
      }

      if (!numeroBoleta) {
        alert("No se pudo obtener el número de boleta.");
        return;
      }

      // Tomamos la bodega desde el primer barril del carrito (si existe)
      const primerBarril = carrito[0];
      const bodegaId = primerBarril?.bodega_id || null;

      // Mapeo simple doc / método de pago según tu estado
      const tipoDocumento =
        metodoPagoSeleccionado === "factura" ? "FACTURA" : "BOLETA";

      const metodoPago = (() => {
        switch (metodoPagoSeleccionado) {
          case "transferencia":
            return "TRANSFERENCIA";
          case "tarjeta":
            // Podrías elegir DEBITO o CREDITO según tu modal
            return "DEBITO";
          default:
            return "EFECTIVO";
        }
      })();

      const descuentoTotal = (descuento1 + descuento2) || 0;

      // Items para venta_detalle:
      // - unidad: 'LITRO'
      // - cantidad: litros vendidos (shops * 0.5 o 1)
      // - precio_unitario: precio por litro
      const items = carrito.map((item) => {
        const litrosPorShop = item.shotSize === "1000" ? 1 : 0.5; // 1 L o 0.5 L
        const cantidadLitros = (item.cantidadShops || 1) * litrosPorShop;

        const precioShop = item.precioShop || 0;
        const precioUnitario =
          litrosPorShop > 0 ? precioShop / litrosPorShop : precioShop;

        return {
          barril_id: item.id,
          cantidad: cantidadLitros,
          unidad: "LITRO",
          precio_unitario: precioUnitario,
        };
      });

      const payload = {
        cliente_id: null, // por ahora sin cliente
        bodega_id: bodegaId,
        tipo_documento: tipoDocumento,
        numero_documento: String(numeroBoleta),
        metodo_pago: metodoPago,
        descuento_total: descuentoTotal,
        observaciones: "Venta POS - BrewMaster",
        items,
      };

      const resp = await fetch(`${API_BASE_URL}/api/ventas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => null);
        console.error("Error al registrar venta:", errData);
        alert(errData?.error || "Ocurrió un error al registrar la venta.");
        return;
      }

      const data = await resp.json();
      console.log("Venta registrada:", data);

      const ventaId = data?.id ?? null;

      // Abrir boleta en PDF en nueva pestaña (ruta nueva /pdf/:id)
      if (ventaId) {
        const pdfUrl = `${API_BASE_URL}/api/ventas/pdf/${ventaId}`;
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
      }

      // Confirm visual (ValidadoCard) + limpieza de estado
      setConfirmMessage(
        `Venta N° ${ventaId ?? numeroBoleta} registrada correctamente.`
      );
      setShowConfirm(true);

      setCarrito([]);
      setDescuentoMonto(0);
      setDescuentoPorcentaje(0);
      setShowBoleta(false);

      // Opcional: refrescar barriles para que se actualice estado / litros
      try {
        const resBarriles = await fetch(`${API_BASE_URL}/api/barriles`);
        if (resBarriles.ok) {
          const nuevos = await resBarriles.json();
          setBarriles(Array.isArray(nuevos) ? nuevos : []);
        }
      } catch (e) {
        console.error("Error recargando barriles después de la venta:", e);
      }
    } catch (error) {
      console.error("Error inesperado al finalizar venta:", error);
      alert("Error inesperado al finalizar la venta.");
    }
  };

  // ===========================
  // Render
  // ===========================
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-6">
      <div>
        <h1 className="text-3xl font-bold text-accent flex items-center gap-3">
          💳 Sistema de Ventas (POS)
        </h1>
        <p className="text-foreground/70 mt-2">
          Selecciona barriles por QR o búsqueda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* IZQUIERDA: filtros + barriles */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card rounded-lg p-6 border border-border space-y-4">
            <h2 className="text-xl font-semibold text-foreground">
              Buscar Barril
            </h2>

            {/* Búsqueda por QR */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Escanear QR
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrInput}
                  onChange={(e) => setQrInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleBuscarPorQR()}
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

            {/* Búsqueda por texto */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Buscar por texto
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && handleBuscarPorNombre()
                  }
                  placeholder="IPA, Pilsner, código, ubicación..."
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

            {/* Tamaño del shop */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Tamaño del shop
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setShotSize("500")}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                    shotSize === "500"
                      ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary"
                      : "bg-secondary text-foreground border-border hover:border-sidebar-primary/70"
                  }`}
                >
                  <span>🍺</span>
                  <span>
                    500 ml — ${PRECIOS_SHOP["500"].toLocaleString()}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShotSize("1000")}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm ${
                    shotSize === "1000"
                      ? "bg-sidebar-primary text-sidebar-primary-foreground border-sidebar-primary"
                      : "bg-secondary text-foreground border-border hover:border-sidebar-primary/70"
                  }`}
                >
                  <span>🍻</span>
                  <span>
                    1 L — ${PRECIOS_SHOP["1000"].toLocaleString()}
                  </span>
                </button>
              </div>
              <p className="text-xs text-foreground/60 mt-1">
                Este tamaño y precio se usarán para los shops que agregues al
                carrito.
              </p>
            </div>

            {/* Lista de barriles */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Barriles Disponibles
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                {loading && (
                  <p className="text-sm text-foreground/60 py-4 col-span-full">
                    Cargando barriles...
                  </p>
                )}

                {!loading && error && (
                  <p className="text-sm text-red-400 py-4 col-span-full">
                    {error}
                  </p>
                )}

                {!loading &&
                  !error &&
                  barrilesDisponibles.length === 0 && (
                    <p className="text-sm text-foreground/60 py-4 col-span-full">
                      No hay barriles disponibles para la venta.
                    </p>
                  )}

                {!loading &&
                  !error &&
                  barrilesDisponibles.map((barril) => (
                    <button
                      key={barril.id}
                      onClick={() => handleAgregarAlCarrito(barril)}
                      className="p-3 rounded-lg border text-left text-sm transition-all flex flex-col justify-between bg-secondary text-foreground border-border hover:border-sidebar-primary hover:bg-secondary/80"
                    >
                      <div className="flex justify_between items-start gap-2">
                        <div className="space-y-1">
                          <p className="font-medium text-sm">
                            {barril.tipo_cerveza || "Barril"}
                          </p>
                          <p className="text-xs opacity-80">
                            Código interno: {barril.codigo_interno}
                          </p>
                          {barril.codigo_qr && (
                            <p className="text-xs opacity-80">
                              QR: {barril.codigo_qr}
                            </p>
                          )}
                          {barril.ubicacion_actual && (
                            <p className="text-xs opacity-80">
                              Ubicación: {barril.ubicacion_actual}
                            </p>
                          )}
                        </div>
                        <div className="text-right space-y-1">
                          <p className="text-[11px] uppercase tracking-wide opacity-80">
                            {barril.estado_actual}
                          </p>
                          <p className="text-[11px] opacity-80 border border-white/10 rounded-full px-2 py-[1px] mt-1">
                            Shop: {shotSize === "1000" ? "1 L" : "500 ml"}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* DERECHA: carrito */}
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
                      key={`${item.id}-${item.shotSize}`}
                      className="p-3 bg-secondary rounded-lg border border-border space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm text-foreground">
                            {item.tipo_cerveza || "Barril"}
                          </p>
                          <p className="text-xs text-foreground/70">
                            Código interno: {item.codigo_interno}
                          </p>
                          {item.codigo_qr && (
                            <p className="text-xs text-foreground/70">
                              QR: {item.codigo_qr}
                            </p>
                          )}
                          <p className="text-xs text-foreground/60 mt-1">
                            Tamaño:{" "}
                            {item.shotSize === "1000" ? "1 L" : "500 ml"}
                          </p>
                          <p className="text-xs text-foreground/60">
                            Precio shop: $
                            {item.precioShop.toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleEliminarDelCarrito(item.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          ✕
                        </button>
                      </div>

                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() =>
                            cambiarCantidad(
                              item.id,
                              (item.cantidadShops || 1) - 1
                            )
                          }
                          className="px-2 py-1 bg-secondary border border-border rounded"
                        >
                          -
                        </button>
                        <span className="w-8 text-center text-sm">
                          {item.cantidadShops}
                        </span>
                        <button
                          onClick={() =>
                            cambiarCantidad(
                              item.id,
                              (item.cantidadShops || 1) + 1
                            )
                          }
                          className="px-2 py-1 bg-secondary border border-border rounded"
                        >
                          +
                        </button>

                        <span className="ml-auto font-semibold text-foreground text-sm">
                          $
                          {(
                            item.precioShop * item.cantidadShops
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Descuentos y total */}
                <div className="border-t border-border pt-4 space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm text-foreground">
                      Descuento (%)
                    </label>
                    <input
                      type="number"
                      value={descuentoPorcentaje}
                      onChange={(e) =>
                        setDescuentoPorcentaje(
                          Math.max(0, Number(e.target.value))
                        )
                      }
                      className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground"
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm text-foreground">
                      Descuento ($)
                    </label>
                    <input
                      type="number"
                      value={descuentoMonto}
                      onChange={(e) =>
                        setDescuentoMonto(
                          Math.min(1000000, Number(e.target.value))
                        )
                      }
                      className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground"
                      placeholder="0"
                    />
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/70">Subtotal:</span>
                    <span className="text-foreground font-medium">
                      ${subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-foreground/70">Descuento:</span>
                    <span className="text-foreground font-medium">
                      -$
                      {(descuento1 + descuento2).toLocaleString()}
                    </span>
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
                    {cargandoNumeroBoleta
                      ? "Generando número..."
                      : "Generar Boleta"}
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
        numeroBoleta={numeroBoleta}
        metodoPago={metodoPagoSeleccionado}
        setMetodoPago={setMetodoPagoSeleccionado}
        onClose={() => setShowBoleta(false)}
        onConfirm={finalizarVenta}
        metodosPago={metodosPago}
      />

      {/* Confirmación visual */}
      <ValidadoCard
        open={showConfirm}
        title="Venta registrada"
        message={confirmMessage}
        onClose={() => setShowConfirm(false)}
      />
    </div>
  );
}
