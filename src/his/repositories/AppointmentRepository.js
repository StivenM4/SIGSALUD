/**
 * @file AppointmentRepository.js
 * @description Repositorio de citas médicas (RF3).
 * SRP: sólo gestiona CRUD sobre la tabla `appointments`.
 */
const { getDb } = require('../config/db');

class AppointmentRepository {
  /**
   * Crea una nueva cita médica.
   * @param {{ patient_id, doctor_id, scheduled_at, reason }} data
   * @returns {Promise<number>}
   */
  create({ patient_id, doctor_id, scheduled_at, reason }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT INTO appointments (patient_id, doctor_id, scheduled_at, reason) VALUES (?, ?, ?, ?)`,
        [patient_id, doctor_id, scheduled_at, reason],
        function (err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

  /**
   * Verifica si ya existe una cita para el médico en esa fecha y hora.
   * @param {number} doctor_id
   * @param {string} scheduled_at
   * @returns {Promise<boolean>}
   */
  hasConflict(doctor_id, scheduled_at) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(
        `SELECT id FROM appointments WHERE doctor_id = ? AND scheduled_at = ? AND status != 'CANCELADA'`,
        [doctor_id, scheduled_at],
        (err, row) => (err ? reject(err) : resolve(!!row))
      );
    });
  }

  /**
   * Obtiene las citas de un paciente.
   * @param {number} patient_id
   * @returns {Promise<Object[]>}
   */
  findByPatient(patient_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(
        `SELECT a.*, p.full_name AS patient_name, u.full_name AS doctor_name
         FROM appointments a
         JOIN patients p ON a.patient_id = p.id
         JOIN users u    ON a.doctor_id  = u.id
         WHERE a.patient_id = ?
         ORDER BY a.scheduled_at DESC`,
        [patient_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }

  /**
   * Obtiene las citas de un médico.
   * @param {number} doctor_id
   * @returns {Promise<Object[]>}
   */
  findByDoctor(doctor_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(
        `SELECT a.*, p.full_name AS patient_name
         FROM appointments a
         JOIN patients p ON a.patient_id = p.id
         WHERE a.doctor_id = ?
         ORDER BY a.scheduled_at ASC`,
        [doctor_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }

  /**
   * Actualiza el estado de una cita.
   * @param {number} id
   * @param {string} status
   * @param {string} [notes]
   * @returns {Promise<void>}
   */
  updateStatus(id, status, notes) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `UPDATE appointments SET status = ?, notes = ? WHERE id = ?`,
        [status, notes || null, id],
        (err) => (err ? reject(err) : resolve())
      );
    });
  }
}

module.exports = new AppointmentRepository();
