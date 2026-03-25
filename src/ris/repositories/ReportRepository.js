/**
 * @file ReportRepository.js  (RIS)
 * @description Repositorio de informes radiológicos (HU41-HU44, HU50).
 * SRP: sólo gestiona CRUD sobre `radiology_reports`.
 * DIP: aísla el acceso a datos de la lógica de negocio.
 */
const { getDb } = require('../config/db');

class ReportRepository {
  /**
   * Crea un borrador de informe radiológico (HU41).
   * @param {{ order_id, radiologist, findings, conclusion, image_url }} data
   * @returns {Promise<number>}
   */
  create({ order_id, radiologist, findings, conclusion, image_url }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT INTO radiology_reports (order_id, radiologist, findings, conclusion, image_url)
         VALUES (?, ?, ?, ?, ?)`,
        [order_id, radiologist, findings, conclusion || null, image_url || null],
        function (err) { err ? reject(err) : resolve(this.lastID); }
      );
    });
  }

  /** @returns {Promise<Object|null>} */
  findById(id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(`SELECT * FROM radiology_reports WHERE id = ?`, [id], (err, row) => (err ? reject(err) : resolve(row || null)));
    });
  }

  /** @returns {Promise<Object|null>} */
  findByOrder(order_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(
        `SELECT * FROM radiology_reports WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`,
        [order_id],
        (err, row) => (err ? reject(err) : resolve(row || null))
      );
    });
  }

  /**
   * Lista los informes de un radiólogo pendientes de validación (HU45).
   * @param {string} radiologist
   * @returns {Promise<Object[]>}
   */
  findPendingByRadiologist(radiologist) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(
        `SELECT rr.*, ro.order_code, ro.patient_name, ro.study_type
         FROM radiology_reports rr
         JOIN radiology_orders ro ON rr.order_id = ro.id
         WHERE rr.radiologist = ? AND rr.is_validated = 0
         ORDER BY rr.created_at ASC`,
        [radiologist],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }

  /**
   * Valida electrónicamente el informe (HU42, HU43).
   * Sólo si aún no fue validado — inmutable tras validación.
   * @param {number} id
   * @param {string} radiologist
   * @returns {Promise<boolean>}
   */
  validate(id, radiologist) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `UPDATE radiology_reports
         SET is_validated = 1, validated_at = datetime('now')
         WHERE id = ? AND radiologist = ? AND is_validated = 0`,
        [id, radiologist],
        function (err) {
          if (err) return reject(err);
          resolve(this.changes > 0);
        }
      );
    });
  }

  /**
   * Marca el informe como enviado al HIS (HU44).
   * @param {number} id
   * @returns {Promise<void>}
   */
  markSentToHIS(id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `UPDATE radiology_reports SET is_sent_to_his = 1, sent_to_his_at = datetime('now') WHERE id = ?`,
        [id], (err) => (err ? reject(err) : resolve())
      );
    });
  }

  /**
   * Historial de informes de un paciente (HU48, HU50).
   * @param {number} patient_id
   * @returns {Promise<Object[]>}
   */
  findByPatient(patient_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(
        `SELECT rr.*, ro.order_code, ro.study_type, ro.body_region, ro.patient_name
         FROM radiology_reports rr
         JOIN radiology_orders ro ON rr.order_id = ro.id
         WHERE ro.patient_id = ?
         ORDER BY rr.created_at DESC`,
        [patient_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }
}

module.exports = new ReportRepository();
