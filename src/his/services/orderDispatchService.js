const pool = require("../config/db");
async function dispatchOrderToDiagnosticSystem(orderId) {
  const payload = await buildOrderPayload(orderId);
  if (!payload) throw new Error("No existe la orden para enviar");
  const sys = await getIntegrationSystem(payload.sistema_destino);
  if (!sys)
    throw new Error(`No existe integración para ${payload.sistema_destino}`);
  const endpoint = `${sys.endpoint_base}/integracion/ordenes`;
  await saveIntegrationPayload(orderId, payload, endpoint);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-token": process.env.INTERNAL_API_TOKEN,
    },
    body: JSON.stringify(payload),
  });
  const body = await response
    .json()
    .catch(() => ({ ok: false, message: "Respuesta inválida" }));
  if (!response.ok || !body.ok) {
    await markIntegrationError(orderId, body.message || "Error enviando orden");
    throw new Error(body.message || "Error enviando orden");
  }
  await markIntegrationSuccess(orderId, body);
  return body;
}
async function getIntegrationSystem(code) {
  const r = await pool.query(
    "SELECT codigo,endpoint_base FROM sistemas_integracion WHERE codigo=$1 AND activo=TRUE LIMIT 1",
    [code],
  );
  return r.rows[0] || null;
}
async function buildOrderPayload(orderId) {
  const r = await pool.query(
    `SELECT o.id his_order_id,o.numero_orden,o.sistema_destino,pr.codigo prioridad,o.observaciones,p.id his_patient_id,td.codigo tipo_documento,p.numero_documento,p.primer_nombre,p.segundo_nombre,p.primer_apellido,p.segundo_apellido,p.fecha_nacimiento,g.codigo genero FROM ordenes_diagnosticas o JOIN pacientes p ON p.id=o.paciente_id JOIN tipos_documento td ON td.id=p.tipo_documento_id JOIN generos g ON g.id=p.genero_id JOIN prioridades_orden pr ON pr.id=o.prioridad_id WHERE o.id=$1`,
    [orderId],
  );
  const order = r.rows[0];
  if (!order) return null;
  const d = await pool.query(
    `SELECT pc.codigo codigo_cups,pc.nombre,pc.tipo,d.cantidad,d.observacion FROM detalle_orden d JOIN procedimientos_cups pc ON pc.id=d.procedimiento_id WHERE d.orden_id=$1`,
    [orderId],
  );
  return {
    his_order_id: order.his_order_id,
    numero_orden: order.numero_orden,
    sistema_destino: order.sistema_destino,
    prioridad: order.prioridad,
    observaciones: order.observaciones,
    paciente: {
      his_patient_id: order.his_patient_id,
      tipo_documento: order.tipo_documento,
      numero_documento: order.numero_documento,
      primer_nombre: order.primer_nombre,
      segundo_nombre: order.segundo_nombre,
      primer_apellido: order.primer_apellido,
      segundo_apellido: order.segundo_apellido,
      fecha_nacimiento: order.fecha_nacimiento,
      genero: order.genero,
    },
    procedimientos: d.rows,
  };
}
async function saveIntegrationPayload(orderId, payload, endpoint) {
  await pool.query(
    `UPDATE integraciones SET endpoint=$2,payload_json=$3,estado='PENDIENTE' WHERE orden_id=$1`,
    [orderId, endpoint, payload],
  );
}
async function markIntegrationSuccess(orderId, body) {
  const external = body.lis_order_id || body.ris_order_id || null;
  await pool.query(
    `UPDATE integraciones SET estado='ENVIADA',external_order_id=$2,response_json=$3,enviado_at=NOW(),confirmado_at=NOW(),ultimo_error=NULL WHERE orden_id=$1`,
    [orderId, external, body],
  );
  await pool.query(
    `UPDATE ordenes_diagnosticas SET estado_id=(SELECT id FROM estados_orden WHERE codigo='RECIBIDA' LIMIT 1),updated_at=NOW() WHERE id=$1`,
    [orderId],
  );
}
async function markIntegrationError(orderId, error) {
  await pool.query(
    `UPDATE integraciones SET estado='ERROR',intentos=intentos+1,ultimo_error=$2 WHERE orden_id=$1`,
    [orderId, error],
  );
}
module.exports = { dispatchOrderToDiagnosticSystem };
