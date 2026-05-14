const pool = require("../config/db");
async function stats() {
  const r = await pool.query(
    `SELECT (SELECT COUNT(*) FROM pacientes WHERE activo=TRUE)::int total_pacientes,(SELECT COUNT(*) FROM citas WHERE fecha_hora::date=CURRENT_DATE)::int citas_hoy,(SELECT COUNT(*) FROM ordenes_diagnosticas)::int total_ordenes,(SELECT COUNT(*) FROM notificaciones WHERE leida=FALSE)::int notificaciones`,
  );
  return r.rows[0];
}
async function recentOrders() {
  const r = await pool.query(
    `SELECT o.id,o.numero_orden,o.sistema_destino,eo.nombre estado,CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente,o.created_at FROM ordenes_diagnosticas o JOIN pacientes p ON p.id=o.paciente_id JOIN estados_orden eo ON eo.id=o.estado_id ORDER BY o.created_at DESC LIMIT 8`,
  );
  return r.rows;
}
async function notifications() {
  const r = await pool.query(
    "SELECT id,titulo,mensaje,created_at FROM notificaciones WHERE leida=FALSE ORDER BY created_at DESC LIMIT 8",
  );
  return r.rows;
}
module.exports = { stats, recentOrders, notifications };
