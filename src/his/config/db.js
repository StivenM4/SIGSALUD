/**
 * @file db.js
 * @description Singleton de conexión a SQLite para el subsistema HIS.
 * Patrón Singleton: asegura una única instancia de la conexión a la base de datos.
 */
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_FILE
  ? path.resolve(process.env.DB_FILE)
  : path.resolve(__dirname, '..', 'db', 'his.sqlite');

// Crear directorio si no existe
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let instance = null;

/**
 * Devuelve la única instancia de la conexión a la base de datos.
 * @returns {sqlite3.Database}
 */
const getDb = () => {
  if (!instance) {
    instance = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        console.error('[HIS] Error al conectar a la base de datos:', err.message);
      } else {
        console.log('[HIS] Conectado a la base de datos SQLite en:', DB_PATH);
      }
    });
    instance.run('PRAGMA foreign_keys = ON');
  }
  return instance;
};

module.exports = { getDb };
