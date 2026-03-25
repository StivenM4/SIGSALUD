/**
 * @file NotificationRepository.js
 * @description Repositorio de notificaciones internas al médico (HU09).
 * SRP: sólo gestiona CRUD sobre `notifications`.
 */
const { getDb } = require('../config/db');

class NotificationRepository {
  /**
   * Crea una nueva notificación.
   * @param {{ user_id, type, message, entity, entity_id }} data
   * @returns {Promise<number>}
   */
  create({ user_id, type, message, entity, entity_id }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT INTO notifications (user_id, type, message, entity, entity_id)
         VALUES (?, ?, ?, ?, ?)`,
        [user_id, type, message, entity || null, entity_id || null],
        function (err) { err ? reject(err) : resolve(this.lastID); }
      );
    });
  }

  /**
   * Obtiene todas las notificaciones de un usuario, con opción de filtrar solo las no leídas.
   * @param {number} user_id
   * @param {boolean} [onlyUnread=false]
   * @returns {Promise<Object[]>}
   */
  findByUser(user_id, onlyUnread = false) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const query = onlyUnread
        ? `SELECT * FROM notifications WHERE user_id = ? AND is_read = 0 ORDER BY created_at DESC`
        : `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`;
      db.all(query, [user_id], (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  }

  /**
   * Marca una o todas las notificaciones de un usuario como leídas.
   * @param {number} user_id
   * @param {number|null} [notification_id] - Si null, marca todas
   * @returns {Promise<void>}
   */
  markAsRead(user_id, notification_id = null) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const query = notification_id
        ? `UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?`
        : `UPDATE notifications SET is_read = 1 WHERE user_id = ?`;
      const params = notification_id ? [notification_id, user_id] : [user_id];
      db.run(query, params, (err) => (err ? reject(err) : resolve()));
    });
  }

  /**
   * Cuenta las notificaciones no leídas de un usuario.
   * @param {number} user_id
   * @returns {Promise<number>}
   */
  countUnread(user_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(
        `SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0`,
        [user_id],
        (err, row) => (err ? reject(err) : resolve(row?.count || 0))
      );
    });
  }
}

module.exports = new NotificationRepository();
