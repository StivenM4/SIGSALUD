/**
 * @file PatientService.js
 * @description Servicio de gestión de pacientes y citas (RF1, RF3).
 * SRP: lógica de negocio de pacientes y agendamiento.
 */
const PatientRepository     = require('../repositories/PatientRepository');
const AppointmentRepository = require('../repositories/AppointmentRepository');
const UserRepository        = require('../repositories/UserRepository');

class PatientService {
  /**
   * Registra un nuevo paciente verificando que no exista previamente.
   * @param {Object} data
   * @param {number} createdBy - ID del usuario que crea el paciente
   * @returns {Promise<Object>}
   */
  async registerPatient(data, createdBy) {
    const existing = await PatientRepository.findByDocument(data.document_num);
    if (existing) throw new Error(`Ya existe un paciente con el documento "${data.document_num}".`);

    const id = await PatientRepository.create({ ...data, created_by: createdBy });
    return PatientRepository.findById(id);
  }

  /**
   * Obtiene el perfil completo de un paciente.
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async getPatientById(id) {
    const patient = await PatientRepository.findById(id);
    if (!patient) throw new Error('Paciente no encontrado.');
    return patient;
  }

  /**
   * Busca pacientes por nombre o documento.
   * @param {string} query
   * @returns {Promise<Object[]>}
   */
  searchPatients(query) {
    if (!query || query.trim().length < 2) throw new Error('La búsqueda debe tener al menos 2 caracteres.');
    return PatientRepository.search(query.trim());
  }

  /**
   * Obtiene todos los pacientes.
   * @returns {Promise<Object[]>}
   */
  getAllPatients() {
    return PatientRepository.findAll();
  }

  /**
   * Actualiza los datos de un paciente.
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  async updatePatient(id, data) {
    const existing = await PatientRepository.findById(id);
    if (!existing) throw new Error('Paciente no encontrado.');
    await PatientRepository.update(id, data);
    return PatientRepository.findById(id);
  }

  /**
   * Agenda una nueva cita médica verificando conflictos de horario.
   * @param {{ patient_id, doctor_id, scheduled_at, reason }} data
   * @returns {Promise<Object>}
   */
  async scheduleAppointment({ patient_id, doctor_id, scheduled_at, reason }) {
    // Verificar que el médico exista
    const doctor = await UserRepository.findById(doctor_id);
    if (!doctor) throw new Error('El médico especificado no existe.');

    // Verificar conflicto de agenda (HU39 - aplicado también en HIS para citas)
    const hasConflict = await AppointmentRepository.hasConflict(doctor_id, scheduled_at);
    if (hasConflict) throw new Error('El médico ya tiene una cita agendada en esa fecha y hora.');

    // Verificar que el paciente exista
    const patient = await PatientRepository.findById(patient_id);
    if (!patient) throw new Error('El paciente especificado no existe.');

    const id = await AppointmentRepository.create({ patient_id, doctor_id, scheduled_at, reason });
    return { id, patient_id, doctor_id, scheduled_at, reason, status: 'PENDIENTE' };
  }

  /**
   * Obtiene las citas de un paciente.
   * @param {number} patient_id
   * @returns {Promise<Object[]>}
   */
  getAppointmentsByPatient(patient_id) {
    return AppointmentRepository.findByPatient(patient_id);
  }

  /**
   * Obtiene las citas de un médico.
   * @param {number} doctor_id
   * @returns {Promise<Object[]>}
   */
  getAppointmentsByDoctor(doctor_id) {
    return AppointmentRepository.findByDoctor(doctor_id);
  }

  /**
   * Cancela o actualiza el estado de una cita.
   * @param {number} id
   * @param {string} status
   * @param {string} [notes]
   * @returns {Promise<void>}
   */
  updateAppointmentStatus(id, status, notes) {
    const validStatuses = ['PENDIENTE', 'CONFIRMADA', 'EN_CURSO', 'FINALIZADA', 'CANCELADA'];
    if (!validStatuses.includes(status)) throw new Error(`Estado inválido. Use uno de: ${validStatuses.join(', ')}`);
    return AppointmentRepository.updateStatus(id, status, notes);
  }
}

module.exports = new PatientService();
