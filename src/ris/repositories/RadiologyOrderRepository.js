/**
 * @file RadiologyOrderRepository.js  (RIS)
 * @description Repositorio de órdenes de radiología (HU36, HU37, HU40, HU45, HU48).
 * Repository Pattern + SRP: sólo gestiona CRUD sobre `radiology_orders`.
 */
const { getDb } = require('../config/db');

class RadiologyOrderRepository {
  /**
   * Crea una orden recibida desde el HIS (HU36). INSERT OR IGNORE para idempotencia.
   */
  create({ order_code, his_order_id, patient_id, patient_name, doctor_name, study_type, body_region, priority, notes }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT OR IGNORE INTO radiology_orders
         (order_code, his_order_id, patient_id, patient_name, doctor_name, study_type, body_region, priority, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [order_code, his_order_id || null, patient_id, patient_name,
         doctor_name || null, study_type, body_region || null, priority || 'NORMAL', notes || null],
        function (err) { err ? reject(err) : resolve(this.lastID); }
      );
    });
  }

  /** @returns {Promise<Object|null>} */
  findById(id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(`SELECT * FROM radiology_orders WHERE id = ?`, [id], (err, row) => (err ? reject(err) : resolve(row || null)));
    });
  }

  /** @returns {Promise<Object|null>} */
  findByOrderCode(order_code) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(`SELECT * FROM radiology_orders WHERE order_code = ?`, [order_code], (err, row) => (err ? reject(err) : resolve(row || null)));
    });
  }

  /**
   * Lista órdenes por estado (HU45: pendientes de interpretación).
   * @param {string} [status]
   * @returns {Promise<Object[]>}
   */
  findByStatus(status) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const q = status
        ? `SELECT * FROM radiology_orders WHERE status = ? ORDER BY priority DESC, received_at ASC`
        : `SELECT * FROM radiology_orders ORDER BY received_at DESC`;
      const p = status ? [status] : [];
      db.all(q, p, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  }

  /**
   * Historial de órdenes de un paciente (HU48, HU50).
   * @param {number} patient_id
   * @returns {Promise<Object[]>}
   */
  findByPatient(patient_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(
        `SELECT * FROM radiology_orders WHERE patient_id = ? ORDER BY received_at DESC`,
        [patient_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }

  /**
   * Actualiza el estado de la orden (HU37, HU40, HU44).
   * @param {number} id
   * @param {string} status
   * @param {Object} [extra] - Campos opcionales: confirmed_at, completed_at
   * @returns {Promise<void>}
   */
  updateStatus(id, status, extra = {}) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const sets   = ['status = ?'];
      const params = [status];
      if (extra.confirmed_at) { sets.push('confirmed_at = ?'); params.push(extra.confirmed_at); }
      if (extra.completed_at) { sets.push('completed_at = ?'); params.push(extra.completed_at); }
      params.push(id);
      db.run(`UPDATE radiology_orders SET ${sets.join(', ')} WHERE id = ?`, params,
        (err) => (err ? reject(err) : resolve()));
    });
  }
}

module.exports = new RadiologyOrderRepository();
