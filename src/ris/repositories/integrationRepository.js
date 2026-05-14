const pool = require("../config/db");
async function createRadiologyOrderFromHis(payload) {
  const c = await pool.connect();
  try {
    await c.query("BEGIN");
    const pr = await c.query(
      `INSERT INTO pacientes_ris(his_patient_id,tipo_documento,numero_documento,primer_nombre,segundo_nombre,primer_apellido,segundo_apellido,fecha_nacimiento,genero) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT(his_patient_id) DO UPDATE SET numero_documento=EXCLUDED.numero_documento,primer_nombre=EXCLUDED.primer_nombre,primer_apellido=EXCLUDED.primer_apellido RETURNING id`,
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
    const o = await c.query(
      `INSERT INTO ordenes_radiologia(his_order_id,numero_orden_his,paciente_id,prioridad,observaciones,payload_his) VALUES($1,$2,$3,$4,$5,$6) ON CONFLICT(his_order_id) DO UPDATE SET payload_his=EXCLUDED.payload_his RETURNING id`,
      [
        payload.his_order_id,
        payload.numero_orden,
        pr.rows[0].id,
        payload.prioridad,
        payload.observaciones,
        payload,
      ],
    );
    const estado = await c.query(
      "SELECT id FROM estados_estudio_radiologia WHERE codigo='ADMITIDO'",
    );
    let estudioId = null;
    for (const item of payload.procedimientos) {
      const mod = await c.query(
        "SELECT id FROM modalidades WHERE codigo=COALESCE($1,codigo) LIMIT 1",
        [item.modalidad || "CR"],
      );
      const er = await c.query(
        "INSERT INTO estudios_radiologicos(orden_id,paciente_id,modalidad_id,estado_id,descripcion,codigo_cups) VALUES($1,$2,$3,$4,$5,$6) RETURNING id",
        [
          o.rows[0].id,
          pr.rows[0].id,
          mod.rows[0]?.id || null,
          estado.rows[0].id,
          item.nombre,
          item.codigo_cups,
        ],
      );
      estudioId = er.rows[0].id;
      await c.query(
        "INSERT INTO historial_estado_estudio(estudio_id,estado_id,observacion) VALUES($1,$2,$3)",
        [estudioId, estado.rows[0].id, "Recibido desde HIS"],
      );
    }
    await c.query(
      "INSERT INTO integracion_his_ris(his_order_id,ris_order_id,evento,estado,payload_json) VALUES($1,$2,'RECIBIR_ORDEN','RECIBIDA',$3)",
      [payload.his_order_id, o.rows[0].id, payload],
    );
    await c.query("COMMIT");
    return { orden_ris_id: o.rows[0].id, estudio_ris_id: estudioId };
  } catch (e) {
    await c.query("ROLLBACK");
    throw e;
  } finally {
    c.release();
  }
}
module.exports = { createRadiologyOrderFromHis };

async function getReportByHisOrderId(hisOrderId) {
  const r = await pool.query(
    `SELECT ir.id informe_id, ir.pregunta_clinica, ir.tecnica_usada, ir.hallazgos, ir.conclusion, ir.validado_at, ir.validado_por,
      e.id estudio_ris_id, e.descripcion, o.id ris_order_id, o.his_order_id, ep.orthanc_study_id, ep.url_visualizacion
    FROM ordenes_radiologia o
    JOIN estudios_radiologicos e ON e.orden_id=o.id
    LEFT JOIN informes_radiologia ir ON ir.estudio_id=e.id
    LEFT JOIN estudios_pacs ep ON ep.estudio_id=e.id
    WHERE o.his_order_id=$1
    ORDER BY ir.created_at DESC NULLS LAST LIMIT 1`,
    [hisOrderId],
  );
  const i = r.rows[0];
  if (!i || !i.informe_id) return null;
  return {
    his_order_id: i.his_order_id,
    ris_order_id: i.ris_order_id,
    estudio_ris_id: i.estudio_ris_id,
    sistema_origen: "RIS",
    tipo_resultado: "INFORME_RADIOLOGICO",
    estado: "DEFINITIVO",
    resumen: i.conclusion,
    url_documento: `${process.env.RIS_PUBLIC_URL}/informes/${i.informe_id}`,
    orthanc: {
      orthanc_study_id: i.orthanc_study_id,
      url_visualizacion: i.url_visualizacion,
    },
    informe: {
      pregunta_clinica: i.pregunta_clinica,
      tecnica_usada: i.tecnica_usada,
      hallazgos: i.hallazgos,
      conclusion: i.conclusion,
      validado_por: i.validado_por,
      fecha_validacion: i.validado_at,
    },
  };
}
module.exports.getReportByHisOrderId = getReportByHisOrderId;
