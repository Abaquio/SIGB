"use client"

import { useState, useRef, useEffect } from "react"
import jsQR from "jsqr"
import BarrilVistaFullModal from "../components/modales/barril-vistaFull"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000"

export default function EscanearPage() {
  const [scannedCode, setScannedCode] = useState("")
  const [lookupLoading, setLookupLoading] = useState(false)
  const [lookupError, setLookupError] = useState(null)
  const [foundBarrel, setFoundBarrel] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // cámara
  const [isCameraOn, setIsCameraOn] = useState(false)
  const [stream, setStream] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const animationFrameIdRef = useRef(null)

  const handleCodeDetected = async (code) => {
    if (!code) return
    setScannedCode(code)
    setLookupError(null)
    setFoundBarrel(null)

    try {
      setLookupLoading(true)

      const res = await fetch(`${API_BASE_URL}/api/barriles`)
      if (!res.ok) throw new Error("No se pudieron obtener los barriles")

      const data = await res.json()
      const match = data.find(
        (b) => b.codigo_qr === code || b.codigo_interno === code
      )

      if (match) {
        setFoundBarrel(match)
        setIsModalOpen(true)
      } else {
        setLookupError("No se encontró un barril asociado a este código.")
      }
    } catch (err) {
      console.error(err)
      setLookupError("Error al buscar el barril.")
    } finally {
      setLookupLoading(false)
    }
  }

  // -------- Cámara ---------
  const startCamera = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices) {
      setLookupError("Este navegador no soporta acceso a cámara.")
      return
    }

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      setStream(mediaStream)
      setIsCameraOn(true)
    } catch (err) {
      console.error(err)
      setLookupError("No se pudo acceder a la cámara.")
    }
  }

  const stopCamera = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current)
      animationFrameIdRef.current = null
    }

    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
    }
    setStream(null)
    setIsCameraOn(false)
  }

  // Conectar el stream al video y lanzar el loop de escaneo
  useEffect(() => {
    if (!isCameraOn || !stream || !videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")

    // Configurar video
    video.srcObject = stream
    video.setAttribute("playsInline", "true")
    video.muted = true
    video.autoplay = true

    const startPlaying = async () => {
      try {
        await video.play()
      } catch (err) {
        console.error("No se pudo reproducir el video de la cámara:", err)
      }

      const scan = () => {
        if (!isCameraOn || !video.videoWidth || !video.videoHeight) {
          animationFrameIdRef.current = requestAnimationFrame(scan)
          return
        }

        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height)

        if (qrCode?.data) {
          handleCodeDetected(qrCode.data)
          stopCamera()
          return
        }

        animationFrameIdRef.current = requestAnimationFrame(scan)
      }

      animationFrameIdRef.current = requestAnimationFrame(scan)
    }

    startPlaying()

    // Cleanup al desmontar o al apagar la cámara
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current)
        animationFrameIdRef.current = null
      }
    }
  }, [isCameraOn, stream])

  // -------- Subir imagen ---------
  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        setLookupError("No se pudo procesar la imagen.")
        return
      }

      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)

      const qrCode = jsQR(imageData.data, imageData.width, imageData.height)
      if (qrCode?.data) {
        handleCodeDetected(qrCode.data)
      } else {
        setLookupError("No se detectó ningún código QR en la imagen.")
      }
    }

    const reader = new FileReader()
    reader.onload = () => {
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  }

  // -------- Búsqueda manual (texto) ---------
  const handleManualSearch = () => {
    if (!scannedCode) return
    handleCodeDetected(scannedCode)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-3xl font-bold text-accent flex items-center gap-3">
        <span className="text-4xl">📱</span>
        Escanear QR
      </h1>

      {/* Scanner principal */}
      <div className="bg-card rounded-lg p-8 border border-border">
        <div className="flex flex-col items-center justify-center gap-4">
          {/* Área de escaneo */}
          <div className="w-full max-w-md aspect-square bg-secondary rounded-lg border-2 border-dashed border-sidebar-primary flex items-center justify-center relative overflow-hidden mb-4">
            {isCameraOn ? (
              <>
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
              </>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl opacity-20">📷</span>
                </div>
                <div className="absolute inset-x-0 top-1/3 h-1 bg-gradient-to-r from-transparent via-sidebar-primary to-transparent animate-pulse" />
              </>
            )}
          </div>

          <div className="flex gap-3 mb-4">
            {!isCameraOn ? (
              <button
                onClick={startCamera}
                className="px-4 py-2 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90 text-sm"
              >
                Activar cámara
              </button>
            ) : (
              <button
                onClick={stopCamera}
                className="px-4 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 text-sm"
              >
                Detener cámara
              </button>
            )}
          </div>

          <p className="text-muted-foreground text-center mb-2">
            Posiciona el código QR dentro del área o ingresa el código manualmente.
          </p>

          {/* Input para escaneo manual */}
          <div className="w-full max-w-md flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="O pega el código aquí..."
              value={scannedCode}
              onChange={(e) => setScannedCode(e.target.value)}
              className="flex-1 px-4 py-3 bg-secondary border border-border rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-sidebar-primary transition-colors"
            />
            <button
              onClick={handleManualSearch}
              disabled={!scannedCode || lookupLoading}
              className="px-4 py-3 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90 text-sm disabled:opacity-50"
            >
              Buscar barril
            </button>
          </div>
        </div>
      </div>

      {/* Resultado del escaneo / búsqueda */}
      {(lookupLoading || scannedCode || lookupError || foundBarrel) && (
        <div className="bg-card rounded-lg p-6 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Resultado del escaneo
          </h2>

          {lookupLoading && (
            <p className="text-sm text-muted-foreground">
              Buscando barril asociado al código{" "}
              <span className="font-mono">{scannedCode}</span>...
            </p>
          )}

          {!lookupLoading && lookupError && (
            <p className="text-sm text-destructive">{lookupError}</p>
          )}

          {!lookupLoading && foundBarrel && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Código QR</p>
                <p className="font-mono text-foreground break-all">
                  {foundBarrel.codigo_qr}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Barril</p>
                <p className="font-semibold text-foreground">
                  #{foundBarrel.id} - {foundBarrel.tipo_cerveza || "Sin tipo"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Estado</p>
                <p className="font-semibold text-foreground">
                  {foundBarrel.estado_actual || "—"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Ubicación</p>
                <p className="font-semibold text-foreground">
                  {foundBarrel.ubicacion_actual || "—"}
                </p>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-4 py-2 rounded-lg bg-sidebar-primary text-sidebar-primary-foreground hover:opacity-90 text-sm"
                >
                  Ver detalle del barril
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload alternativo */}
      <div className="bg-card rounded-lg p-6 border border-border">
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="text-2xl">📤</span>
          Subir imagen con QR
        </h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="w-full px-4 py-3 bg-secondary border border-border rounded-lg text-foreground file:bg-sidebar-primary file:text-sidebar-primary-foreground file:border-0 file:rounded file:px-4 file:py-2 cursor-pointer"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Sube una foto o captura de pantalla del código QR para detectar el barril asociado.
        </p>
      </div>

      {/* Modal reutilizando el mismo componente de Barriles */}
      <BarrilVistaFullModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        barril={foundBarrel}
      />
    </div>
  )
}
