/**
 * @file ScheduleRepository.js  (RIS)
 * @description Repositorio de agendamiento de salas/equipos (HU38, HU39).
 * SRP: sólo gestiona CRUD sobre `schedules`.
 */
const { getDb } = require('../config/db');

class ScheduleRepository {
  /**
   * Crea una nueva programación de estudio.
   * @param {{ order_id, room, equipment, technician, scheduled_at, duration_minutes }} data
   * @returns {Promise<number>}
   */
  create({ order_id, room, equipment, technician, scheduled_at, duration_minutes }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT INTO schedules (order_id, room, equipment, technician, scheduled_at, duration_minutes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [order_id, room, equipment || null, technician, scheduled_at, duration_minutes || 30],
        function (err) { err ? reject(err) : resolve(this.lastID); }
      );
    });
  }

  /**
   * Verifica conflicto de sala en el horario exacto (HU39).
   * Considera la duración de los estudios existentes.
   * @param {string} room
   * @param {string} scheduled_at
   * @param {number} [duration_minutes=30]
   * @returns {Promise<boolean>}
   */
  hasConflict(room, scheduled_at, duration_minutes = 30) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      // Verifica solapamiento temporal: el nuevo [start, start+dur] se solapa con algún existente
      db.get(
        `SELECT id FROM schedules
         WHERE room = ?
           AND status != 'CANCELADA'
           AND datetime(scheduled_at) < datetime(?, '+${duration_minutes} minutes')
           AND datetime(scheduled_at, '+' || duration_minutes || ' minutes') > datetime(?)`,
        [room, scheduled_at, scheduled_at],
        (err, row) => (err ? reject(err) : resolve(!!row))
      );
    });
  }

  /** @returns {Promise<Object|null>} */
  findByOrder(order_id) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.get(`SELECT * FROM schedules WHERE order_id = ?`, [order_id], (err, row) => (err ? reject(err) : resolve(row || null)));
    });
  }

  /**
   * Lista la agenda del día/sala.
   * @param {string} [room]
   * @param {string} [date] - Fecha en formato YYYY-MM-DD
   * @returns {Promise<Object[]>}
   */
  findByRoomAndDate(room, date) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      const conditions = [];
      const params     = [];
      if (room) { conditions.push(`room = ?`);                   params.push(room); }
      if (date) { conditions.push(`date(scheduled_at) = date(?)`); params.push(date); }
      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      db.all(
        `SELECT s.*, ro.order_code, ro.patient_name, ro.study_type
         FROM schedules s
         JOIN radiology_orders ro ON s.order_id = ro.id
         ${where}
         ORDER BY s.scheduled_at ASC`,
        params,
        (err, rows) => (err ? reject(err) : resolve(rows))
      );
    });
  }

  /** Actualiza el estado de una programación. */
  updateStatus(id, status) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(`UPDATE schedules SET status = ? WHERE id = ?`, [status, id],
        (err) => (err ? reject(err) : resolve()));
    });
  }
}

module.exports = new ScheduleRepository();
