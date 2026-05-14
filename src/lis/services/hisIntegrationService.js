const pool = require("../config/db");
const lis = require("../repositories/lisRepository");
async function sendValidatedResultToHis(orderId) {
  const payload = await buildResultPayload(orderId);
  const response = await fetch(
    `${process.env.HIS_API_URL}/integracion/lis/resultados`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-token": process.env.INTERNAL_API_TOKEN,
      },
      body: JSON.stringify(payload),
    },
  );
  const body = await response
    .json()
    .catch(() => ({ ok: false, message: "Respuesta inválida" }));
  if (!response.ok || !body.ok)
    throw new Error(body.message || "No fue posible enviar al HIS");
  await lis.updateSent(orderId);
  return body;
}
async function buildResultPayload(orderId) {
  const o = await pool.query(
    `SELECT o.id,o.his_order_id,o.numero_orden_his FROM ordenes_laboratorio o WHERE o.id=$1`,
    [orderId],
  );
  if (!o.rows[0]) throw new Error("Orden no encontrada");
  const r = await pool.query(
    `SELECT pl.codigo_cups,pl.nombre prueba,rl.resultado,COALESCE(rl.unidad,pl.unidad) unidad,COALESCE(rl.valor_referencia,pl.valor_referencia) valor_referencia,rl.es_critico FROM resultados_laboratorio rl JOIN pruebas_laboratorio pl ON pl.id=rl.prueba_id WHERE rl.orden_id=$1`,
    [orderId],
  );
  return {
    his_order_id: o.rows[0].his_order_id,
    lis_order_id: o.rows[0].id,
    sistema_origen: "LIS",
    tipo_resultado: "LABORATORIO",
    estado: "VALIDADO",
    resumen: "Resultados de laboratorio validados.",
    url_documento: `${process.env.LIS_PUBLIC_URL}/reportes/${o.rows[0].id}`,
    validado_por: { nombre: "Bacteriólogo LIS" },
    resultados: r.rows,
  };
}
module.exports = { sendValidatedResultToHis };
