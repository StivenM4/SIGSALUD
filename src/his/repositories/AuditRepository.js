/**
 * @file AuditRepository.js
 * @description Repositorio de registro de auditoría (HU18, HU31, HU49).
 * SRP: sólo gestiona operaciones sobre la tabla `audit_logs`.
 */
const { getDb } = require('../config/db');

class AuditRepository {
  /**
   * Registra una acción de auditoría.
   * @param {{ user_id, action, entity, entity_id, detail, ip_address }} entry
   * @returns {Promise<number>} ID del registro creado
   */
  log({ user_id, action, entity, entity_id, detail, ip_address }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT INTO audit_logs (user_id, action, entity, entity_id, detail, ip_address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user_id || null, action, entity || null, entity_id || null, detail || null, ip_address || null],
        function (err) {
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  }

  /**
   * Obtiene los registros de auditoría con filtros opcionales.
   * @param {{ user_id?, entity?, limit? }} filters
   * @returns {Promise<Object[]>}
   */
  findAll({ user_id, entity, limit = 100 } = {}) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const conditions = [];
      const params = [];

      if (user_id) { conditions.push('al.user_id = ?'); params.push(user_id); }
      if (entity)  { conditions.push('al.entity = ?');   params.push(entity);  }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      params.push(limit);

      db.all(
        `SELECT al.*, u.username
         FROM audit_logs al
         LEFT JOIN users u ON al.user_id = u.id
         ${where}
         ORDER BY al.created_at DESC
         LIMIT ?`,
        params,
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }
}

module.exports = new AuditRepository();
