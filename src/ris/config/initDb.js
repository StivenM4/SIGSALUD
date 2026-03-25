/**
 * @file initDb.js  (RIS)
 * @description Inicializa el esquema de la base de datos del subsistema RIS.
 * SRP: sólo gestiona la creación del esquema.
 *
 * Tablas:
 *  - radiology_orders   : Órdenes recibidas desde HIS (HU36, HU37, HU48)
 *  - schedules          : Agendamiento de equipos/salas (HU38, HU39)
 *  - studies            : Registro de estudios realizados (HU40)
 *  - radiology_reports  : Informes diagnósticos (HU41-HU44, HU50)
 *  - audit_logs         : Auditoría de acciones (HU49)
 */
const { getDb } = require('./db');

const initializeDatabase = () => {
  const db = getDb();

  db.serialize(() => {
    // ── Órdenes de radiología recibidas desde HIS (HU36, HU37, HU48) ────────
    db.run(`
      CREATE TABLE IF NOT EXISTS radiology_orders (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        order_code      TEXT    NOT NULL UNIQUE,
        his_order_id    INTEGER,
        patient_id      INTEGER NOT NULL,
        patient_name    TEXT    NOT NULL,
        doctor_name     TEXT,
        study_type      TEXT    NOT NULL,
        body_region     TEXT,
        priority        TEXT    NOT NULL DEFAULT 'NORMAL',
        status          TEXT    NOT NULL DEFAULT 'RECIBIDA',
        notes           TEXT,
        received_at     TEXT    NOT NULL DEFAULT (datetime('now')),
        confirmed_at    TEXT,
        completed_at    TEXT
      )
    `);

    // ── Agendamiento de salas/equipos (HU38, HU39) ──────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS schedules (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id         INTEGER NOT NULL,
        room             TEXT    NOT NULL,
        equipment        TEXT,
        technician       TEXT    NOT NULL,
        scheduled_at     TEXT    NOT NULL,
        duration_minutes INTEGER NOT NULL DEFAULT 30,
        status           TEXT    NOT NULL DEFAULT 'PROGRAMADA',
        created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (order_id) REFERENCES radiology_orders (id)
      )
    `);

    // ── Registro de estudios realizados (HU40) ───────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS studies (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id         INTEGER NOT NULL,
        technician       TEXT    NOT NULL,
        performed_at     TEXT    NOT NULL DEFAULT (datetime('now')),
        observations     TEXT,
        orthanc_study_id TEXT,
        image_url        TEXT,
        FOREIGN KEY (order_id) REFERENCES radiology_orders (id)
      )
    `);

    // ── Informes radiológicos (HU41-HU44, HU45, HU50) ───────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS radiology_reports (
        id               INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id         INTEGER NOT NULL,
        radiologist      TEXT    NOT NULL,
        findings         TEXT    NOT NULL,
        conclusion       TEXT,
        is_validated     INTEGER NOT NULL DEFAULT 0,
        validated_at     TEXT,
        is_sent_to_his   INTEGER NOT NULL DEFAULT 0,
        sent_to_his_at   TEXT,
        image_url        TEXT,
        created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (order_id) REFERENCES radiology_orders (id)
      )
    `);

    // ── Auditoría (HU49) ─────────────────────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        action       TEXT    NOT NULL,
        entity       TEXT,
        entity_id    INTEGER,
        performed_by TEXT,
        detail       TEXT,
        created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
      )
    `);

    console.log('[RIS] Esquema de base de datos inicializado correctamente.');
  });
};

module.exports = { initializeDatabase };
