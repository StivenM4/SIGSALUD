const pool = require("../config/db");
async function getMenuByPermissions(permissions) {
  const result = await pool.query(
    `SELECT texto, ruta, icono_bootstrap, permiso_requerido FROM his_menus WHERE activo = TRUE AND permiso_requerido = ANY($1) ORDER BY orden`,
    [permissions],
  );
  return result.rows;
}
module.exports = { getMenuByPermissions };
