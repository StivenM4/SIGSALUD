/**
 * @file LabResultRepository.js
 * @description Repositorio de resultados de análisis de laboratorio (HU22-HU28, HU35).
 * SRP: sólo gestiona CRUD sobre `lab_results`.
 * DIP: aísla el acceso a datos de la lógica de negocio.
 */
const { getDb } = require('../config/db');

class LabResultRepository {
  /**
   * Guarda resultados de análisis (HU22).
   * @param {{ lab_order_id, results_json }} data
   * @returns {Promise<number>}
   */
  create({ lab_order_id, results_json }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT INTO lab_results (lab_order_id, results_json) VALUES (?, ?)`,
        [lab_order_id,
         typeof results_json === 'string' ? results_json : JSON.stringify(results_json)],
        function (err) { err ? reject(err) : resolve(this.lastID); }
      );
    });
  }

  /** @returns {Promise<Object|null>} */
  findById(id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(`SELECT * FROM lab_results WHERE id = ?`, [id], (err, row) => (err ? reject(err) : resolve(row || null)));
    });
  }

  /** @returns {Promise<Object|null>} */
  findByOrderId(lab_order_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(
        `SELECT * FROM lab_results WHERE lab_order_id = ? ORDER BY created_at DESC LIMIT 1`,
        [lab_order_id],
        (err, row) => (err ? reject(err) : resolve(row || null))
      );
    });
  }

  /**
   * Valida electrónicamente un resultado (HU23, HU24).
   * Marca is_validated = 1 sólo si aún no fue validado (HU28: inmutable tras validación).
   * @param {number} id
   * @param {string} validated_by - Nombre/usuario del bacteriólogo
   * @param {number} [is_critical]
   * @returns {Promise<boolean>} true = validado; false = ya estaba validado
   */
  validate(id, validated_by, is_critical = 0) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      // HU24: sólo valida si is_validated = 0
      db.run(
        `UPDATE lab_results
         SET is_validated = 1, validated_by = ?, validated_at = datetime('now'), is_critical = ?
         WHERE id = ? AND is_validated = 0`,
        [validated_by, is_critical, id],
        function (err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  /**
   * Marca el resultado como enviado al HIS (HU25).
   * @param {number} id
   * @param {string} [report_path]
   * @returns {Promise<void>}
   */
  markSentToHIS(id, report_path) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `UPDATE lab_results SET is_sent_to_his = 1, sent_to_his_at = datetime('now'), report_path = COALESCE(?, report_path) WHERE id = ?`,
        [report_path || null, id],
        (err) => (err ? reject(err) : resolve())
      );
    });
  }

  /** Historial de resultados de un paciente (HU29, HU34, HU35). */
  findByPatient(patient_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(
        `SELECT lr.*, lo.order_code, lo.tests_requested, lo.patient_name
         FROM lab_results lr
         JOIN lab_orders lo ON lr.lab_order_id = lo.id
         WHERE lo.patient_id = ?
         ORDER BY lr.created_at DESC`,
        [patient_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }
}

module.exports = new LabResultRepository();
