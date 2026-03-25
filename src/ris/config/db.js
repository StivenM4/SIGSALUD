/**
 * @file db.js  (RIS)
 * @description Singleton de conexión SQLite para el subsistema RIS.
 * Patrón Singleton: garantiza una única instancia de la conexión.
 */
const sqlite3 = require('sqlite3').verbose();
const path    = require('path');
const fs      = require('fs');

const DB_PATH = process.env.DB_FILE
  ? path.resolve(process.env.DB_FILE)
  : path.resolve(__dirname, '..', 'db', 'ris.sqlite');

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

let instance = null;

const getDb = () => {
  if (!instance) {
    instance = new sqlite3.Database(DB_PATH, (err) => {
      if (err) console.error('[RIS] Error al conectar a la BD:', err.message);
      else     console.log('[RIS] Conectado a SQLite en:', DB_PATH);
    });
    instance.run('PRAGMA foreign_keys = ON');
  }
  return instance;
};

module.exports = { getDb };
