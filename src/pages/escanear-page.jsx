"use client"

import { useState } from "react"

export default function EscanearPage() {
  const [scannedCode, setScannedCode] = useState("")

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-accent flex items-center gap-3">
        <span className="text-4xl">📱</span>
        Escanear QR
      </h1>

      {/* Scanner principal */}
      <div className="bg-card rounded-lg p-8 border border-border">
        <div className="flex flex-col items-center justify-center">
          {/* Área de escaneo */}
          <div className="w-full max-w-md aspect-square bg-secondary rounded-lg border-2 border-dashed border-sidebar-primary flex items-center justify-center relative overflow-hidden mb-6">
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-9xl opacity-20">📱</span>
            </div>
            {/* Línea de scanner animada */}
            <div className="absolute inset-x-0 top-1/3 h-1 bg-gradient-to-r from-transparent via-sidebar-primary to-transparent animate-pulse" />
          </div>

          <p className="text-accent-foreground text-center mb-4">Posiciona el código QR dentro del área</p>

          {/* Input para escaneo */}
          <input
            type="text"
            placeholder="O pega el código aquí..."
            value={scannedCode}
            onChange={(e) => setScannedCode(e.target.value)}
            className="w-full max-w-md px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-accent-foreground focus:outline-none focus:border-sidebar-primary transition-colors"
          />
        </div>
      </div>

      {/* Resultado del escaneo */}
      {scannedCode && (
        <div className="bg-card rounded-lg p-6 border border-border border-green-500/50 bg-green-500/5">
          <h2 className="text-lg font-semibold text-green-400 mb-4">Código Detectado</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-accent-foreground">Código QR</p>
              <p className="font-mono text-foreground">{scannedCode}</p>
            </div>
            <div>
              <p className="text-sm text-accent-foreground">Barril Asociado</p>
              <p className="font-semibold text-green-400">Barril #12 - IPA Premium</p>
            </div>
            <div>
              <p className="text-sm text-accent-foreground">Estado</p>
              <p className="font-semibold text-green-400">Activo</p>
            </div>
            <div>
              <p className="text-sm text-accent-foreground">Última Actualización</p>
              <p className="font-semibold text-green-400">Hace 2 minutos</p>
            </div>
          </div>
        </div>
      )}

      {/* Upload alternativo */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="text-2xl">📤</span>
          Subir Imagen
        </h2>
        <input
          type="file"
          accept="image/*"
          className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground file:bg-sidebar-primary file:text-sidebar-primary-foreground file:border-0 file:rounded file:px-4 file:py-2 cursor-pointer"
        />
      </div>
    </div>
  )
}
