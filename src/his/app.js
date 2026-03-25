/**
 * @file app.js
 * @description Punto de entrada principal del subsistema HIS (Hospital Information System).
 * Integra la arquitectura MVC con las capas de rutas, middlewares y base de datos.
 */
require('dotenv').config({ path: `${__dirname}/.env` });

const express = require('express');
const cors    = require('cors');

const { initializeDatabase } = require('./config/initDb');
const { errorHandler }       = require('./middlewares/errorHandler');

// Rutas
const authRoutes        = require('./routes/authRoutes');
const userRoutes        = require('./routes/userRoutes');
const patientRoutes     = require('./routes/patientRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const clinicalRoutes    = require('./routes/clinicalRoutes');

const app = express();

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Logging básico de requests
app.use((req, _res, next) => {
  console.log(`[HIS] ${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});

// ── Inicializar base de datos ─────────────────────────────────────────────────
initializeDatabase();

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', subsystem: 'HIS', timestamp: new Date().toISOString() });
});

// ── Rutas de la API ───────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/patients',     patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/clinical',     clinicalRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada.' });
});

// ── Manejador global de errores ───────────────────────────────────────────────
app.use(errorHandler);

// ── Iniciar servidor ──────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[HIS] Servidor corriendo en http://0.0.0.0:${PORT}`);
});

module.exports = app;
