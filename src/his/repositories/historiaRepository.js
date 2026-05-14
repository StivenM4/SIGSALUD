const pool = require("../config/db");
async function findAll(search = "") {
  const r = await pool.query(
    `
    SELECT hc.id, hc.numero_historia, hc.estado, hc.created_at, p.id paciente_id, p.numero_documento,
           CONCAT_WS(' ',p.primer_nombre,p.segundo_nombre,p.primer_apellido,p.segundo_apellido) paciente,
           COUNT(o.id)::int ordenes
    FROM historias_clinicas hc
    JOIN pacientes p ON p.id=hc.paciente_id
    LEFT JOIN ordenes_diagnosticas o ON o.historia_id=hc.id
    WHERE $1='' OR p.numero_documento ILIKE '%'||$1||'%' OR p.primer_nombre ILIKE '%'||$1||'%' OR p.primer_apellido ILIKE '%'||$1||'%'
    GROUP BY hc.id,p.id
    ORDER BY hc.created_at DESC LIMIT 150`,
    [search],
  );
  return r.rows;
}
async function showByPatient(pacienteId) {
  const paciente = await pool.query(
    `
    SELECT p.*, td.codigo tipo_documento, g.nombre genero, hc.id historia_id, hc.numero_historia, hc.estado historia_estado
    FROM pacientes p
    JOIN tipos_documento td ON td.id=p.tipo_documento_id
    JOIN generos g ON g.id=p.genero_id
    LEFT JOIN historias_clinicas hc ON hc.paciente_id=p.id
    WHERE p.id=$1`,
    [pacienteId],
  );
  const antecedentes = await pool.query(
    "SELECT * FROM antecedentes WHERE historia_id=$1 ORDER BY created_at DESC",
    [paciente.rows[0]?.historia_id],
  );
  const atenciones = await pool.query(
    "SELECT * FROM atenciones WHERE historia_id=$1 ORDER BY created_at DESC",
    [paciente.rows[0]?.historia_id],
  );
  return {
    paciente: paciente.rows[0] || null,
    antecedentes: antecedentes.rows,
    atenciones: atenciones.rows,
  };
}
module.exports = { findAll, showByPatient };
