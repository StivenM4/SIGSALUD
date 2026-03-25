/**
 * @file initDb.js
 * @description Inicializa el esquema de la base de datos del subsistema LIS.
 * SRP: sólo gestiona la creación del esquema.
 *
 * Tablas:
 *  - lab_orders     : Órdenes recibidas desde HIS (HU19, HU26)
 *  - samples        : Registro de toma de muestras (HU21)
 *  - lab_results    : Resultados registrados (HU22, HU23, HU24, HU28)
 *  - audit_logs     : Auditoría de acciones (HU31, HU33)
 *  - reference_ranges: Rangos de referencia para alertas críticas (HU32)
 */
const { getDb } = require('./db');

const initializeDatabase = () => {
  const db = getDb();

  db.serialize(() => {
    // ── Órdenes de laboratorio recibidas desde HIS (HU19, HU26) ─────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS lab_orders (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        order_code      TEXT    NOT NULL UNIQUE,
        his_order_id    INTEGER,
        patient_id      INTEGER NOT NULL,
        patient_name    TEXT    NOT NULL,
        doctor_name     TEXT,
        tests_requested TEXT    NOT NULL,
        priority        TEXT    NOT NULL DEFAULT 'NORMAL',
        status          TEXT    NOT NULL DEFAULT 'RECIBIDA',
        notes           TEXT,
        received_at     TEXT    NOT NULL DEFAULT (datetime('now')),
        completed_at    TEXT
      )
    `);

    // ── Toma de muestras (HU21, HU33) ───────────────────────────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS samples (
        id             INTEGER PRIMARY KEY AUTOINCREMENT,
        lab_order_id   INTEGER NOT NULL,
        technician     TEXT    NOT NULL,
        sample_type    TEXT    NOT NULL,
        collected_at   TEXT    NOT NULL DEFAULT (datetime('now')),
        observations   TEXT,
        FOREIGN KEY (lab_order_id) REFERENCES lab_orders (id)
      )
    `);

    // ── Resultados de análisis (HU22, HU23, HU24, HU25, HU28) ───────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS lab_results (
        id              INTEGER PRIMARY KEY AUTOINCREMENT,
        lab_order_id    INTEGER NOT NULL,
        results_json    TEXT    NOT NULL,
        is_validated    INTEGER NOT NULL DEFAULT 0,
        validated_by    TEXT,
        validated_at    TEXT,
        is_sent_to_his  INTEGER NOT NULL DEFAULT 0,
        sent_to_his_at  TEXT,
        report_path     TEXT,
        is_critical     INTEGER NOT NULL DEFAULT 0,
        created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (lab_order_id) REFERENCES lab_orders (id)
      )
    `);

    // ── Auditoría de acciones sobre resultados (HU31, HU33) ─────────────────
    db.run(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        action      TEXT    NOT NULL,
        entity      TEXT,
        entity_id   INTEGER,
        performed_by TEXT,
        detail      TEXT,
        created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
      )
    `);

    // ── Rangos de referencia para detección de valores críticos (HU32) ───────
    db.run(`
      CREATE TABLE IF NOT EXISTS reference_ranges (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        test_name   TEXT    NOT NULL UNIQUE,
        unit        TEXT,
        normal_min  REAL,
        normal_max  REAL,
        critical_min REAL,
        critical_max REAL
      )
    `);

    // Insertar rangos de referencia base
    const ranges = [
      ['Hemoglobina',       'g/dL',   12.0, 17.5, 7.0,  20.0],
      ['Glucosa',           'mg/dL',  70.0, 99.0, 40.0, 500.0],
      ['Creatinina',        'mg/dL',  0.6,  1.2,  null, 10.0],
      ['Hematocrito',       '%',      36.0, 50.0, 20.0, 60.0],
      ['Leucocitos',        'x10³/µL',4.5,  11.0, 2.0,  30.0],
      ['Plaquetas',         'x10³/µL',150,  400,  50,   1000],
      ['Potasio',           'mEq/L',  3.5,  5.0,  2.5,  6.5],
      ['Sodio',             'mEq/L',  136,  145,  120,  160],
    ];
    const stmt = db.prepare(
      `INSERT OR IGNORE INTO reference_ranges (test_name, unit, normal_min, normal_max, critical_min, critical_max)
       VALUES (?, ?, ?, ?, ?, ?)`
    );
    ranges.forEach(r => stmt.run(r));
    stmt.finalize();

    console.log('[LIS] Esquema de base de datos inicializado correctamente.');
  });
};

module.exports = { initializeDatabase };
