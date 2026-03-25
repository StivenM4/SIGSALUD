/**
 * @file StudyRepository.js  (RIS)
 * @description Repositorio de estudios realizados (HU40, HU46).
 * SRP: sólo gestiona CRUD sobre `studies`.
 */
const { getDb } = require('../config/db');

class StudyRepository {
  /**
   * Registra la realización de un estudio radiológico (HU40).
   * @param {{ order_id, technician, observations, orthanc_study_id, image_url }} data
   * @returns {Promise<number>}
   */
  create({ order_id, technician, observations, orthanc_study_id, image_url }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT INTO studies (order_id, technician, observations, orthanc_study_id, image_url)
         VALUES (?, ?, ?, ?, ?)`,
        [order_id, technician, observations || null, orthanc_study_id || null, image_url || null],
        function (err) { err ? reject(err) : resolve(this.lastID); }
      );
    });
  }

  /** @returns {Promise<Object|null>} */
  findByOrder(order_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(
        `SELECT * FROM studies WHERE order_id = ? ORDER BY performed_at DESC LIMIT 1`,
        [order_id],
        (err, row) => (err ? reject(err) : resolve(row || null))
      );
    });
  }

  /** Actualiza el ID del estudio en Orthanc y la URL de imagen. */
  updateOrthancRef(id, orthanc_study_id, image_url) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `UPDATE studies SET orthanc_study_id = ?, image_url = ? WHERE id = ?`,
        [orthanc_study_id, image_url, id],
        (err) => (err ? reject(err) : resolve())
      );
    });
  }
}

module.exports = new StudyRepository();
