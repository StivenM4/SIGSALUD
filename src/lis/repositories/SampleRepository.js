/**
 * @file SampleRepository.js
 * @description Repositorio de toma de muestras (HU21, HU33).
 * SRP: sólo gestiona CRUD sobre `samples`.
 */
const { getDb } = require('../config/db');

class SampleRepository {
  /**
   * Registra la toma de muestra para una orden (HU21).
   * @param {{ lab_order_id, technician, sample_type, observations }} data
   * @returns {Promise<number>}
   */
  create({ lab_order_id, technician, sample_type, observations }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT INTO samples (lab_order_id, technician, sample_type, observations) VALUES (?, ?, ?, ?)`,
        [lab_order_id, technician, sample_type, observations || null],
        function (err) { err ? reject(err) : resolve(this.lastID); }
      );
    });
  }

  /** @returns {Promise<Object[]>} */
  findByOrder(lab_order_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(
        `SELECT * FROM samples WHERE lab_order_id = ? ORDER BY collected_at DESC`,
        [lab_order_id],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }
}

module.exports = new SampleRepository();
