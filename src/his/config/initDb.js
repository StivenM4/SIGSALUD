/**
 * @file initDb.js
 * @description Inicializa el esquema de la base de datos HIS con las tablas necesarias.
 * Aplica SRP: sólo se encarga de la inicialización del esquema.
 */
const { getDb } = require('./db');

const initializeDatabase = () => {
  const db = getDb();

  db.serialize(() => {
    // Tabla de roles
    db.run(`
      CREATE TABLE IF NOT EXISTS roles (
        id   INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT    NOT NULL UNIQUE
      )
    `);

    // Tabla de usuarios
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        username     TEXT    NOT NULL UNIQUE,
        password     TEXT    NOT NULL,
        full_name    TEXT    NOT NULL,
        email        TEXT    NOT NULL UNIQUE,
        role_id      INTEGER NOT NULL,
        is_active    INTEGER NOT NULL DEFAULT 1,
        created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (role_id) REFERENCES roles (id)
      )
    `);

    // Tabla de pacientes
    db.run(`
      CREATE TABLE IF NOT EXISTS patients (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        document_type TEXT    NOT NULL,
        document_num  TEXT    NOT NULL UNIQUE,
        full_name     TEXT    NOT NULL,
        birth_date    TEXT,
        gender        TEXT,
        phone         TEXT,
        email         TEXT,
        address       TEXT,
        blood_type    TEXT,
        created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
        created_by    INTEGER,
        FOREIGN KEY (created_by) REFERENCES users (id)
      )
    `);

    // Tabla de citas
    db.run(`
      CREATE TABLE IF NOT EXISTS appointments (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id   INTEGER NOT NULL,
        doctor_id    INTEGER NOT NULL,
        scheduled_at TEXT    NOT NULL,
        reason       TEXT,
        status       TEXT    NOT NULL DEFAULT 'PENDIENTE',
        notes        TEXT,
        created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (patient_id) REFERENCES patients   (id),
        FOREIGN KEY (doctor_id)  REFERENCES users      (id)
      )
    `);

    // Tabla de auditoría (HU18)
    db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER,
        action      TEXT    NOT NULL,
        entity      TEXT,
        entity_id   INTEGER,
        detail      TEXT,
        ip_address  TEXT,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // ── Historial Clínico (RF4, HU10, HU14, HU16) ──────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS clinical_records (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        patient_id   INTEGER NOT NULL,
        doctor_id    INTEGER NOT NULL,
        visit_date   TEXT    NOT NULL DEFAULT (datetime('now')),
        motive       TEXT,
        diagnosis    TEXT,
        treatment    TEXT,
        notes        TEXT,
        created_at   TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (patient_id) REFERENCES patients (id),
        FOREIGN KEY (doctor_id)  REFERENCES users    (id)
      )
    `);

    // ── Órdenes de Laboratorio (HU01, HU15, HU17) ───────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS lab_orders (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        order_code     TEXT    NOT NULL UNIQUE,
        patient_id     INTEGER NOT NULL,
        doctor_id      INTEGER NOT NULL,
        record_id      INTEGER,
        tests_requested TEXT   NOT NULL,
        priority       TEXT    NOT NULL DEFAULT 'NORMAL',
        status         TEXT    NOT NULL DEFAULT 'PENDIENTE',
        notes          TEXT,
        created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
        sent_to_lis_at TEXT,
        FOREIGN KEY (patient_id) REFERENCES patients          (id),
        FOREIGN KEY (doctor_id)  REFERENCES users             (id),
        FOREIGN KEY (record_id)  REFERENCES clinical_records  (id)
      )
    `);

    // ── Órdenes de Radiología (HU02, HU15, HU17) ────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS radiology_orders (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        order_code      TEXT    NOT NULL UNIQUE,
        patient_id      INTEGER NOT NULL,
        doctor_id       INTEGER NOT NULL,
        record_id       INTEGER,
        study_type      TEXT    NOT NULL,
        body_region     TEXT,
        priority        TEXT    NOT NULL DEFAULT 'NORMAL',
        status          TEXT    NOT NULL DEFAULT 'PENDIENTE',
        notes           TEXT,
        created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
        sent_to_ris_at  TEXT,
        FOREIGN KEY (patient_id) REFERENCES patients          (id),
        FOREIGN KEY (doctor_id)  REFERENCES users             (id),
        FOREIGN KEY (record_id)  REFERENCES clinical_records  (id)
      )
    `);

    // ── Resultados de Laboratorio recibidos desde LIS (HU05, HU07) ──────────
    db.run(`
      CREATE TABLE IF NOT EXISTS lab_results (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        lab_order_id    INTEGER NOT NULL,
        patient_id      INTEGER NOT NULL,
        results_json    TEXT    NOT NULL,
        validated_by    TEXT,
        report_url      TEXT,
        received_at     TEXT    NOT NULL DEFAULT (datetime('now')),
        is_critical     INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY (lab_order_id) REFERENCES lab_orders (id),
        FOREIGN KEY (patient_id)   REFERENCES patients   (id)
      )
    `);

    // ── Informes Radiológicos recibidos desde RIS (HU06, HU08) ──────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS radiology_reports (
        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
        radiology_order_id  INTEGER NOT NULL,
        patient_id          INTEGER NOT NULL,
        radiologist_name    TEXT,
        findings            TEXT    NOT NULL,
        conclusion          TEXT,
        image_url           TEXT,
        received_at         TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (radiology_order_id) REFERENCES radiology_orders (id),
        FOREIGN KEY (patient_id)         REFERENCES patients          (id)
      )
    `);

    // ── Notificaciones al médico (HU09) ─────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS notifications (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id     INTEGER NOT NULL,
        type        TEXT    NOT NULL,
        message     TEXT    NOT NULL,
        entity      TEXT,
        entity_id   INTEGER,
        is_read     INTEGER NOT NULL DEFAULT 0,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (user_id) REFERENCES users (id)
      )
    `);

    // Insertar roles base si no existen
    const roles = ['ADMINISTRADOR', 'MEDICO', 'RECEPCIONISTA', 'RADIOLOGO', 'TECNICO_LABORATORIO', 'PACIENTE'];
    const stmt = db.prepare(`INSERT OR IGNORE INTO roles (name) VALUES (?)`);
    roles.forEach(r => stmt.run(r));
    stmt.finalize();

    console.log('[HIS] Esquema de base de datos inicializado correctamente.');
  });
};

module.exports = { initializeDatabase };
