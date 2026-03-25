/**
 * @file seed.js
 * @description Script de semilla: crea el usuario ADMINISTRADOR inicial si no existe.
 * Ejecutar una vez: node src/his/seed.js
 */
require('dotenv').config({ path: `${__dirname}/.env` });

const { initializeDatabase } = require('./config/initDb');
const { getDb }              = require('./config/db');
const AuthService            = require('./services/AuthService');

const seed = async () => {
  initializeDatabase();

  // Esperar a que la BD se inicialice
  await new Promise(r => setTimeout(r, 500));

  const db = getDb();

  db.get(`SELECT id FROM users WHERE username = 'admin'`, async (err, row) => {
    if (err) { console.error(err); return; }

    if (row) {
      console.log('[SEED] El usuario admin ya existe. ID:', row.id);
      return;
    }

    db.get(`SELECT id FROM roles WHERE name = 'ADMINISTRADOR'`, async (err2, role) => {
      if (err2 || !role) {
        console.error('[SEED] Rol ADMINISTRADOR no encontrado. Reintenta en un momento.');
        return;
      }

      const password = AuthService.encodePassword('Admin1234!');
      db.run(
        `INSERT INTO users (username, password, full_name, email, role_id) VALUES (?, ?, ?, ?, ?)`,
        ['admin', password, 'Administrador del Sistema', 'admin@sigsalud.local', role.id],
        function (insertErr) {
          if (insertErr) { console.error('[SEED] Error:', insertErr.message); return; }
          console.log('[SEED] ✅ Usuario admin creado con ID:', this.lastID);
          console.log('[SEED] ✅ Credenciales: usuario=admin | contraseña=Admin1234!');
          console.log('[SEED] ⚠️  Cambia la contraseña en producción.');
        }
      );
    });
  });
};

seed();
