const pool = require("../config/db");
async function getMenuByPermissions(permissions) {
  const r = await pool.query(
    "SELECT texto,ruta,icono_bootstrap,permiso_requerido FROM ris_menus WHERE activo=TRUE AND permiso_requerido=ANY($1) ORDER BY orden",
    [permissions],
  );
  return r.rows;
}
module.exports = { getMenuByPermissions };
