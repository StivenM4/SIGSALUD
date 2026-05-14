const pool = require("../config/db");
async function registerAudit({
  user,
  accion,
  entidad,
  entidadId = null,
  req,
  detalle = null,
}) {
  await pool.query(
    "INSERT INTO auditoria_ris(usuario_id,usuario_email,accion,entidad,entidad_id,ip,user_agent,detalle) VALUES($1,$2,$3,$4,$5,$6,$7,$8)",
    [
      user?.userId || null,
      user?.email || null,
      accion,
      entidad,
      entidadId,
      req?.ip || null,
      req?.get?.("user-agent") || null,
      detalle,
    ],
  );
}
module.exports = { registerAudit };
