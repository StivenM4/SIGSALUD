const pool = require("../config/db");

async function findByEmail(email) {
  const result = await pool.query(
    `
    SELECT id, nombre, email, password_hash, activo
    FROM usuarios
    WHERE LOWER(email) = LOWER($1)
    LIMIT 1
  `,
    [email],
  );
  return result.rows[0] || null;
}

async function getRolesByUserId(userId) {
  const result = await pool.query(
    `
    SELECT r.nombre
    FROM usuario_rol ur
    INNER JOIN roles r ON r.id = ur.rol_id
    WHERE ur.usuario_id = $1 AND r.activo = TRUE
    ORDER BY r.nombre
  `,
    [userId],
  );
  return result.rows.map((row) => row.nombre);
}

async function getPermissionsByUserId(userId) {
  const result = await pool.query(
    `
    SELECT DISTINCT p.codigo, s.codigo AS sistema
    FROM usuario_rol ur
    INNER JOIN roles r ON r.id = ur.rol_id
    INNER JOIN rol_permiso rp ON rp.rol_id = r.id
    INNER JOIN permisos p ON p.id = rp.permiso_id
    LEFT JOIN sistemas s ON s.id = p.sistema_id
    WHERE ur.usuario_id = $1
      AND r.activo = TRUE
      AND p.activo = TRUE
    ORDER BY p.codigo
  `,
    [userId],
  );
  return result.rows;
}

async function updateLastAccess(userId) {
  await pool.query(
    `
    UPDATE usuarios
    SET ultimo_acceso = NOW(), intentos_fallidos = 0, updated_at = NOW()
    WHERE id = $1
  `,
    [userId],
  );
}

async function incrementFailedAttempts(email) {
  await pool.query(
    `
    UPDATE usuarios
    SET intentos_fallidos = intentos_fallidos + 1, updated_at = NOW()
    WHERE LOWER(email) = LOWER($1)
  `,
    [email],
  );
}

async function auditAccess({
  userId = null,
  email = null,
  sistemaCodigo = null,
  accion,
  resultado,
  ip = null,
  userAgent = null,
  detalle = null,
}) {
  await pool.query(
    `
    INSERT INTO auditoria_acceso(usuario_id, email, sistema_codigo, accion, resultado, ip, user_agent, detalle)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8)
  `,
    [userId, email, sistemaCodigo, accion, resultado, ip, userAgent, detalle],
  );
}

module.exports = {
  findByEmail,
  getRolesByUserId,
  getPermissionsByUserId,
  updateLastAccess,
  incrementFailedAttempts,
  auditAccess,
};
