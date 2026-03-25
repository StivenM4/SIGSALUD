/**
 * @file OrderRepository.js
 * @description Repositorio de órdenes de laboratorio y radiología (HU01, HU02, HU04, HU10, HU15-17).
 * SRP: sólo gestiona CRUD sobre `lab_orders` y `radiology_orders`.
 * Repository Pattern: aísla la lógica de acceso a datos.
 */
const { getDb } = require('../config/db');
const crypto = require('crypto');

/**
 * Genera un código único de orden con prefijo.
 * @param {string} prefix - 'LAB' ó 'RAD'
 * @returns {string}
 */
const generateOrderCode = (prefix) =>
  `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

class OrderRepository {
  // ── Órdenes de Laboratorio ───────────────────────────────────────────────

  /**
   * Crea una orden de laboratorio con código único (HU17).
   * @param {{ patient_id, doctor_id, record_id, tests_requested, priority, notes }} data
   * @returns {Promise<{id: number, order_code: string}>}
   */
  createLabOrder({ patient_id, doctor_id, record_id, tests_requested, priority, notes }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const order_code = generateOrderCode('LAB');
      db.run(
        `INSERT INTO lab_orders (order_code, patient_id, doctor_id, record_id, tests_requested, priority, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [order_code, patient_id, doctor_id, record_id || null,
         JSON.stringify(tests_requested), priority || 'NORMAL', notes || null],
        function (err) { err ? reject(err) : resolve({ id: this.lastID, order_code }); }
      );
    });
  }

  /**
   * Obtiene una orden de laboratorio por ID.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  findLabOrderById(id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(
        `SELECT lo.*, u.full_name AS doctor_name, p.full_name AS patient_name
         FROM lab_orders lo
         JOIN users u    ON lo.doctor_id  = u.id
         JOIN patients p ON lo.patient_id = p.id
         WHERE lo.id = ?`,
        [id],
        (err, row) => (err ? reject(err) : resolve(row || null))
      );
    });
  }

  /**
   * Lista las órdenes de laboratorio de un paciente.
   * @param {number} patient_id
   * @returns {Promise<Object[]>}
   */
  findLabOrdersByPatient(patient_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(
        `SELECT lo.*, u.full_name AS doctor_name
         FROM lab_orders lo
         JOIN users u ON lo.doctor_id = u.id
         WHERE lo.patient_id = ?
         ORDER BY lo.created_at DESC`,
        [patient_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }

  /**
   * Lista órdenes de laboratorio pendientes de envío al LIS o por estado.
   * @param {string} [status]
   * @returns {Promise<Object[]>}
   */
  findLabOrdersByStatus(status) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const query = status
        ? `SELECT lo.*, u.full_name AS doctor_name, p.full_name AS patient_name
           FROM lab_orders lo
           JOIN users u    ON lo.doctor_id  = u.id
           JOIN patients p ON lo.patient_id = p.id
           WHERE lo.status = ?
           ORDER BY lo.created_at ASC`
        : `SELECT lo.*, u.full_name AS doctor_name, p.full_name AS patient_name
           FROM lab_orders lo
           JOIN users u    ON lo.doctor_id  = u.id
           JOIN patients p ON lo.patient_id = p.id
           ORDER BY lo.created_at DESC`;
      const params = status ? [status] : [];
      db.all(query, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  }

  /**
   * Actualiza el estado de una orden de laboratorio (HU04, HU15).
   * @param {number} id
   * @param {string} status
   * @param {string} [sent_to_lis_at]
   * @returns {Promise<void>}
   */
  updateLabOrderStatus(id, status, sent_to_lis_at) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `UPDATE lab_orders SET status = ?, sent_to_lis_at = COALESCE(?, sent_to_lis_at) WHERE id = ?`,
        [status, sent_to_lis_at || null, id],
        (err) => (err ? reject(err) : resolve())
      );
    });
  }

  // ── Órdenes de Radiología ────────────────────────────────────────────────

  /**
   * Crea una orden de radiología con código único (HU02, HU17).
   * @param {{ patient_id, doctor_id, record_id, study_type, body_region, priority, notes }} data
   * @returns {Promise<{id: number, order_code: string}>}
   */
  createRadiologyOrder({ patient_id, doctor_id, record_id, study_type, body_region, priority, notes }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const order_code = generateOrderCode('RAD');
      db.run(
        `INSERT INTO radiology_orders (order_code, patient_id, doctor_id, record_id, study_type, body_region, priority, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [order_code, patient_id, doctor_id, record_id || null,
         study_type, body_region || null, priority || 'NORMAL', notes || null],
        function (err) { err ? reject(err) : resolve({ id: this.lastID, order_code }); }
      );
    });
  }

  /**
   * Obtiene una orden de radiología por ID.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  findRadiologyOrderById(id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(
        `SELECT ro.*, u.full_name AS doctor_name, p.full_name AS patient_name
         FROM radiology_orders ro
         JOIN users u    ON ro.doctor_id  = u.id
         JOIN patients p ON ro.patient_id = p.id
         WHERE ro.id = ?`,
        [id],
        (err, row) => (err ? reject(err) : resolve(row || null))
      );
    });
  }

  /**
   * Lista las órdenes de radiología de un paciente.
   * @param {number} patient_id
   * @returns {Promise<Object[]>}
   */
  findRadiologyOrdersByPatient(patient_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(
        `SELECT ro.*, u.full_name AS doctor_name
         FROM radiology_orders ro
         JOIN users u ON ro.doctor_id = u.id
         WHERE ro.patient_id = ?
         ORDER BY ro.created_at DESC`,
        [patient_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }

  /**
   * Lista órdenes de radiología por estado.
   * @param {string} [status]
   * @returns {Promise<Object[]>}
   */
  findRadiologyOrdersByStatus(status) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const query = status
        ? `SELECT ro.*, u.full_name AS doctor_name, p.full_name AS patient_name
           FROM radiology_orders ro
           JOIN users u    ON ro.doctor_id  = u.id
           JOIN patients p ON ro.patient_id = p.id
           WHERE ro.status = ?
           ORDER BY ro.created_at ASC`
        : `SELECT ro.*, u.full_name AS doctor_name, p.full_name AS patient_name
           FROM radiology_orders ro
           JOIN users u    ON ro.doctor_id  = u.id
           JOIN patients p ON ro.patient_id = p.id
           ORDER BY ro.created_at DESC`;
      const params = status ? [status] : [];
      db.all(query, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  }

  /**
   * Actualiza el estado de una orden de radiología (HU04).
   * @param {number} id
   * @param {string} status
   * @param {string} [sent_to_ris_at]
   * @returns {Promise<void>}
   */
  updateRadiologyOrderStatus(id, status, sent_to_ris_at) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `UPDATE radiology_orders SET status = ?, sent_to_ris_at = COALESCE(?, sent_to_ris_at) WHERE id = ?`,
        [status, sent_to_ris_at || null, id],
        (err) => (err ? reject(err) : resolve())
      );
    });
  }
}

module.exports = new OrderRepository();
