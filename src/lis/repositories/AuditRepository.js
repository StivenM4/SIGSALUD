/**
 * @file AuditRepository.js  (LIS)
 * @description Auditoría de todas las acciones sobre órdenes y resultados (HU31, HU33).
 * SRP: sólo gestiona la tabla `audit_logs` del LIS.
 */
const { getDb } = require('../config/db');

class AuditRepository {
  /**
   * Registra una acción de auditoría.
   * @param {{ action, entity, entity_id, performed_by, detail }} entry
   * @returns {Promise<number>}
   */
  log({ action, entity, entity_id, performed_by, detail }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT INTO audit_logs (action, entity, entity_id, performed_by, detail)
         VALUES (?, ?, ?, ?, ?)`,
        [action, entity || null, entity_id || null, performed_by || null, detail || null],
        function (err) { err ? reject(err) : resolve(this.lastID); }
      );
    });
  }

  /**
   * Obtiene el registro de auditoría con filtros opcionales.
   * @param {{ entity?, entity_id?, limit? }} filters
   * @returns {Promise<Object[]>}
   */
  findAll({ entity, entity_id, limit = 200 } = {}) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const conditions = [];
      const params     = [];
      if (entity)    { conditions.push('entity = ?');    params.push(entity);    }
      if (entity_id) { conditions.push('entity_id = ?'); params.push(entity_id); }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      params.push(limit);
      db.all(
        `SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ?`,
        params,
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }
}

module.exports = new AuditRepository();
