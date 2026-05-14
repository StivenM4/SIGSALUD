const pool = require("../config/db");

const baseSelect = `
  SELECT rd.*, o.numero_orden, o.sistema_destino, p.id AS paciente_id, p.numero_documento,
         CONCAT_WS(' ', p.primer_nombre, p.segundo_nombre, p.primer_apellido, p.segundo_apellido) AS paciente
  FROM resultados_diagnosticos rd
  JOIN ordenes_diagnosticas o ON o.id = rd.orden_id
  JOIN pacientes p ON p.id = o.paciente_id`;

async function findAll() {
  const r = await pool.query(
    `${baseSelect} ORDER BY rd.recibido_at DESC LIMIT 300`,
  );
  return r.rows;
}
async function findByOrigin(origin) {
  const r = await pool.query(
    `${baseSelect} WHERE rd.sistema_origen=$1 ORDER BY rd.recibido_at DESC LIMIT 300`,
    [origin],
  );
  return r.rows;
}
async function findById(id) {
  const r = await pool.query(`${baseSelect} WHERE rd.id=$1 LIMIT 1`, [id]);
  return r.rows[0] || null;
}
async function findByPacienteId(pacienteId) {
  const r = await pool.query(
    `${baseSelect} WHERE p.id=$1 ORDER BY rd.recibido_at DESC`,
    [pacienteId],
  );
  return r.rows;
}
async function ordersWithResultsByPatient(pacienteId) {
  const r = await pool.query(
    `
    SELECT o.id, o.numero_orden, o.sistema_destino, eo.nombre estado, o.created_at,
           COUNT(rd.id)::int AS total_resultados
    FROM ordenes_diagnosticas o
    JOIN estados_orden eo ON eo.id=o.estado_id
    LEFT JOIN resultados_diagnosticos rd ON rd.orden_id=o.id
    WHERE o.paciente_id=$1
    GROUP BY o.id,o.numero_orden,o.sistema_destino,eo.nombre,o.created_at
    ORDER BY o.created_at DESC`,
    [pacienteId],
  );
  return r.rows;
}
module.exports = {
  findAll,
  findByOrigin,
  findById,
  findByPacienteId,
  ordersWithResultsByPatient,
};
