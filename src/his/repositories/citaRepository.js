const pool = require("../config/db");
async function findAll() {
  const r = await pool.query(
    `SELECT c.id,c.fecha_hora,ec.nombre estado,e.nombre especialidad,CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente,p.numero_documento,c.motivo FROM citas c JOIN pacientes p ON p.id=c.paciente_id JOIN estados_cita ec ON ec.id=c.estado_id LEFT JOIN especialidades e ON e.id=c.especialidad_id ORDER BY c.fecha_hora DESC`,
  );
  return r.rows;
}
async function create(data) {
  const r = await pool.query(
    "INSERT INTO citas(paciente_id,especialidad_id,estado_id,fecha_hora,motivo) VALUES($1,$2,$3,$4,$5) RETURNING id",
    [
      data.paciente_id,
      data.especialidad_id || null,
      data.estado_id,
      data.fecha_hora,
      data.motivo || null,
    ],
  );
  return r.rows[0].id;
}
module.exports = { findAll, create };
