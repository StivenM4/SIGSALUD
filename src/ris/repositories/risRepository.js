const pool = require("../config/db");
async function stats() {
  const r = await pool.query(
    `SELECT (SELECT COUNT(*) FROM ordenes_radiologia)::int ordenes,(SELECT COUNT(*) FROM estudios_radiologicos)::int estudios,(SELECT COUNT(*) FROM informes_radiologia)::int informes,(SELECT COUNT(*) FROM estudios_pacs)::int pacs`,
  );
  return r.rows[0];
}
async function orders() {
  const r = await pool.query(
    `SELECT o.*,CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente,p.numero_documento FROM ordenes_radiologia o JOIN pacientes_ris p ON p.id=o.paciente_id ORDER BY o.created_at DESC`,
  );
  return r.rows;
}
async function studies() {
  const r = await pool.query(
    `SELECT e.*,o.numero_orden_his,CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente,m.codigo modalidad,es.nombre estado FROM estudios_radiologicos e JOIN ordenes_radiologia o ON o.id=e.orden_id JOIN pacientes_ris p ON p.id=e.paciente_id LEFT JOIN modalidades m ON m.id=e.modalidad_id JOIN estados_estudio_radiologia es ON es.id=e.estado_id ORDER BY e.created_at DESC`,
  );
  return r.rows;
}
async function studyById(id) {
  const r = await pool.query(
    `SELECT e.*,o.his_order_id,o.numero_orden_his,CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente,p.numero_documento,m.codigo modalidad,es.nombre estado FROM estudios_radiologicos e JOIN ordenes_radiologia o ON o.id=e.orden_id JOIN pacientes_ris p ON p.id=e.paciente_id LEFT JOIN modalidades m ON m.id=e.modalidad_id JOIN estados_estudio_radiologia es ON es.id=e.estado_id WHERE e.id=$1`,
    [id],
  );
  return r.rows[0] || null;
}
async function markExecuted(id) {
  const estado = await pool.query(
    "SELECT id FROM estados_estudio_radiologia WHERE codigo='EJECUTADO_TECNICO'",
  );
  await pool.query(
    "UPDATE estudios_radiologicos SET estado_id=$1,updated_at=NOW() WHERE id=$2",
    [estado.rows[0].id, id],
  );
}
async function reports() {
  const r = await pool.query(
    `SELECT ir.*,e.descripcion,o.numero_orden_his,CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente FROM informes_radiologia ir JOIN estudios_radiologicos e ON e.id=ir.estudio_id JOIN ordenes_radiologia o ON o.id=e.orden_id JOIN pacientes_ris p ON p.id=e.paciente_id ORDER BY ir.created_at DESC`,
  );
  return r.rows;
}
async function createOrUpdateReport(estudioId, data) {
  const r = await pool.query(
    `INSERT INTO informes_radiologia(estudio_id,hallazgos,conclusion,estado) VALUES($1,$2,$3,'BORRADOR') ON CONFLICT DO NOTHING RETURNING id`,
    [estudioId, data.hallazgos, data.conclusion],
  );
  if (r.rows[0]) return r.rows[0].id;
  const u = await pool.query(
    "UPDATE informes_radiologia SET hallazgos=$2,conclusion=$3 WHERE estudio_id=$1 RETURNING id",
    [estudioId, data.hallazgos, data.conclusion],
  );
  return u.rows[0].id;
}
async function validateReport(informeId, user) {
  const r = await pool.query(
    "UPDATE informes_radiologia SET estado='DEFINITIVO',validado_por=$2,validado_at=NOW() WHERE id=$1 RETURNING id,estudio_id",
    [informeId, user.nombre],
  );
  const estado = await pool.query(
    "SELECT id FROM estados_estudio_radiologia WHERE codigo='DEFINITIVO'",
  );
  if (r.rows[0])
    await pool.query(
      "UPDATE estudios_radiologicos SET estado_id=$1 WHERE id=$2",
      [estado.rows[0].id, r.rows[0].estudio_id],
    );
  return r.rows[0];
}
async function savePacsReference(estudioId, orthancStudyId) {
  const url = `${process.env.ORTHANC_VIEWER_BASE || process.env.ORTHANC_URL}/app/explorer.html#study?uuid=${orthancStudyId}`;
  const r = await pool.query(
    "INSERT INTO estudios_pacs(estudio_id,orthanc_study_id,url_visualizacion) VALUES($1,$2,$3) RETURNING id",
    [estudioId, orthancStudyId, url],
  );
  const estado = await pool.query(
    "SELECT id FROM estados_estudio_radiologia WHERE codigo='IMAGENES_DISPONIBLES'",
  );
  await pool.query(
    "UPDATE estudios_radiologicos SET estado_id=$1 WHERE id=$2",
    [estado.rows[0].id, estudioId],
  );
  return r.rows[0];
}
async function pacsByStudy(estudioId) {
  const r = await pool.query(
    "SELECT * FROM estudios_pacs WHERE estudio_id=$1 ORDER BY created_at DESC",
    [estudioId],
  );
  return r.rows;
}
module.exports = {
  stats,
  orders,
  studies,
  studyById,
  markExecuted,
  reports,
  createOrUpdateReport,
  validateReport,
  savePacsReference,
  pacsByStudy,
};

function stateLetter(codigo) {
  if (codigo === "ADMITIDO") return "A";
  if (codigo === "IMAGENES_DISPONIBLES") return "I";
  if (codigo === "EJECUTADO_TECNICO") return "E";
  if (codigo === "INFORME_GUARDADO" || codigo === "INFORMADO") return "I";
  if (codigo === "DEFINITIVO") return "D";
  return "?";
}
async function executionWorklist() {
  const r =
    await pool.query(`SELECT e.*, o.numero_orden_his, CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente, p.numero_documento, m.codigo modalidad, es.codigo estado_codigo, es.nombre estado
    FROM estudios_radiologicos e JOIN ordenes_radiologia o ON o.id=e.orden_id JOIN pacientes_ris p ON p.id=e.paciente_id LEFT JOIN modalidades m ON m.id=e.modalidad_id JOIN estados_estudio_radiologia es ON es.id=e.estado_id
    WHERE es.codigo IN ('ADMITIDO','PROGRAMADO','IMAGENES_DISPONIBLES') ORDER BY e.created_at DESC`);
  return r.rows.map((x) => ({
    ...x,
    letra_estado: stateLetter(x.estado_codigo),
  }));
}
async function reportWorklist() {
  const r =
    await pool.query(`SELECT e.*, o.numero_orden_his, CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente, p.numero_documento, m.codigo modalidad, es.codigo estado_codigo, es.nombre estado
    FROM estudios_radiologicos e JOIN ordenes_radiologia o ON o.id=e.orden_id JOIN pacientes_ris p ON p.id=e.paciente_id LEFT JOIN modalidades m ON m.id=e.modalidad_id JOIN estados_estudio_radiologia es ON es.id=e.estado_id
    WHERE es.codigo IN ('EJECUTADO_TECNICO','IMAGENES_DISPONIBLES','INFORME_GUARDADO','INFORMADO') ORDER BY e.created_at DESC`);
  return r.rows.map((x) => ({
    ...x,
    letra_estado: stateLetter(x.estado_codigo),
  }));
}
async function agenda() {
  const r =
    await pool.query(`SELECT a.*, s.nombre sala, eq.nombre equipo, e.descripcion, o.numero_orden_his, CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente
    FROM agenda_radiologia a JOIN estudios_radiologicos e ON e.id=a.estudio_id JOIN ordenes_radiologia o ON o.id=e.orden_id JOIN pacientes_ris p ON p.id=e.paciente_id LEFT JOIN salas_radiologia s ON s.id=a.sala_id LEFT JOIN equipos_radiologia eq ON eq.id=s.equipo_id ORDER BY a.fecha_hora DESC NULLS LAST`);
  return r.rows;
}
async function agendaFormData() {
  const estudios = await pool.query(
    `SELECT e.id,e.descripcion,o.numero_orden_his,CONCAT_WS(' ',p.primer_nombre,p.primer_apellido) paciente FROM estudios_radiologicos e JOIN ordenes_radiologia o ON o.id=e.orden_id JOIN pacientes_ris p ON p.id=e.paciente_id ORDER BY e.created_at DESC LIMIT 200`,
  );
  const salas = await pool.query(
    "SELECT id,nombre FROM salas_radiologia WHERE activo=TRUE ORDER BY nombre",
  );
  return { estudios: estudios.rows, salas: salas.rows };
}
async function createAgenda(data) {
  const r = await pool.query(
    `INSERT INTO agenda_radiologia(estudio_id,sala_id,fecha_hora,estado) VALUES($1,$2,$3,$4) RETURNING id`,
    [
      data.estudio_id,
      data.sala_id || null,
      data.fecha_hora,
      data.estado || "PROGRAMADA",
    ],
  );
  const estado = await pool.query(
    "SELECT id FROM estados_estudio_radiologia WHERE codigo='PROGRAMADO' LIMIT 1",
  );
  if (estado.rows[0])
    await pool.query(
      "UPDATE estudios_radiologicos SET estado_id=$1 WHERE id=$2",
      [estado.rows[0].id, data.estudio_id],
    );
  return r.rows[0];
}
async function reportById(id) {
  const r = await pool.query(
    `SELECT ir.*, e.descripcion, e.codigo_cups, o.numero_orden_his, o.his_order_id, p.numero_documento, CONCAT_WS(' ',p.primer_nombre,p.segundo_nombre,p.primer_apellido,p.segundo_apellido) paciente
    FROM informes_radiologia ir JOIN estudios_radiologicos e ON e.id=ir.estudio_id JOIN ordenes_radiologia o ON o.id=e.orden_id JOIN pacientes_ris p ON p.id=e.paciente_id WHERE ir.id=$1`,
    [id],
  );
  return r.rows[0] || null;
}
async function relatedStudies(estudioId) {
  const r = await pool.query(
    `SELECT e2.id,e2.descripcion,o.numero_orden_his FROM estudios_radiologicos e JOIN ordenes_radiologia o1 ON o1.id=e.orden_id JOIN estudios_radiologicos e2 ON e2.paciente_id=e.paciente_id JOIN ordenes_radiologia o ON o.id=e2.orden_id WHERE e.id=$1 AND e2.id<>$1 ORDER BY e2.created_at DESC LIMIT 20`,
    [estudioId],
  );
  return r.rows;
}
async function createOrUpdateReportFull(estudioId, data) {
  const existing = await pool.query(
    "SELECT id FROM informes_radiologia WHERE estudio_id=$1 LIMIT 1",
    [estudioId],
  );
  let id;
  if (existing.rows[0]) {
    const u = await pool.query(
      `UPDATE informes_radiologia SET pregunta_clinica=$2, tecnica_usada=$3, hallazgos=$4, conclusion=$5, estudio_relacionado_id=$6, estado='BORRADOR' WHERE estudio_id=$1 RETURNING id`,
      [
        estudioId,
        data.pregunta_clinica || null,
        data.tecnica_usada || null,
        data.hallazgos,
        data.conclusion,
        data.estudio_relacionado_id || null,
      ],
    );
    id = u.rows[0].id;
  } else {
    const i = await pool.query(
      `INSERT INTO informes_radiologia(estudio_id,pregunta_clinica,tecnica_usada,hallazgos,conclusion,estudio_relacionado_id,estado) VALUES($1,$2,$3,$4,$5,$6,'BORRADOR') RETURNING id`,
      [
        estudioId,
        data.pregunta_clinica || null,
        data.tecnica_usada || null,
        data.hallazgos,
        data.conclusion,
        data.estudio_relacionado_id || null,
      ],
    );
    id = i.rows[0].id;
  }
  const estado = await pool.query(
    "SELECT id FROM estados_estudio_radiologia WHERE codigo='INFORME_GUARDADO' LIMIT 1",
  );
  if (estado.rows[0])
    await pool.query(
      "UPDATE estudios_radiologicos SET estado_id=$1,updated_at=NOW() WHERE id=$2",
      [estado.rows[0].id, estudioId],
    );
  return id;
}
async function patients(search = "") {
  const r = await pool.query(
    `SELECT p.*, COUNT(e.id)::int estudios FROM pacientes_ris p LEFT JOIN estudios_radiologicos e ON e.paciente_id=p.id WHERE $1='' OR p.numero_documento ILIKE '%'||$1||'%' OR p.primer_nombre ILIKE '%'||$1||'%' OR p.primer_apellido ILIKE '%'||$1||'%' GROUP BY p.id ORDER BY p.created_at DESC LIMIT 150`,
    [search],
  );
  return r.rows;
}
async function patientHistory(patientId) {
  const paciente = (
    await pool.query("SELECT * FROM pacientes_ris WHERE id=$1", [patientId])
  ).rows[0];
  const estudios = await pool.query(
    `SELECT e.*,o.numero_orden_his,m.codigo modalidad,es.codigo estado_codigo,es.nombre estado FROM estudios_radiologicos e JOIN ordenes_radiologia o ON o.id=e.orden_id LEFT JOIN modalidades m ON m.id=e.modalidad_id JOIN estados_estudio_radiologia es ON es.id=e.estado_id WHERE e.paciente_id=$1 ORDER BY e.created_at DESC`,
    [patientId],
  );
  const informes = await pool.query(
    `SELECT ir.*,e.descripcion,o.numero_orden_his FROM informes_radiologia ir JOIN estudios_radiologicos e ON e.id=ir.estudio_id JOIN ordenes_radiologia o ON o.id=e.orden_id WHERE e.paciente_id=$1 ORDER BY ir.created_at DESC`,
    [patientId],
  );
  return {
    paciente,
    estudios: estudios.rows.map((x) => ({
      ...x,
      letra_estado: stateLetter(x.estado_codigo),
    })),
    informes: informes.rows,
  };
}
async function audit() {
  const r = await pool.query(
    "SELECT * FROM auditoria_ris ORDER BY created_at DESC LIMIT 300",
  );
  return r.rows;
}
module.exports.executionWorklist = executionWorklist;
module.exports.reportWorklist = reportWorklist;
module.exports.agenda = agenda;
module.exports.agendaFormData = agendaFormData;
module.exports.createAgenda = createAgenda;
module.exports.reportById = reportById;
module.exports.relatedStudies = relatedStudies;
module.exports.createOrUpdateReportFull = createOrUpdateReportFull;
module.exports.patients = patients;
module.exports.patientHistory = patientHistory;
module.exports.audit = audit;
