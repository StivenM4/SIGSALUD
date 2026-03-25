/**
 * @file appointmentRoutes.js
 * @description Rutas de citas médicas (RF3).
 * ISP: rutas específicas para el dominio de agendamiento.
 */
const express = require('express');
const PatientController = require('../controllers/PatientController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(authenticate);

router.post('/',                          requireRole('ADMINISTRADOR', 'RECEPCIONISTA', 'MEDICO'), PatientController.scheduleAppointment);
router.get('/patient/:patient_id',        requireRole('ADMINISTRADOR', 'RECEPCIONISTA', 'MEDICO'), PatientController.getAppointmentsByPatient);
router.get('/doctor/:doctor_id',          requireRole('ADMINISTRADOR', 'MEDICO'),                  PatientController.getAppointmentsByDoctor);
router.patch('/:id/status',               requireRole('ADMINISTRADOR', 'RECEPCIONISTA', 'MEDICO'), PatientController.updateAppointmentStatus);

module.exports = router;
