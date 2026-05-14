const pool = require("../config/db");
async function sendValidatedReportToHis(informeId) {
  const payload = await buildReportPayload(informeId);
  const response = await fetch(
    `${process.env.HIS_API_URL}/integracion/ris/informes`,
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
    throw new Error(body.message || "No fue posible enviar informe al HIS");
  await pool.query(
    "UPDATE informes_radiologia SET enviado_his=TRUE,enviado_his_at=NOW() WHERE id=$1",
    [informeId],
  );
  return body;
}
async function buildReportPayload(informeId) {
  const r = await pool.query(
    `SELECT ir.id informe_id,ir.pregunta_clinica,ir.tecnica_usada,ir.hallazgos,ir.conclusion,ir.validado_at,ir.validado_por,e.id estudio_ris_id,e.descripcion,o.id ris_order_id,o.his_order_id,ep.orthanc_study_id,ep.url_visualizacion FROM informes_radiologia ir JOIN estudios_radiologicos e ON e.id=ir.estudio_id JOIN ordenes_radiologia o ON o.id=e.orden_id LEFT JOIN estudios_pacs ep ON ep.estudio_id=e.id WHERE ir.id=$1`,
    [informeId],
  );
  const i = r.rows[0];
  if (!i) throw new Error("Informe no encontrado");
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
module.exports = { sendValidatedReportToHis };
