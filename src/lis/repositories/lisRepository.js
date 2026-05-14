const pool = require("../config/db");
async function stats() {
  const r = await pool.query(
    `SELECT (SELECT COUNT(*) FROM ordenes_laboratorio)::int ordenes,(SELECT COUNT(*) FROM muestras_laboratorio)::int muestras,(SELECT COUNT(*) FROM resultados_laboratorio)::int resultados,(SELECT COUNT(*) FROM validaciones_resultado)::int validaciones`,
  );
  return r.rows[0];
}
async function orders() {
  const r = await pool.query(
    `SELECT o.*,e.nombre estado,CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente,p.numero_documento FROM ordenes_laboratorio o JOIN pacientes_lis p ON p.id=o.paciente_id JOIN estados_orden_laboratorio e ON e.id=o.estado_id ORDER BY o.created_at DESC`,
  );
  return r.rows;
}
async function orderById(id) {
  const o = await pool.query(
    `SELECT o.*,CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente,p.numero_documento FROM ordenes_laboratorio o JOIN pacientes_lis p ON p.id=o.paciente_id WHERE o.id=$1`,
    [id],
  );
  const d = await pool.query(
    `SELECT d.*,pl.nombre,pl.codigo_cups,pl.unidad,pl.valor_referencia FROM detalle_orden_laboratorio d JOIN pruebas_laboratorio pl ON pl.id=d.prueba_id WHERE d.orden_id=$1`,
    [id],
  );
  return { order: o.rows[0], details: d.rows };
}
async function samples() {
  const r = await pool.query(
    `SELECT m.*,tm.nombre tipo_muestra,o.numero_orden_his,CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente FROM muestras_laboratorio m JOIN tipos_muestra tm ON tm.id=m.tipo_muestra_id JOIN ordenes_laboratorio o ON o.id=m.orden_id JOIN pacientes_lis p ON p.id=o.paciente_id ORDER BY m.created_at DESC`,
  );
  return r.rows;
}
async function collectSample(orderId, userId) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const tipo = await c.query(
      `SELECT DISTINCT pl.tipo_muestra_id FROM detalle_orden_laboratorio d JOIN pruebas_laboratorio pl ON pl.id=d.prueba_id WHERE d.orden_id=$1 LIMIT 1`,
      [orderId],
    );
    if (!tipo.rows[0])
      throw new Error("La orden no tiene pruebas configuradas");
    const seq = await c.query("SELECT nextval('lis_codigo_muestra_seq') n");
    const code = `M-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${String(seq.rows[0].n).padStart(4, "0")}`;
    const m = await c.query(
      "INSERT INTO muestras_laboratorio(orden_id,tipo_muestra_id,codigo_muestra,tomada_por) VALUES($1,$2,$3,$4) RETURNING id,codigo_muestra",
      [orderId, tipo.rows[0].tipo_muestra_id, code, userId],
    );
    await c.query(
      "UPDATE ordenes_laboratorio SET estado_id=(SELECT id FROM estados_orden_laboratorio WHERE codigo='MUESTRA_TOMADA') WHERE id=$1",
      [orderId],
    );
    await c.query("COMMIT");
    return m.rows[0];
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
async function saveResults(orderId, body, userId) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const details = await c.query(
      "SELECT prueba_id FROM detalle_orden_laboratorio WHERE orden_id=$1",
      [orderId],
    );
    for (const d of details.rows) {
      const value = body[`resultado_${d.prueba_id}`] || "Pendiente";
      await c.query(
        `INSERT INTO resultados_laboratorio(orden_id,prueba_id,resultado,registrado_por) VALUES($1,$2,$3,$4) ON CONFLICT(orden_id,prueba_id) DO UPDATE SET resultado=EXCLUDED.resultado,registrado_por=EXCLUDED.registrado_por`,
        [orderId, d.prueba_id, value, userId],
      );
    }
    await c.query(
      "UPDATE ordenes_laboratorio SET estado_id=(SELECT id FROM estados_orden_laboratorio WHERE codigo='RESULTADO_REGISTRADO') WHERE id=$1",
      [orderId],
    );
    await c.query("COMMIT");
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
async function validateOrder(orderId, userId) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    await c.query(
      "UPDATE resultados_laboratorio SET validado=TRUE WHERE orden_id=$1",
      [orderId],
    );
    const v = await c.query(
      "INSERT INTO validaciones_resultado(orden_id,validado_por,observacion) VALUES($1,$2,$3) RETURNING id",
      [orderId, userId, "Validación electrónica"],
    );
    await c.query(
      "UPDATE ordenes_laboratorio SET estado_id=(SELECT id FROM estados_orden_laboratorio WHERE codigo='VALIDADO') WHERE id=$1",
      [orderId],
    );
    await c.query("COMMIT");
    return v.rows[0];
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
async function validatedOrders() {
  const r = await pool.query(
    `SELECT o.*,CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente FROM ordenes_laboratorio o JOIN pacientes_lis p ON p.id=o.paciente_id JOIN estados_orden_laboratorio e ON e.id=o.estado_id WHERE e.codigo IN ('RESULTADO_REGISTRADO','VALIDADO') ORDER BY o.created_at DESC`,
  );
  return r.rows;
}
async function updateSent(orderId) {
  await pool.query(
    "UPDATE ordenes_laboratorio SET enviado_his=TRUE,enviado_his_at=NOW(),estado_id=(SELECT id FROM estados_orden_laboratorio WHERE codigo='ENVIADO_HIS') WHERE id=$1",
    [orderId],
  );
}
module.exports = {
  stats,
  orders,
  orderById,
  samples,
  collectSample,
  saveResults,
  validateOrder,
  validatedOrders,
  updateSent,
};

async function reports() {
  const r =
    await pool.query(`SELECT rp.*, o.numero_orden_his, CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente, p.numero_documento
    FROM reportes_laboratorio rp JOIN ordenes_laboratorio o ON o.id=rp.orden_id JOIN pacientes_lis p ON p.id=o.paciente_id
    ORDER BY rp.created_at DESC LIMIT 200`);
  return r.rows;
}
async function validationDetail(orderId) {
  const data = await orderById(orderId);
  const muestras = await pool.query(
    `SELECT m.*,tm.nombre tipo_muestra FROM muestras_laboratorio m LEFT JOIN tipos_muestra tm ON tm.id=m.tipo_muestra_id WHERE m.orden_id=$1 ORDER BY m.created_at DESC`,
    [orderId],
  );
  const resultados = await pool.query(
    `SELECT rl.*,pl.codigo_cups,pl.nombre prueba,COALESCE(rl.unidad,pl.unidad) unidad,COALESCE(rl.valor_referencia,pl.valor_referencia) valor_referencia FROM resultados_laboratorio rl JOIN pruebas_laboratorio pl ON pl.id=rl.prueba_id WHERE rl.orden_id=$1 ORDER BY pl.nombre`,
    [orderId],
  );
  const validaciones = await pool.query(
    "SELECT * FROM validaciones_resultado WHERE orden_id=$1 ORDER BY created_at DESC",
    [orderId],
  );
  return {
    ...data,
    muestras: muestras.rows,
    resultados: resultados.rows,
    validaciones: validaciones.rows,
  };
}
async function resultOrders() {
  const r =
    await pool.query(`SELECT o.*, e.nombre estado, CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente, p.numero_documento,
    COUNT(rl.id)::int total_resultados
    FROM ordenes_laboratorio o JOIN pacientes_lis p ON p.id=o.paciente_id JOIN estados_orden_laboratorio e ON e.id=o.estado_id
    LEFT JOIN resultados_laboratorio rl ON rl.orden_id=o.id
    GROUP BY o.id,e.nombre,p.id ORDER BY o.created_at DESC LIMIT 200`);
  return r.rows;
}
async function patients(search = "") {
  const r = await pool.query(
    `SELECT p.*, COUNT(o.id)::int ordenes FROM pacientes_lis p LEFT JOIN ordenes_laboratorio o ON o.paciente_id=p.id
    WHERE $1='' OR p.numero_documento ILIKE '%'||$1||'%' OR p.primer_nombre ILIKE '%'||$1||'%' OR p.primer_apellido ILIKE '%'||$1||'%'
    GROUP BY p.id ORDER BY p.created_at DESC LIMIT 150`,
    [search],
  );
  return r.rows;
}
async function patientHistory(patientId) {
  const paciente = (
    await pool.query("SELECT * FROM pacientes_lis WHERE id=$1", [patientId])
  ).rows[0];
  const ordenes = await pool.query(
    `SELECT o.*,e.nombre estado FROM ordenes_laboratorio o JOIN estados_orden_laboratorio e ON e.id=o.estado_id WHERE o.paciente_id=$1 ORDER BY o.created_at DESC`,
    [patientId],
  );
  const resultados = await pool.query(
    `SELECT rl.*,pl.codigo_cups,pl.nombre prueba,o.numero_orden_his,o.id orden_id FROM resultados_laboratorio rl JOIN pruebas_laboratorio pl ON pl.id=rl.prueba_id JOIN ordenes_laboratorio o ON o.id=rl.orden_id WHERE o.paciente_id=$1 ORDER BY rl.created_at DESC`,
    [patientId],
  );
  return { paciente, ordenes: ordenes.rows, resultados: resultados.rows };
}
async function audit() {
  const r = await pool.query(
    "SELECT * FROM auditoria_lis ORDER BY created_at DESC LIMIT 300",
  );
  return r.rows;
}
module.exports.reports = reports;
module.exports.validationDetail = validationDetail;
module.exports.resultOrders = resultOrders;
module.exports.patients = patients;
module.exports.patientHistory = patientHistory;
module.exports.audit = audit;
