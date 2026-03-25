/**
 * @file AuditRepository.js  (RIS)
 * @description Auditoría de acciones sobre estudios e informes radiológicos (HU49).
 * SRP: sólo gestiona la tabla `audit_logs` del RIS.
 */
const { getDb } = require('../config/db');

class AuditRepository {
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

  findAll({ entity, entity_id, limit = 200 } = {}) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const conditions = [];
      const params     = [];
      if (entity)    { conditions.push('entity = ?');    params.push(entity);    }
      if (entity_id) { conditions.push('entity_id = ?'); params.push(entity_id); }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      params.push(limit);
      db.all(`SELECT * FROM audit_logs ${where} ORDER BY created_at DESC LIMIT ?`, params,
        (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  }
}

module.exports = new AuditRepository();
