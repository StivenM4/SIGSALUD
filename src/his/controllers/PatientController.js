/**
 * @file PatientController.js
 * @description Controlador de pacientes y citas médicas (RF1, RF3).
 * SRP: sólo gestiona las peticiones HTTP del módulo de pacientes.
 */
const PatientService = require('../services/PatientService');
const AuditService   = require('../services/AuditService');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * POST /api/patients
 * Registra un nuevo paciente.
 */
const registerPatient = asyncHandler(async (req, res) => {
  const patient = await PatientService.registerPatient(req.body, req.user.id);
  await AuditService.log(req, 'CREATE_PATIENT', 'patients', patient.id, `Paciente registrado: ${patient.full_name}`);
  res.status(201).json({ message: 'Paciente registrado exitosamente.', patient });
});

/**
 * GET /api/patients
 * Lista todos los pacientes o busca por query.
 */
const getPatients = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const patients = search
    ? await PatientService.searchPatients(search)
    : await PatientService.getAllPatients();
  res.json({ patients });
});

/**
 * GET /api/patients/:id
 * Obtiene el perfil de un paciente por ID.
 */
const getPatientById = asyncHandler(async (req, res) => {
  const patient = await PatientService.getPatientById(Number(req.params.id));
  res.json({ patient });
});

/**
 * PUT /api/patients/:id
 * Actualiza los datos de un paciente.
 */
const updatePatient = asyncHandler(async (req, res) => {
  const patient = await PatientService.updatePatient(Number(req.params.id), req.body);
  await AuditService.log(req, 'UPDATE_PATIENT', 'patients', patient.id, `Paciente actualizado: ${patient.full_name}`);
  res.json({ message: 'Paciente actualizado correctamente.', patient });
});

/**
 * POST /api/appointments
 * Agenda una nueva cita médica.
 */
const scheduleAppointment = asyncHandler(async (req, res) => {
  const appointment = await PatientService.scheduleAppointment(req.body);
  await AuditService.log(req, 'CREATE_APPOINTMENT', 'appointments', appointment.id, `Cita agendada para paciente ${appointment.patient_id}`);
  res.status(201).json({ message: 'Cita agendada exitosamente.', appointment });
});

/**
 * GET /api/appointments/patient/:patient_id
 * Obtiene las citas de un paciente.
 */
const getAppointmentsByPatient = asyncHandler(async (req, res) => {
  const appointments = await PatientService.getAppointmentsByPatient(Number(req.params.patient_id));
  res.json({ appointments });
});

/**
 * GET /api/appointments/doctor/:doctor_id
 * Obtiene las citas de un médico.
 */
const getAppointmentsByDoctor = asyncHandler(async (req, res) => {
  const appointments = await PatientService.getAppointmentsByDoctor(Number(req.params.doctor_id));
  res.json({ appointments });
});

/**
 * PATCH /api/appointments/:id/status
 * Actualiza el estado de una cita.
 */
const updateAppointmentStatus = asyncHandler(async (req, res) => {
  const { status, notes } = req.body;
  await PatientService.updateAppointmentStatus(Number(req.params.id), status, notes);
  await AuditService.log(req, 'UPDATE_APPOINTMENT', 'appointments', Number(req.params.id), `Estado actualizado a: ${status}`);
  res.json({ message: 'Estado de cita actualizado.' });
});

module.exports = {
  registerPatient, getPatients, getPatientById, updatePatient,
  scheduleAppointment, getAppointmentsByPatient, getAppointmentsByDoctor, updateAppointmentStatus,
};
