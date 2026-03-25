/**
 * @file ClinicalRecordRepository.js
 * @description Repositorio de historial clínico (RF4, HU10, HU14, HU16).
 * Patrón Repository + SRP: sólo gestiona CRUD sobre `clinical_records`.
 */
const { getDb } = require('../config/db');

class ClinicalRecordRepository {
  /**
   * Crea un nuevo registro en el historial clínico.
   * @param {{ patient_id, doctor_id, motive, diagnosis, treatment, notes }} data
   * @returns {Promise<number>} ID del nuevo registro
   */
  create({ patient_id, doctor_id, motive, diagnosis, treatment, notes }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT INTO clinical_records (patient_id, doctor_id, motive, diagnosis, treatment, notes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [patient_id, doctor_id, motive || null, diagnosis || null, treatment || null, notes || null],
        function (err) { err ? reject(err) : resolve(this.lastID); }
      );
    });
  }

  /**
   * Obtiene el historial completo de un paciente, incluyendo órdenes asociadas.
   * @param {number} patient_id
   * @returns {Promise<Object[]>}
   */
  findByPatient(patient_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(
        `SELECT cr.*, u.full_name AS doctor_name
         FROM clinical_records cr
         JOIN users u ON cr.doctor_id = u.id
         WHERE cr.patient_id = ?
         ORDER BY cr.visit_date DESC`,
        [patient_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }

  /**
   * Obtiene un registro clínico por ID con sus órdenes.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  findById(id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(
        `SELECT cr.*, u.full_name AS doctor_name, p.full_name AS patient_name
         FROM clinical_records cr
         JOIN users    u ON cr.doctor_id  = u.id
         JOIN patients p ON cr.patient_id = p.id
         WHERE cr.id = ?`,
        [id],
        (err, row) => (err ? reject(err) : resolve(row || null))
      );
    });
  }
}

module.exports = new ClinicalRecordRepository();
