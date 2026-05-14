const pool = require("../config/db");
async function list(table, fields = "id, nombre") {
  const r = await pool.query(
    `SELECT ${fields} FROM ${table} WHERE activo = TRUE ORDER BY 2`,
  );
  return r.rows;
}
async function tiposDocumento() {
  return list("tipos_documento", "id,codigo,nombre");
}
async function generos() {
  return list("generos", "id,codigo,nombre");
}
async function estadosCita() {
  return list("estados_cita", "id,codigo,nombre");
}
async function especialidades() {
  return list("especialidades", "id,nombre");
}
async function tiposOrden() {
  return list("tipos_orden_diagnostica", "id,codigo,nombre,sistema_destino");
}
async function prioridadesOrden() {
  return list("prioridades_orden", "id,codigo,nombre");
}
async function procedimientosByTipo(tipo) {
  const r = await pool.query(
    "SELECT id,codigo,nombre,tipo FROM procedimientos_cups WHERE activo=TRUE AND tipo=$1 ORDER BY nombre",
    [tipo],
  );
  return r.rows;
}
async function cie10() {
  return list("diagnosticos_cie10", "id,codigo,nombre");
}
module.exports = {
  tiposDocumento,
  generos,
  estadosCita,
  especialidades,
  tiposOrden,
  prioridadesOrden,
  procedimientosByTipo,
  cie10,
};
