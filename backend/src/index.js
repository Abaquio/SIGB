// src/index.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import barrilesRouter from "./routes/barriles.js";
import lecturasQrRouter from "./routes/lecturasQr.js";
import categoriasCervezaRouter from "./routes/categoriasCerveza.js";
import bodegasRouter from "./routes/bodegas.js";
import movimientosRoutes from "./routes/movimientos.js"

const app = express();
const PORT = process.env.PORT || 4000;

// ─────────────────────────────────────────────
// CORS
// ─────────────────────────────────────────────
const allowedOrigins = [
  "http://localhost:5173",          // Front local (Vite)
  "https://sigb-seven.vercel.app",  // Front en producción (Vercel)
];

const corsOptions = {
  origin: (origin, callback) => {
    // Requests sin origin (curl, Postman, etc.) → permitir
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.warn("❌ CORS bloqueado para origen:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(morgan("dev"));

// Ruta raíz
app.get("/", (_req, res) => {
  res.json({ ok: true, message: "SIGB backend operativo" });
});

// ─────────────────────────────────────────────
// RUTAS API
// ─────────────────────────────────────────────
app.use("/api/barriles", barrilesRouter);
app.use("/api/lecturas-qr", lecturasQrRouter);
app.use("/api/categorias-cerveza", categoriasCervezaRouter);
app.use("/api/bodegas", bodegasRouter);
app.use("/api/movimientos", movimientosRoutes)

// 404
app.use((_req, res) => {
  res.status(404).json({ error: "Ruta no encontrada" });
});

// Error handler simple
app.use((err, _req, res, _next) => {
  console.error("❌ Error servidor:", err);
  res.status(500).json({ error: "Error interno del servidor" });
});

app.listen(PORT, () => {
  console.log(`🚀 SIGB backend escuchando en http://localhost:${PORT}`);
});
