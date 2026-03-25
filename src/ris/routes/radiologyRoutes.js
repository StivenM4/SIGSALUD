/**
 * @file radiologyRoutes.js  (RIS)
 * @description Rutas REST del subsistema RIS (HU36-HU50).
 * ISP: rutas específicas del dominio de radiología, separadas de otros subsistemas.
 */
const express             = require('express');
const RadiologyController = require('../controllers/RadiologyController');

const router = express.Router();

// ── Recepción de orden desde HIS (HU36) ──────────────────────────────────────
router.post('/orders/receive',                   RadiologyController.receiveOrder);

// ── Listado de órdenes ────────────────────────────────────────────────────────
router.get('/orders',                            RadiologyController.getOrders);
router.get('/orders/pending-interpretation',     RadiologyController.getPendingInterpretation);

// ── Agendamiento de estudios (HU38, HU39) ────────────────────────────────────
router.post('/orders/:id/schedule',              RadiologyController.scheduleStudy);
router.get('/schedule',                          RadiologyController.getSchedule);

// ── Registro de estudio + PACS Orthanc (HU40, HU46) ─────────────────────────
router.post('/orders/:id/perform',               RadiologyController.performStudy);

// ── Informes diagnósticos (HU41-HU44, HU47) ──────────────────────────────────
router.post('/orders/:id/report',                RadiologyController.createReport);
router.get('/reports/pending',                   RadiologyController.getPendingReports);
router.post('/reports/:report_id/validate',      RadiologyController.validateReport);

// ── Historial del paciente (RF12, HU48, HU50) ────────────────────────────────
router.get('/patients/:patient_id/history',      RadiologyController.getPatientHistory);

// ── Auditoría (HU49) ─────────────────────────────────────────────────────────
router.get('/audit-logs',                        RadiologyController.getAuditLogs);

module.exports = router;
