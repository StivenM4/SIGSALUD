/**
 * @file RadiologyController.js  (RIS)
 * @description Controlador del subsistema RIS (HU36-HU50).
 * SRP: sólo gestiona peticiones HTTP del módulo de radiología.
 */
const RadiologyService = require('../services/RadiologyService');

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// ── Recepción de orden desde HIS (HU36) ──────────────────────────────────────

/**
 * POST /api/orders/receive
 * Recibe una orden radiológica del HIS. Protegida por x-service-key.
 */
const receiveOrder = asyncHandler(async (req, res) => {
  const serviceKey = req.headers['x-service-key'];
  if (serviceKey !== (process.env.INTERNAL_SERVICE_KEY || 'sigsalud-internal')) {
    return res.status(401).json({ error: 'Clave de servicio inválida.' });
  }
  const order = await RadiologyService.receiveOrder(req.body);
  res.status(201).json({ message: 'Orden radiológica recibida.', order });
});

// ── Listado de órdenes por estado ─────────────────────────────────────────────

/**
 * GET /api/orders?status=RECIBIDA
 * Lista órdenes filtradas por estado. Sin estado devuelve todas.
 */
const getOrders = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const orders = await RadiologyService.getOrdersByStatus(status);
  res.json({ orders });
});

// ── Estudios pendientes de interpretación (HU45) ──────────────────────────────

/**
 * GET /api/orders/pending-interpretation
 * Lista órdenes en estado EN_PROCESO pendientes de informe.
 */
const getPendingInterpretation = asyncHandler(async (_req, res) => {
  const orders = await RadiologyService.getPendingForInterpretation();
  res.json({ orders });
});

// ── Agendamiento de estudio (HU38, HU39) ─────────────────────────────────────

/**
 * POST /api/orders/:id/schedule
 * Programa el estudio verificando conflictos de sala (HU39).
 */
const scheduleStudy = asyncHandler(async (req, res) => {
  const order_id = Number(req.params.id);
  const result = await RadiologyService.scheduleStudy({ order_id, ...req.body });
  res.status(201).json({ message: 'Estudio programado sin conflictos.', ...result });
});

/**
 * GET /api/schedule
 * Obtiene la agenda de una sala/fecha. Query: ?room=&date=
 */
const getSchedule = asyncHandler(async (req, res) => {
  const { room, date } = req.query;
  const schedule = await RadiologyService.getSchedule(room, date);
  res.json({ schedule });
});

// ── Registro de estudio realizado + Orthanc (HU40, HU46) ─────────────────────

/**
 * POST /api/orders/:id/perform
 * Registra la realización del estudio e integra con Orthanc PACS.
 */
const performStudy = asyncHandler(async (req, res) => {
  const order_id = Number(req.params.id);
  const result = await RadiologyService.performStudy({ order_id, ...req.body });
  res.status(201).json({ message: 'Estudio realizado y registrado en PACS.', ...result });
});

// ── Redacción de informe diagnóstico (HU41, HU47) ────────────────────────────

/**
 * POST /api/orders/:id/report
 * El radiólogo redacta el informe diagnóstico del estudio.
 */
const createReport = asyncHandler(async (req, res) => {
  const order_id = Number(req.params.id);
  const report = await RadiologyService.createReport({ order_id, ...req.body });
  res.status(201).json({ message: 'Informe diagnóstico creado.', report });
});

/**
 * GET /api/reports/pending
 * Lista los informes pendientes de validación de un radiólogo. Query: ?radiologist=
 */
const getPendingReports = asyncHandler(async (req, res) => {
  const { radiologist } = req.query;
  if (!radiologist) return res.status(400).json({ error: 'Query param radiologist requerido.' });
  const reports = await RadiologyService.getPendingReports(radiologist);
  res.json({ reports });
});

// ── Validación electrónica del informe (HU42, HU43, HU44) ────────────────────

/**
 * POST /api/reports/:report_id/validate
 * Valida electrónicamente el informe y lo envía al HIS (HU44).
 */
const validateReport = asyncHandler(async (req, res) => {
  const report_id = Number(req.params.report_id);
  const { radiologist } = req.body;
  if (!radiologist) return res.status(400).json({ error: 'Campo radiologist requerido.' });
  const result = await RadiologyService.validateReport({ report_id, radiologist });
  res.json({ message: '✅ Informe validado y enviado al HIS.', ...result });
});

// ── Historial del paciente (RF12, HU48, HU50) ─────────────────────────────────

/**
 * GET /api/patients/:patient_id/history
 * Obtiene historial completo de estudios e informes de un paciente.
 */
const getPatientHistory = asyncHandler(async (req, res) => {
  const history = await RadiologyService.getPatientHistory(Number(req.params.patient_id));
  res.json(history);
});

// ── Auditoría (HU49) ──────────────────────────────────────────────────────────

/**
 * GET /api/audit-logs
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const { entity, entity_id, limit } = req.query;
  const logs = await RadiologyService.getAuditLogs({
    entity,
    entity_id: entity_id ? Number(entity_id) : undefined,
    limit:     limit ? Number(limit) : 200,
  });
  res.json({ logs });
});

module.exports = {
  receiveOrder, getOrders, getPendingInterpretation,
  scheduleStudy, getSchedule, performStudy,
  createReport, getPendingReports, validateReport,
  getPatientHistory, getAuditLogs,
};
