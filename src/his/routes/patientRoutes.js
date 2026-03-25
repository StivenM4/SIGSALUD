/**
 * @file patientRoutes.js
 * @description Rutas de pacientes y citas médicas (RF1, RF3).
 * ISP: rutas específicas para el dominio de pacientes.
 */
const express = require('express');
const PatientController = require('../controllers/PatientController');
const { authenticate, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Pacientes
router.post('/',          requireRole('ADMINISTRADOR', 'RECEPCIONISTA', 'MEDICO'), PatientController.registerPatient);
router.get('/',           requireRole('ADMINISTRADOR', 'RECEPCIONISTA', 'MEDICO'), PatientController.getPatients);
router.get('/:id',        requireRole('ADMINISTRADOR', 'RECEPCIONISTA', 'MEDICO'), PatientController.getPatientById);
router.put('/:id',        requireRole('ADMINISTRADOR', 'RECEPCIONISTA'),           PatientController.updatePatient);

module.exports = router;
