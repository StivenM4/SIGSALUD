/**
 * @file LabController.js  (LIS)
 * @description Controlador del subsistema LIS (HU19-HU35).
 * SRP: sólo gestiona peticiones HTTP del módulo de laboratorio.
 */
const LabService    = require('../services/LabService');
const AuditService  = require('../services/AuditService');
const path          = require('path');
const fs            = require('fs');

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ── Recepción de órdenes desde HIS (HU19) ────────────────────────────────────

/**
 * POST /api/orders/receive
 * Recibe una orden de laboratorio enviada automáticamente por el HIS.
 * Protegida por x-service-key inter-sistema.
 */
const receiveOrder = asyncHandler(async (req, res) => {
  const serviceKey = req.headers['x-service-key'];
  if (serviceKey !== (process.env.INTERNAL_SERVICE_KEY || 'sigsalud-internal')) {
    return res.status(401).json({ error: 'Clave de servicio inválida.' });
  }
  const order = await LabService.receiveOrder(req.body);
  res.status(201).json({ message: 'Orden de laboratorio recibida.', order });
});

// ── Bandeja de órdenes (HU20, HU30) ──────────────────────────────────────────

/**
 * GET /api/orders?status=RECIBIDA
 * Lista las órdenes de laboratorio, filtradas por estado.
 */
const getOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const orders = await LabService.getOrdersByStatus(status);
  res.json({ orders });
});

// ── Registro de toma de muestra (HU21, HU33) ─────────────────────────────────

/**
 * POST /api/orders/:id/sample
 * Registra la toma de muestra para una orden específica.
 */
const registerSample = asyncHandler(async (req, res) => {
  const lab_order_id = Number(req.params.id);
  const result = await LabService.registerSample({ lab_order_id, ...req.body });
  res.status(201).json({ message: 'Toma de muestra registrada.', ...result });
});

// ── Registro de resultados del analizador (HU22, HU32) ───────────────────────

/**
 * POST /api/orders/:id/results
 * Registra los resultados del analizador clínico para una orden.
 * Evalúa automáticamente valores críticos (HU32).
 */
const registerResults = asyncHandler(async (req, res) => {
  const lab_order_id = Number(req.params.id);
  const { results, technician } = req.body;

  if (!results || !technician) {
    return res.status(400).json({ error: 'Campos requeridos: results, technician.' });
  }

  const data = await LabService.registerResults({ lab_order_id, results, technician });
  res.status(201).json({
    message: data.is_critical
      ? '⚠️ Resultados registrados con VALORES CRÍTICOS detectados.'
      : 'Resultados registrados exitosamente.',
    ...data,
  });
});

// ── Validación electrónica (HU23, HU24, HU25, HU28, HU31) ───────────────────

/**
 * POST /api/results/:result_id/validate
 * Valida electrónicamente los resultados. Inmutable tras validación (HU28).
 * Genera PDF y notifica al HIS (HU25).
 */
const validateResult = asyncHandler(async (req, res) => {
  const result_id    = Number(req.params.result_id);
  const { bacteriologist, lab_order_id } = req.body;

  if (!bacteriologist) {
    return res.status(400).json({ error: 'El campo bacteriologist es requerido.' });
  }

  const data = await LabService.validateResult({ result_id, bacteriologist, lab_order_id });
  res.json({
    message: data.is_critical
      ? '✅ Resultado validado y enviado al HIS. ⚠️ Contiene VALORES CRÍTICOS.'
      : '✅ Resultado validado y enviado al HIS.',
    ...data,
  });
});

// ── Historial del paciente (HU29, HU34, HU35) ────────────────────────────────

/**
 * GET /api/patients/:patient_id/history
 * Obtiene el historial completo de órdenes y resultados de un paciente.
 */
const getPatientHistory = asyncHandler(async (req, res) => {
  const history = await LabService.getPatientHistory(Number(req.params.patient_id));
  res.json(history);
});

// ── Descarga de reporte (HU27, RF10) ─────────────────────────────────────────

/**
 * GET /api/reports/:filename
 * Descarga un reporte de laboratorio generado.
 */
const downloadReport = asyncHandler(async (req, res) => {
  const filepath = path.resolve(__dirname, '..', 'reports', req.params.filename);
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: 'Reporte no encontrado.' });
  }
  res.download(filepath);
});

// ── Auditoría (HU31, HU33) ───────────────────────────────────────────────────

/**
 * GET /api/audit-logs
 * Obtiene el registro de auditoría del LIS.
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const { entity, entity_id, limit } = req.query;
  const logs = await LabService.getAuditLogs({ entity, entity_id: entity_id ? Number(entity_id) : undefined, limit: limit ? Number(limit) : 200 });
  res.json({ logs });
});

module.exports = {
  receiveOrder, getOrders, registerSample, registerResults,
  validateResult, getPatientHistory, downloadReport, getAuditLogs,
};
