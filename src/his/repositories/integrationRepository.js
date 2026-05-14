const pool = require("../config/db");
async function saveDiagnosticResult(data) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const o = await c.query(
      "SELECT id,paciente_id,historia_id,numero_orden FROM ordenes_diagnosticas WHERE id=$1",
      [data.his_order_id],
    );
    if (!o.rows[0]) throw new Error("La orden HIS no existe");
    const order = o.rows[0];
    const ins = await c.query(
      `INSERT INTO resultados_diagnosticos(orden_id,sistema_origen,tipo_resultado,resumen,url_documento,referencia_externa,resultado_json,validado_por,fecha_validacion) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [
        order.id,
        data.sistema_origen,
        data.tipo_resultado,
        data.resumen || null,
        data.url_documento || null,
        data.lis_order_id || data.ris_order_id || data.estudio_ris_id || null,
        data,
        data.validado_por?.nombre || data.informe?.validado_por || null,
        data.fecha_validacion || data.informe?.fecha_validacion || null,
      ],
    );
    const estado = await c.query(
      "SELECT id FROM estados_orden WHERE codigo='RESULTADO_DISPONIBLE'",
    );
    await c.query(
      "UPDATE ordenes_diagnosticas SET estado_id=$1,updated_at=NOW() WHERE id=$2",
      [estado.rows[0].id, order.id],
    );
    await c.query(
      "INSERT INTO notificaciones(paciente_id,orden_id,titulo,mensaje) VALUES($1,$2,$3,$4)",
      [
        order.paciente_id,
        order.id,
        `Resultado disponible - ${data.sistema_origen}`,
        `La orden ${order.numero_orden} ya tiene resultado disponible para revisión en historia clínica.`,
      ],
    );
    await c.query(
      "INSERT INTO auditoria_his(accion,entidad,entidad_id,detalle) VALUES($1,$2,$3,$4)",
      [
        "RECIBIR_RESULTADO_INTEGRACION",
        "resultados_diagnosticos",
        ins.rows[0].id,
        `Resultado recibido desde ${data.sistema_origen}`,
      ],
    );
    await c.query("COMMIT");
    return ins.rows[0];
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
async function updateOrderStatus({ ordenId, estadoCodigo }) {
  const r = await pool.query(
    `UPDATE ordenes_diagnosticas SET estado_id=(SELECT id FROM estados_orden WHERE codigo=$2 LIMIT 1),updated_at=NOW() WHERE id=$1 RETURNING id,numero_orden`,
    [ordenId, estadoCodigo],
  );
  if (!r.rows[0]) throw new Error("No fue posible actualizar la orden");
  return r.rows[0];
}
module.exports = { saveDiagnosticResult, updateOrderStatus };

async function syncOrderFromOrigin(ordenId) {
  const o = await pool.query(
    "SELECT id,sistema_destino FROM ordenes_diagnosticas WHERE id=$1",
    [ordenId],
  );
  if (!o.rows[0]) throw new Error("Orden no encontrada en HIS");
  const system = o.rows[0].sistema_destino;
  const base =
    system === "LIS" ? process.env.LIS_API_URL : process.env.RIS_API_URL;
  const path =
    system === "LIS"
      ? `/integracion/resultados/${ordenId}`
      : `/integracion/informes/${ordenId}`;
  const response = await fetch(`${base}${path}`, {
    headers: { "x-internal-token": process.env.INTERNAL_API_TOKEN },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok || !body || !body.ok)
    throw new Error(body?.message || `No se pudo sincronizar desde ${system}`);
  if (body.resultado || body.informe) {
    return saveDiagnosticResult(body.resultado || body.informe);
  }
  return body;
}
module.exports.syncOrderFromOrigin = syncOrderFromOrigin;
