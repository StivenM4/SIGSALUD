/**
 * @file app.js  (LIS)
 * @description Punto de entrada del subsistema LIS (Laboratory Information System).
 * Arquitectura MVC independiente del HIS y el RIS (alta disponibilidad y tolerancia a fallos).
 */
require('dotenv').config({ path: `${__dirname}/.env` });

const express = require('express');
const cors    = require('cors');

const { initializeDatabase } = require('./config/initDb');
const labRoutes              = require('./routes/labRoutes');

const app = express();

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Logging básico
app.use((req, _res, next) => {
  console.log(`[LIS] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// ── Inicializar base de datos ─────────────────────────────────────────────────
initializeDatabase();

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', subsystem: 'LIS', timestamp: new Date().toISOString() });
});

// ── Rutas de la API ───────────────────────────────────────────────────────────
app.use('/api', labRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada en LIS.' });
});

// ── Manejador global de errores ───────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  const code = err.statusCode || 500;
  console.error(`[LIS][ERROR] ${code}: ${err.message}`);
  res.status(code).json({ error: err.message || 'Error interno del servidor LIS.' });
});

// ── Iniciar servidor ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`[LIS] Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
