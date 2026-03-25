/**
 * @file UserRepository.js
 * @description Repositorio de acceso a datos de usuarios.
 * Patrón Repository: separa el acceso a datos de la lógica de negocio (SOLID DIP).
 * SRP: sólo maneja operaciones CRUD sobre la tabla `users`.
 */
const { getDb } = require('../config/db');

class UserRepository {
  /**
   * Busca un usuario por su nombre de usuario.
   * @param {string} username
   * @returns {Promise<Object|null>}
   */
  findByUsername(username) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(
        `SELECT u.*, r.name AS role_name
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.username = ? AND u.is_active = 1`,
        [username],
        (err, row) => (err ? reject(err) : resolve(row || null))
      );
    });
  }

  /**
   * Busca un usuario por su ID.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  findById(id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(
        `SELECT u.id, u.username, u.full_name, u.email, u.is_active, u.created_at, r.name AS role_name
         FROM users u
         JOIN roles r ON u.role_id = r.id
         WHERE u.id = ?`,
        [id],
        (err, row) => (err ? reject(err) : resolve(row || null))
      );
    });
  }

  /**
   * Obtiene todos los usuarios activos.
   * @returns {Promise<Object[]>}
   */
  findAll() {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(
        `SELECT u.id, u.username, u.full_name, u.email, u.is_active, u.created_at, r.name AS role_name
         FROM users u
         JOIN roles r ON u.role_id = r.id
         ORDER BY u.created_at DESC`,
        [],
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }

  /**
   * Crea un nuevo usuario.
   * @param {{ username, password, full_name, email, role_id }} data
   * @returns {Promise<number>} ID del nuevo usuario
   */
  create({ username, password, full_name, email, role_id }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT INTO users (username, password, full_name, email, role_id) VALUES (?, ?, ?, ?, ?)`,
        [username, password, full_name, email, role_id],
        function (err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

  /**
   * Actualiza el estado activo de un usuario.
   * @param {number} id
   * @param {number} isActive
   * @returns {Promise<void>}
   */
  updateStatus(id, isActive) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `UPDATE users SET is_active = ? WHERE id = ?`,
        [isActive, id],
        (err) => (err ? reject(err) : resolve())
      );
    });
  }

  /**
   * Obtiene todos los roles disponibles.
   * @returns {Promise<Object[]>}
   */
  findAllRoles() {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.all(`SELECT * FROM roles`, [], (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  }

  /**
   * Obtiene un rol por su nombre.
   * @param {string} name
   * @returns {Promise<Object|null>}
   */
  findRoleByName(name) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(`SELECT * FROM roles WHERE name = ?`, [name], (err, row) => (err ? reject(err) : resolve(row || null)));
    });
  }
}

module.exports = new UserRepository();
