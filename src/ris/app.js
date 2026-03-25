/**
 * @file app.js  (RIS)
 * @description Punto de entrada del subsistema RIS (Radiology Information System).
 * Arquitectura MVC completamente independiente del HIS y del LIS.
 * Integrado con Orthanc PACS para almacenamiento de imágenes DICOM (RF7).
 */
require('dotenv').config({ path: `${__dirname}/.env` });

const express = require('express');
const cors    = require('cors');

const { initializeDatabase } = require('./config/initDb');
const radiologyRoutes        = require('./routes/radiologyRoutes');

const app = express();

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[RIS] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// ── Inicializar base de datos ─────────────────────────────────────────────────
initializeDatabase();

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', subsystem: 'RIS', timestamp: new Date().toISOString() });
});

// ── Rutas de la API ───────────────────────────────────────────────────────────
app.use('/api', radiologyRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada en RIS.' });
});

// ── Manejador global de errores ───────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  const code = err.statusCode || 500;
  console.error(`[RIS][ERROR] ${code}: ${err.message}`);
  res.status(code).json({ error: err.message || 'Error interno del servidor RIS.' });
});

// ── Iniciar servidor ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`[RIS] Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
