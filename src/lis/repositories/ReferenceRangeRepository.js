/**
 * @file ReferenceRangeRepository.js
 * @description Repositorio de rangos de referencia para detección de valores críticos (HU32).
 * SRP: sólo gestiona la tabla `reference_ranges`.
 */
const { getDb } = require('../config/db');

class ReferenceRangeRepository {
  /** @returns {Promise<Object[]>} */
  findAll() {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(`SELECT * FROM reference_ranges`, [], (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  }

  /** @returns {Promise<Object|null>} */
  findByTestName(test_name) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(
        `SELECT * FROM reference_ranges WHERE LOWER(test_name) = LOWER(?)`,
        [test_name],
        (err, row) => (err ? reject(err) : resolve(row || null))
      );
    });
  }
}

module.exports = new ReferenceRangeRepository();
