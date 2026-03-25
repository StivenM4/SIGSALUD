/**
 * @file LabOrderRepository.js
 * @description Repositorio de órdenes de laboratorio del LIS (HU19, HU20, HU26, HU30).
 * Repository Pattern + SRP: sólo gestiona CRUD sobre `lab_orders`.
 */
const { getDb } = require('../config/db');

class LabOrderRepository {
  /**
   * Guarda una orden recibida desde el HIS (HU19).
   * @param {{ order_code, his_order_id, patient_id, patient_name, doctor_name, tests_requested, priority, notes }} data
   * @returns {Promise<number>}
   */
  create({ order_code, his_order_id, patient_id, patient_name, doctor_name, tests_requested, priority, notes }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT OR IGNORE INTO lab_orders (order_code, his_order_id, patient_id, patient_name, doctor_name, tests_requested, priority, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [order_code, his_order_id || null, patient_id, patient_name,
         doctor_name || null,
         typeof tests_requested === 'string' ? tests_requested : JSON.stringify(tests_requested),
         priority || 'NORMAL', notes || null],
        function (err) { err ? reject(err) : resolve(this.lastID); }
      );
    });
  }

  /**
   * Obtiene todas las órdenes por estado (HU20, HU30).
   * @param {string} [status]
   * @returns {Promise<Object[]>}
   */
  findByStatus(status) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const q = status
        ? `SELECT * FROM lab_orders WHERE status = ? ORDER BY priority DESC, received_at ASC`
        : `SELECT * FROM lab_orders ORDER BY received_at DESC`;
      const p = status ? [status] : [];
      db.all(q, p, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  }

  /** @returns {Promise<Object|null>} */
  findById(id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(`SELECT * FROM lab_orders WHERE id = ?`, [id], (err, row) => (err ? reject(err) : resolve(row || null)));
    });
  }

  /** @returns {Promise<Object|null>} */
  findByOrderCode(order_code) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(`SELECT * FROM lab_orders WHERE order_code = ?`, [order_code], (err, row) => (err ? reject(err) : resolve(row || null)));
    });
  }

  /**
   * Actualiza el estado de una orden (HU26).
   * @param {number} id
   * @param {string} status
   * @param {string} [completed_at]
   * @returns {Promise<void>}
   */
  updateStatus(id, status, completed_at) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `UPDATE lab_orders SET status = ?, completed_at = COALESCE(?, completed_at) WHERE id = ?`,
        [status, completed_at || null, id],
        (err) => (err ? reject(err) : resolve())
      );
    });
  }

  /**
   * Obtiene historial de órdenes por paciente (HU29, HU34, HU35).
   * @param {number} patient_id
   * @returns {Promise<Object[]>}
   */
  findByPatient(patient_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(
        `SELECT * FROM lab_orders WHERE patient_id = ? ORDER BY received_at DESC`,
        [patient_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }
}

module.exports = new LabOrderRepository();
