/**
 * @file PatientRepository.js
 * @description Repositorio de acceso a datos de pacientes (RF1).
 * SRP: sólo gestiona CRUD sobre la tabla `patients`.
 */
const { getDb } = require('../config/db');

class PatientRepository {
  /**
   * Encuentra un paciente por número de documento.
   * @param {string} documentNum
   * @returns {Promise<Object|null>}
   */
  findByDocument(documentNum) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(
        `SELECT * FROM patients WHERE document_num = ?`,
        [documentNum],
        (err, row) => (err ? reject(err) : resolve(row || null))
      );
    });
  }

  /**
   * Busca pacientes por nombre o número de documento (búsqueda parcial).
   * @param {string} query
   * @returns {Promise<Object[]>}
   */
  search(query) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const term = `%${query}%`;
      db.all(
        `SELECT * FROM patients WHERE full_name LIKE ? OR document_num LIKE ? ORDER BY full_name`,
        [term, term],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }

  /**
   * Obtiene un paciente por ID.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  findById(id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(`SELECT * FROM patients WHERE id = ?`, [id], (err, row) => (err ? reject(err) : resolve(row || null)));
    });
  }

  /**
   * Crea un nuevo paciente.
   * @param {Object} data
   * @returns {Promise<number>} ID del nuevo paciente
   */
  create({ document_type, document_num, full_name, birth_date, gender, phone, email, address, blood_type, created_by }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT INTO patients (document_type, document_num, full_name, birth_date, gender, phone, email, address, blood_type, created_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [document_type, document_num, full_name, birth_date, gender, phone, email, address, blood_type, created_by],
        function (err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

  /**
   * Actualiza los datos de un paciente.
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<void>}
   */
  update(id, { full_name, birth_date, gender, phone, email, address, blood_type }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `UPDATE patients SET full_name=?, birth_date=?, gender=?, phone=?, email=?, address=?, blood_type=? WHERE id=?`,
        [full_name, birth_date, gender, phone, email, address, blood_type, id],
        (err) => (err ? reject(err) : resolve())
      );
    });
  }

  /**
   * Obtiene todos los pacientes.
   * @returns {Promise<Object[]>}
   */
  findAll() {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(`SELECT * FROM patients ORDER BY full_name`, [], (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  }
}

module.exports = new PatientRepository();
