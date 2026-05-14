const pool = require("../config/db");
async function findAll() {
  const r =
    await pool.query(`SELECT n.*, p.numero_documento, CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente, o.numero_orden
    FROM notificaciones n
    LEFT JOIN pacientes p ON p.id=n.paciente_id
    LEFT JOIN ordenes_diagnosticas o ON o.id=n.orden_id
    ORDER BY n.created_at DESC LIMIT 200`);
  return r.rows;
}
async function markRead(id) {
  await pool.query("UPDATE notificaciones SET leida=TRUE WHERE id=$1", [id]);
}
module.exports = { findAll, markRead };
