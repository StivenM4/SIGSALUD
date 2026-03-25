/**
 * @file ResultRepository.js
 * @description Repositorio de resultados de laboratorio e informes radiológicos
 * recibidos desde LIS y RIS (HU05, HU06, HU07, HU08).
 * SRP: sólo gestiona CRUD sobre `lab_results` y `radiology_reports`.
 */
const { getDb } = require('../config/db');

class ResultRepository {
  // ── Resultados de Laboratorio ────────────────────────────────────────────

  /**
   * Almacena resultados de laboratorio recibidos desde el LIS (HU07).
   * @param {{ lab_order_id, patient_id, results_json, validated_by, report_url, is_critical }} data
   * @returns {Promise<number>} ID del registro creado
   */
  saveLabResult({ lab_order_id, patient_id, results_json, validated_by, report_url, is_critical }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT INTO lab_results (lab_order_id, patient_id, results_json, validated_by, report_url, is_critical)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [lab_order_id, patient_id,
         typeof results_json === 'string' ? results_json : JSON.stringify(results_json),
         validated_by || null, report_url || null, is_critical ? 1 : 0],
        function (err) { err ? reject(err) : resolve(this.lastID); }
      );
    });
  }

  /**
   * Obtiene el historial de resultados de laboratorio de un paciente (HU29, HU34, HU35).
   * @param {number} patient_id
   * @returns {Promise<Object[]>}
   */
  findLabResultsByPatient(patient_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(
        `SELECT lr.*, lo.order_code, lo.tests_requested
         FROM lab_results lr
         JOIN lab_orders lo ON lr.lab_order_id = lo.id
         WHERE lr.patient_id = ?
         ORDER BY lr.received_at DESC`,
        [patient_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }

  /**
   * Obtiene un resultado de laboratorio por ID de orden.
   * @param {number} lab_order_id
   * @returns {Promise<Object|null>}
   */
  findLabResultByOrderId(lab_order_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(
        `SELECT * FROM lab_results WHERE lab_order_id = ? ORDER BY received_at DESC LIMIT 1`,
        [lab_order_id],
        (err, row) => (err ? reject(err) : resolve(row || null))
      );
    });
  }

  // ── Informes Radiológicos ────────────────────────────────────────────────

  /**
   * Almacena un informe radiológico recibido desde el RIS (HU08).
   * @param {{ radiology_order_id, patient_id, radiologist_name, findings, conclusion, image_url }} data
   * @returns {Promise<number>}
   */
  saveRadiologyReport({ radiology_order_id, patient_id, radiologist_name, findings, conclusion, image_url }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT INTO radiology_reports (radiology_order_id, patient_id, radiologist_name, findings, conclusion, image_url)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [radiology_order_id, patient_id, radiologist_name || null,
         findings, conclusion || null, image_url || null],
        function (err) { err ? reject(err) : resolve(this.lastID); }
      );
    });
  }

  /**
   * Obtiene el historial de informes radiológicos de un paciente (HU50).
   * @param {number} patient_id
   * @returns {Promise<Object[]>}
   */
  findRadiologyReportsByPatient(patient_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(
        `SELECT rr.*, ro.order_code, ro.study_type, ro.body_region
         FROM radiology_reports rr
         JOIN radiology_orders ro ON rr.radiology_order_id = ro.id
         WHERE rr.patient_id = ?
         ORDER BY rr.received_at DESC`,
        [patient_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }

  /**
   * Obtiene el informe radiológico por ID de orden.
   * @param {number} radiology_order_id
   * @returns {Promise<Object|null>}
   */
  findRadiologyReportByOrderId(radiology_order_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(
        `SELECT * FROM radiology_reports WHERE radiology_order_id = ? ORDER BY received_at DESC LIMIT 1`,
        [radiology_order_id],
        (err, row) => (err ? reject(err) : resolve(row || null))
      );
    });
  }
}

module.exports = new ResultRepository();
