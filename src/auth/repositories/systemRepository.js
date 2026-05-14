const pool = require("../config/db");

async function getActiveSystems() {
  const result = await pool.query(`
    SELECT id, codigo, nombre, descripcion, url_callback, icono_bootstrap, color
    FROM sistemas
    WHERE activo = TRUE
    ORDER BY id
  `);
  return result.rows;
}

async function findByCode(codigo) {
  const result = await pool.query(
    `
    SELECT id, codigo, nombre, descripcion, url_callback, icono_bootstrap, color
    FROM sistemas
    WHERE UPPER(codigo) = UPPER($1)
    AND activo = TRUE
    LIMIT 1
  `,
    [codigo],
  );
  return result.rows[0] || null;
}

module.exports = { getActiveSystems, findByCode };
