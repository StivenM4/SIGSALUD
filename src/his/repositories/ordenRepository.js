const pool = require("../config/db");
async function findAll() {
  const r = await pool.query(
    `SELECT o.id,o.numero_orden,o.sistema_destino,t.nombre tipo_orden,pr.nombre prioridad,eo.nombre estado,CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente,p.numero_documento,o.created_at FROM ordenes_diagnosticas o JOIN pacientes p ON p.id=o.paciente_id JOIN tipos_orden_diagnostica t ON t.id=o.tipo_orden_id JOIN prioridades_orden pr ON pr.id=o.prioridad_id JOIN estados_orden eo ON eo.id=o.estado_id ORDER BY o.created_at DESC LIMIT 100`,
  );
  return r.rows;
}
async function findResults() {
  const r = await pool.query(
    `SELECT rd.*,o.numero_orden,CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente FROM resultados_diagnosticos rd JOIN ordenes_diagnosticas o ON o.id=rd.orden_id JOIN pacientes p ON p.id=o.paciente_id ORDER BY rd.recibido_at DESC`,
  );
  return r.rows;
}
async function create(data) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const h = await c.query(
      "SELECT id FROM historias_clinicas WHERE paciente_id=$1",
      [data.paciente_id],
    );
    if (!h.rows[0]) throw new Error("Paciente sin historia clínica");
    const tipo = await c.query(
      "SELECT id,sistema_destino FROM tipos_orden_diagnostica WHERE id=$1",
      [data.tipo_orden_id],
    );
    if (!tipo.rows[0]) throw new Error("Tipo de orden no válido");
    const estado = await c.query(
      "SELECT id FROM estados_orden WHERE codigo='CREADA'",
    );
    const numero = `ORD-${Date.now()}`;
    const o = await c.query(
      `INSERT INTO ordenes_diagnosticas(numero_orden,paciente_id,historia_id,tipo_orden_id,prioridad_id,estado_id,sistema_destino,observaciones,creado_por) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [
        numero,
        data.paciente_id,
        h.rows[0].id,
        data.tipo_orden_id,
        data.prioridad_id,
        estado.rows[0].id,
        tipo.rows[0].sistema_destino,
        data.observaciones || null,
        data.creado_por || null,
      ],
    );
    const ordenId = o.rows[0].id;
    for (const procedimientoId of data.procedimientos) {
      await c.query(
        "INSERT INTO detalle_orden(orden_id,procedimiento_id) VALUES($1,$2)",
        [ordenId, procedimientoId],
      );
    }
    await c.query(
      "INSERT INTO integraciones(orden_id,sistema_destino,estado) VALUES($1,$2,$3)",
      [ordenId, tipo.rows[0].sistema_destino, "PENDIENTE"],
    );
    await c.query("COMMIT");
    return ordenId;
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
module.exports = { findAll, findResults, create };
