const pool = require("../config/db");
async function findAll(search = "") {
  const r = await pool.query(
    `SELECT p.id,td.codigo tipo_documento,p.numero_documento,CONCAT_WS(' ',p.primer_nombre,p.segundo_nombre,p.primer_apellido,p.segundo_apellido) nombre_completo,p.fecha_nacimiento,g.nombre genero,p.telefono,p.email FROM pacientes p JOIN tipos_documento td ON td.id=p.tipo_documento_id JOIN generos g ON g.id=p.genero_id WHERE p.activo=TRUE AND ($1='' OR p.numero_documento ILIKE '%'||$1||'%' OR p.primer_nombre ILIKE '%'||$1||'%' OR p.primer_apellido ILIKE '%'||$1||'%') ORDER BY p.created_at DESC LIMIT 100`,
    [search],
  );
  return r.rows;
}
async function findById(id) {
  const r = await pool.query(
    `SELECT p.*,td.codigo tipo_documento_codigo,td.nombre tipo_documento_nombre,g.nombre genero_nombre,hc.id historia_id,hc.numero_historia FROM pacientes p JOIN tipos_documento td ON td.id=p.tipo_documento_id JOIN generos g ON g.id=p.genero_id LEFT JOIN historias_clinicas hc ON hc.paciente_id=p.id WHERE p.id=$1`,
    [id],
  );
  return r.rows[0] || null;
}
async function create(data) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const pr = await c.query(
      `INSERT INTO pacientes(tipo_documento_id,numero_documento,primer_nombre,segundo_nombre,primer_apellido,segundo_apellido,fecha_nacimiento,genero_id,telefono,email,direccion) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      [
        data.tipo_documento_id,
        data.numero_documento,
        data.primer_nombre,
        data.segundo_nombre || null,
        data.primer_apellido,
        data.segundo_apellido || null,
        data.fecha_nacimiento,
        data.genero_id,
        data.telefono || null,
        data.email || null,
        data.direccion || null,
      ],
    );
    const id = pr.rows[0].id;
    await c.query(
      "INSERT INTO historias_clinicas(paciente_id,numero_historia) VALUES($1,$2)",
      [id, `HC-${data.numero_documento}`],
    );
    await c.query("COMMIT");
    return id;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
module.exports = { findAll, findById, create };
