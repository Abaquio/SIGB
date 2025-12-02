"use client"

import { useState } from "react"
import QRCode from "react-qr-code"

export default function BarrilVistaFullModal({ isOpen, onClose, barril }) {
  const [isQrExpanded, setIsQrExpanded] = useState(false)

  if (!isOpen || !barril) return null

  const handlePrintQR = () => {
    if (typeof window === "undefined" || !barril.codigo_qr) return

    const qrText = barril.codigo_qr
    const codigoInterno = barril.codigo_interno || ""

    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(
      qrText
    )}`

    const printWindow = window.open("", "_blank", "width=600,height=800")
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Barril ${barril.id}</title>
          <style>
            @page { margin: 0; }
            body {
              margin: 0;
              padding: 0;
              display: flex;
              flex-direction: column;
              justify-content: flex-start;
              align-items: center;
              font-family: Arial, sans-serif;
              background: white;
            }
            .container {
              width: 100%;
              padding: 40px 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            h1 {
              margin: 0 0 20px 0;
              font-size: 20px;
              font-weight: 700;
            }
            img {
              margin: 20px 0;
              width: 280px;
              height: 280px;
            }
            .label {
              margin-top: 10px;
              font-size: 12px;
              text-transform: uppercase;
              color: #666;
            }
            .value {
              font-size: 14px;
              font-family: monospace;
              margin-bottom: 10px;
              color: #000;
            }
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              footer, header {
                display: none !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Barril #${barril.id}</h1>
            <img src="${qrImgUrl}" alt="QR" />
            <div class="label">Código Interno</div>
            <div class="value">${codigoInterno}</div>
            <div class="label">Código QR</div>
            <div class="value">${qrText}</div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => window.close(), 200);
            }
          </script>
        </body>
      </html>
    `)

    printWindow.document.close()
  }

  const handleDownloadJPG = () => {
    if (typeof window === "undefined" || !barril.codigo_qr) return

    const qrText = barril.codigo_qr

    const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&format=jpg&data=${encodeURIComponent(
      qrText
    )}`

    const link = document.createElement("a")
    link.href = qrImgUrl
    link.download = `QR_Barril_${barril.id}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] animate-in fade-in">
      <div
        className="
          bg-card border border-border rounded-xl
          w-full max-w-3xl
          mx-4 sm:mx-6
          p-4 sm:p-6
          max-h-[90vh]
          flex flex-col
          overflow-y-auto
          animate-in zoom-in
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-card z-10 pb-2">
          <h2 className="text-xl sm:text-2xl font-bold text-accent">
            Detalle del Barril #{barril.id}
          </h2>
          <button
            onClick={onClose}
            className="text-foreground hover:text-accent text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* QR + info */}
        <div className="flex flex-col md:flex-row md:items-start gap-6 mb-6">
          {/* QR */}
          <div className="flex flex-col items-center gap-2 md:w-1/3">
            <div
              className={`
                bg-background p-3 sm:p-4 rounded-lg border border-border
                transition-transform duration-300
                ${isQrExpanded ? "scale-110 sm:scale-125" : ""}
              `}
            >
              {barril.codigo_qr ? (
                <QRCode
                  value={barril.codigo_qr}
                  size={isQrExpanded ? 220 : 140}
                />
              ) : (
                <span className="text-xs text-muted-foreground">Sin QR</span>
              )}
            </div>

            {barril.codigo_qr && (
              <p className="text-xs text-muted-foreground break-all mt-1 sm:mt-2 text-center">
                Código QR:{" "}
                <span className="font-mono text-foreground">
                  {barril.codigo_qr}
                </span>
              </p>
            )}
            {barril.codigo_interno && (
              <p className="text-xs text-muted-foreground text-center">
                Código interno:{" "}
                <span className="font-mono text-foreground">
                  {barril.codigo_interno}
                </span>
              </p>
            )}

            {/* Botón para ampliar/reducir solo el QR */}
            {barril.codigo_qr && (
              <button
                type="button"
                onClick={() => setIsQrExpanded((prev) => !prev)}
                className="mt-2 inline-flex items-center px-3 py-1 rounded-full border border-border text-[11px] uppercase tracking-wide text-muted-foreground hover:bg-accent/10"
              >
                {isQrExpanded ? "Tamaño normal" : "Ampliar QR"}
              </button>
            )}
          </div>

          {/* Info del barril */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Estado actual</p>
              <p className="text-sm sm:text-base text-foreground">
                {barril.estado_actual || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tipo de cerveza</p>
              <p className="text-sm sm:text-base text-foreground">
                {barril.tipo_cerveza || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Capacidad (L)</p>
              <p className="text-sm sm:text-base text-foreground">
                {barril.capacidad_litros != null
                  ? `${barril.capacidad_litros} L`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ubicación actual</p>
              <p className="text-sm sm:text-base text-foreground">
                {barril.ubicacion_actual || "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Activo</p>
              <p className="text-sm sm:text-base text-foreground">
                {barril.activo ? "Sí" : "No"}
              </p>
            </div>
            {barril.fecha_alta && (
              <div>
                <p className="text-xs text-muted-foreground">Fecha de alta</p>
                <p className="text-sm sm:text-base text-foreground">
                  {new Date(barril.fecha_alta).toLocaleString()}
                </p>
              </div>
            )}
            {barril.created_at && (
              <div>
                <p className="text-xs text-muted-foreground">Creado en</p>
                <p className="text-sm sm:text-base text-foreground">
                  {new Date(barril.created_at).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-2 sm:mt-4 flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          {barril.codigo_qr && (
            <>
              <button
                type="button"
                onClick={handlePrintQR}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90 text-xs sm:text-sm"
              >
                Imprimir QR
              </button>
              <button
                type="button"
                onClick={handleDownloadJPG}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90 text-xs sm:text-sm"
              >
                Descargar JPG
              </button>
            </>
          )}
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 text-xs sm:text-sm"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
