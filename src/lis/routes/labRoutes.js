/**
 * @file labRoutes.js  (LIS)
 * @description Rutas REST del subsistema LIS (HU19-HU35).
 * ISP: rutas específicas del dominio de laboratorio.
 * No usa JWT de usuario —el LIS es un servicio independiente.
 * La seguridad inter-sistema se garantiza con x-service-key.
 */
const express       = require('express');
const LabController = require('../controllers/LabController');

const router = express.Router();

// ── Recepción de orden desde HIS (HU19) ──────────────────────────────────────
router.post('/orders/receive',                      LabController.receiveOrder);

// ── Bandeja de órdenes por estado (HU20, HU30) ───────────────────────────────
router.get('/orders',                               LabController.getOrders);

// ── Toma de muestra (HU21, HU33) ─────────────────────────────────────────────
router.post('/orders/:id/sample',                   LabController.registerSample);

// ── Registro de resultados + alertas críticas (HU22, HU32) ───────────────────
router.post('/orders/:id/results',                  LabController.registerResults);

// ── Validación electrónica + envío al HIS (HU23-HU25, HU28, HU31) ────────────
router.post('/results/:result_id/validate',         LabController.validateResult);

// ── Historial de paciente (HU29, HU34, HU35) ─────────────────────────────────
router.get('/patients/:patient_id/history',         LabController.getPatientHistory);

// ── Descarga de reporte (HU27, RF10) ─────────────────────────────────────────
router.get('/reports/:filename',                     LabController.downloadReport);

// ── Auditoría (HU31, HU33) ───────────────────────────────────────────────────
router.get('/audit-logs',                            LabController.getAuditLogs);

module.exports = router;
