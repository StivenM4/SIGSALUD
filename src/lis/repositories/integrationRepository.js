const pool = require("../config/db");
async function createOrderFromHis(payload) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const pr = await c.query(
      `INSERT INTO pacientes_lis(his_patient_id,tipo_documento,numero_documento,primer_nombre,segundo_nombre,primer_apellido,segundo_apellido,fecha_nacimiento,genero) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(his_patient_id) DO UPDATE SET numero_documento=EXCLUDED.numero_documento,primer_nombre=EXCLUDED.primer_nombre,primer_apellido=EXCLUDED.primer_apellido RETURNING id`,
      [
        payload.paciente.his_patient_id,
        payload.paciente.tipo_documento,
        payload.paciente.numero_documento,
        payload.paciente.primer_nombre,
        payload.paciente.segundo_nombre,
        payload.paciente.primer_apellido,
        payload.paciente.segundo_apellido,
        payload.paciente.fecha_nacimiento,
        payload.paciente.genero,
      ],
    );
    const estado = await c.query(
      "SELECT id FROM estados_orden_laboratorio WHERE codigo='PENDIENTE'",
    );
    const o = await c.query(
      `INSERT INTO ordenes_laboratorio(his_order_id,numero_orden_his,paciente_id,prioridad,estado_id,observaciones,payload_his) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT(his_order_id) DO UPDATE SET payload_his=EXCLUDED.payload_his RETURNING id`,
      [
        payload.his_order_id,
        payload.numero_orden,
        pr.rows[0].id,
        payload.prioridad,
        estado.rows[0].id,
        payload.observaciones,
        payload,
      ],
    );
    for (const item of payload.procedimientos) {
      const prueba = await c.query(
        "SELECT id FROM pruebas_laboratorio WHERE codigo_cups=$1 LIMIT 1",
        [item.codigo_cups],
      );
      if (prueba.rows[0])
        await c.query(
          "INSERT INTO detalle_orden_laboratorio(orden_id,prueba_id,cantidad) VALUES($1,$2,$3) ON CONFLICT DO NOTHING",
          [o.rows[0].id, prueba.rows[0].id, item.cantidad || 1],
        );
    }
    await c.query(
      "INSERT INTO integracion_his_lis(his_order_id,lis_order_id,evento,estado,payload_json) VALUES($1,$2,'RECIBIR_ORDEN','RECIBIDA',$3)",
      [payload.his_order_id, o.rows[0].id, payload],
    );
    await c.query("COMMIT");
    return { id: o.rows[0].id };
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
module.exports = { createOrderFromHis };

async function getResultByHisOrderId(hisOrderId) {
  const order = await pool.query(
    "SELECT id,his_order_id,numero_orden_his FROM ordenes_laboratorio WHERE his_order_id=$1 LIMIT 1",
    [hisOrderId],
  );
  if (!order.rows[0]) return null;
  const results = await pool.query(
    `SELECT pl.codigo_cups,pl.nombre prueba,rl.resultado,COALESCE(rl.unidad,pl.unidad) unidad,COALESCE(rl.valor_referencia,pl.valor_referencia) valor_referencia,rl.es_critico
    FROM resultados_laboratorio rl JOIN pruebas_laboratorio pl ON pl.id=rl.prueba_id WHERE rl.orden_id=$1`,
    [order.rows[0].id],
  );
  return {
    his_order_id: order.rows[0].his_order_id,
    lis_order_id: order.rows[0].id,
    sistema_origen: "LIS",
    tipo_resultado: "LABORATORIO",
    estado: "VALIDADO",
    resumen: "Resultados de laboratorio consultados en línea desde LIS.",
    url_documento: `${process.env.LIS_PUBLIC_URL}/reportes/${order.rows[0].id}`,
    validado_por: { nombre: "LIS" },
    resultados: results.rows,
  };
}
module.exports.getResultByHisOrderId = getResultByHisOrderId;
