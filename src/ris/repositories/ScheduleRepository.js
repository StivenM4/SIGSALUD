/**
 * @file ScheduleRepository.js  (RIS)
 * @description Repositorio de agendamiento de estudios (HU38, HU39).
 */
const { getDb } = require('../config/db');

class ScheduleRepository {
  /**
   * Crea una cita para un estudio (HU38).
   */
  create({ order_id, room, equipment, technician, scheduled_at, duration_minutes }) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      db.run(
        `INSERT INTO schedules (order_id, room, equipment, technician, scheduled_at, duration_minutes)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [order_id, room, equipment, technician, scheduled_at, duration_minutes],
        function (err) { err ? reject(err) : resolve(this.lastID); }
      );
    });
  }

  /**
   * Verifica conflictos de horario en una sala (HU39).
   */
  hasConflict(room, scheduled_at, duration_minutes) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      // Simplificado: verifica si hay alguna cita en la misma sala que se traslape
      db.get(
        `SELECT id FROM schedules 
         WHERE room = ? 
         AND (
           (scheduled_at <= ? AND datetime(scheduled_at, '+' || duration_minutes || ' minutes') > ?)
           OR
           (? <= scheduled_at AND datetime(?, '+' || ? || ' minutes') > scheduled_at)
         ) LIMIT 1`,
        [room, scheduled_at, scheduled_at, scheduled_at, scheduled_at, duration_minutes],
        (err, row) => (err ? reject(err) : resolve(!!row))
      );
    });
  }

  /**
   * Obtiene la agenda de una sala en un día.
   */
  findByRoomAndDate(room, date) {
    return new Promise((resolve, reject) => {
      const db = getDb();
      let query = `SELECT s.*, ro.order_code, ro.patient_name 
                   FROM schedules s 
                   JOIN radiology_orders ro ON s.order_id = ro.id`;
      let params = [];
      if (room || date) {
        query += " WHERE ";
        let conds = [];
        if (room) { conds.push("s.room = ?"); params.push(room); }
        if (date) { conds.push("date(s.scheduled_at) = ?"); params.push(date); }
        query += conds.join(" AND ");
      }
      db.all(query, params, (err, rows) => (err ? reject(err) : resolve(rows)));
    });
  }
}

module.exports = new ScheduleRepository();
