/**
 * @file clinicalRoutes.js
 * @description Rutas del módulo clínico HIS (RF4, RF5, RF9, RF10, HU01-HU16).
 * ISP: rutas específicas del dominio clínico, separadas de auth/users/patients.
 */
const express = require('express');
const ClinicalController = require('../controllers/ClinicalController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// ── Webhooks inter-sistema: sin autenticación JWT (usan service key) ──────────
router.post('/webhooks/lis-result',  ClinicalController.receiveLisResult);
router.post('/webhooks/ris-report',  ClinicalController.receiveRisReport);

// ── Todas las rutas siguientes requieren autenticación ────────────────────────
router.use(authenticate);

// ── Historial Clínico ─────────────────────────────────────────────────────────
router.post('/records',
  requireRole('MEDICO', 'ADMINISTRADOR'),
  ClinicalController.createRecord);

router.get('/records/patient/:patient_id',
  requireRole('MEDICO', 'ADMINISTRADOR', 'RECEPCIONISTA'),
  ClinicalController.getPatientHistory);

// ── Órdenes Diagnósticas ──────────────────────────────────────────────────────
router.post('/orders/lab',
  requireRole('MEDICO', 'ADMINISTRADOR'),
  ClinicalController.createLabOrder);

router.post('/orders/radiology',
  requireRole('MEDICO', 'ADMINISTRADOR'),
  ClinicalController.createRadiologyOrder);

router.get('/orders/status/:patient_id',
  requireRole('MEDICO', 'ADMINISTRADOR'),
  ClinicalController.getOrderStatus);

// ── Resultados ────────────────────────────────────────────────────────────────
router.get('/results/lab/:patient_id',
  requireRole('MEDICO', 'ADMINISTRADOR'),
  ClinicalController.getLabResults);

router.get('/results/radiology/:patient_id',
  requireRole('MEDICO', 'ADMINISTRADOR'),
  ClinicalController.getRadiologyReports);

// ── Notificaciones (HU09) ─────────────────────────────────────────────────────
router.get('/notifications',
  ClinicalController.getNotifications);

router.patch('/notifications/read',
  ClinicalController.markNotificationsRead);

module.exports = router;
