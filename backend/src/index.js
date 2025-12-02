// src/index.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import barrilesRouter from './routes/barriles.js';
import lecturasQrRouter from './routes/lecturasQr.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173' })); // ajusta si cambia el front
app.use(express.json());
app.use(morgan('dev'));

// Rutas
app.get('/', (_req, res) => {
  res.json({ ok: true, message: 'SIGB backend operativo' });
});

app.use('/api/barriles', barrilesRouter);
app.use('/api/lecturas-qr', lecturasQrRouter);

// 404
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Error handler simple
app.use((err, _req, res, _next) => {
  console.error('❌ Error servidor:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

app.listen(PORT, () => {
  console.log(`🚀 SIGB backend escuchando en http://localhost:${PORT}`);
});
