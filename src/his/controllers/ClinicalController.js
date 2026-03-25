/**
 * @file ClinicalController.js
 * @description Controlador del módulo clínico HIS Paso 5:
 * historial, órdenes diagnósticas, webhooks de resultados y notificaciones.
 * SRP: sólo gestiona peticiones HTTP del módulo clínico.
 */
const ClinicalService     = require('../services/ClinicalService');
const NotificationService = require('../services/NotificationService');
const AuditService        = require('../services/AuditService');
const { asyncHandler }    = require('../middlewares/errorHandler');

// ── Historial Clínico ─────────────────────────────────────────────────────────

/**
 * POST /api/clinical/records
 * Crea un registro en el historial clínico del paciente.
 */
const createRecord = asyncHandler(async (req, res) => {
  const record = await ClinicalService.createClinicalRecord(
    { ...req.body, doctor_id: req.user.id },
    req
  );
  res.status(201).json({ message: 'Registro clínico creado.', record });
});

/**
 * GET /api/clinical/records/patient/:patient_id
 * Obtiene el historial clínico completo de un paciente (HU10, HU14, HU16).
 */
const getPatientHistory = asyncHandler(async (req, res) => {
  const history = await ClinicalService.getPatientHistory(Number(req.params.patient_id));
  res.json(history);
});

// ── Órdenes de Laboratorio ────────────────────────────────────────────────────

/**
 * POST /api/clinical/orders/lab
 * Crea una orden de laboratorio y la envía al LIS (HU01, HU03, HU17).
 */
const createLabOrder = asyncHandler(async (req, res) => {
  const order = await ClinicalService.createLabOrder(
    { ...req.body, doctor_id: req.user.id },
    req
  );
  res.status(201).json({ message: 'Orden de laboratorio creada y enviada al LIS.', order });
});

/**
 * POST /api/clinical/orders/radiology
 * Crea una orden radiológica y la envía al RIS (HU02, HU03, HU17).
 */
const createRadiologyOrder = asyncHandler(async (req, res) => {
  const order = await ClinicalService.createRadiologyOrder(
    { ...req.body, doctor_id: req.user.id },
    req
  );
  res.status(201).json({ message: 'Orden radiológica creada y enviada al RIS.', order });
});

/**
 * GET /api/clinical/orders/status/:patient_id
 * Consulta el estado de todas las órdenes de un paciente (HU04, HU13).
 */
const getOrderStatus = asyncHandler(async (req, res) => {
  const status = await ClinicalService.getOrderStatus(Number(req.params.patient_id));
  res.json(status);
});

// ── Webhooks recepción de resultados (llamados por LIS y RIS) ─────────────────

/**
 * POST /api/clinical/webhooks/lis-result
 * Recibe resultados de laboratorio enviados por el LIS (HU05, HU07, HU09).
 * No requiere autenticación de usuario —usa una clave de servicio inter-sistema.
 */
const receiveLisResult = asyncHandler(async (req, res) => {
  const serviceKey = req.headers['x-service-key'];
  if (serviceKey !== (process.env.INTERNAL_SERVICE_KEY || 'sigsalud-internal')) {
    return res.status(401).json({ error: 'Clave de servicio inválida.' });
  }
  const result = await ClinicalService.receiveLisResult(req.body);
  res.json({ message: 'Resultado de laboratorio registrado en HIS.', ...result });
});

/**
 * POST /api/clinical/webhooks/ris-report
 * Recibe informes radiológicos enviados por el RIS (HU06, HU08, HU09).
 */
const receiveRisReport = asyncHandler(async (req, res) => {
  const serviceKey = req.headers['x-service-key'];
  if (serviceKey !== (process.env.INTERNAL_SERVICE_KEY || 'sigsalud-internal')) {
    return res.status(401).json({ error: 'Clave de servicio inválida.' });
  }
  const report = await ClinicalService.receiveRisReport(req.body);
  res.json({ message: 'Informe radiológico registrado en HIS.', ...report });
});

// ── Resultados y Notificaciones ───────────────────────────────────────────────

/**
 * GET /api/clinical/results/lab/:patient_id
 * Obtiene el historial de resultados de laboratorio de un paciente (HU05, HU29).
 */
const getLabResults = asyncHandler(async (req, res) => {
  const results = await ClinicalService.getLabResultsHistory(Number(req.params.patient_id));
  res.json({ results });
});

/**
 * GET /api/clinical/results/radiology/:patient_id
 * Obtiene el historial de informes radiológicos de un paciente (HU06, HU50).
 */
const getRadiologyReports = asyncHandler(async (req, res) => {
  const reports = await ClinicalService.getRadiologyReportsHistory(Number(req.params.patient_id));
  res.json({ reports });
});

/**
 * GET /api/clinical/notifications
 * Obtiene las notificaciones del usuario autenticado (HU09).
 */
const getNotifications = asyncHandler(async (req, res) => {
  const { unread_only } = req.query;
  const notifications = await NotificationService.getNotifications(req.user.id, unread_only === 'true');
  const unread_count  = await NotificationService.countUnread(req.user.id);
  res.json({ notifications, unread_count });
});

/**
 * PATCH /api/clinical/notifications/read
 * Marca una o todas las notificaciones como leídas (HU09).
 */
const markNotificationsRead = asyncHandler(async (req, res) => {
  const { notification_id } = req.body;
  await NotificationService.markAsRead(req.user.id, notification_id || null);
  res.json({ message: 'Notificaciones marcadas como leídas.' });
});

module.exports = {
  createRecord, getPatientHistory,
  createLabOrder, createRadiologyOrder, getOrderStatus,
  receiveLisResult, receiveRisReport,
  getLabResults, getRadiologyReports,
  getNotifications, markNotificationsRead,
};
