const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userRepository = require("../repositories/userRepository");
const systemRepository = require("../repositories/systemRepository");

async function login({ email, password, system, ip, userAgent }) {
  const selectedSystem = String(system || "")
    .trim()
    .toUpperCase();
  const systemData = await systemRepository.findByCode(selectedSystem);

  if (!systemData) {
    return { ok: false, message: "Debe seleccionar un sistema válido." };
  }

  const user = await userRepository.findByEmail(email);

  if (!user) {
    await userRepository.auditAccess({
      email,
      sistemaCodigo: selectedSystem,
      accion: "LOGIN",
      resultado: "FALLIDO",
      ip,
      userAgent,
      detalle: "Usuario no encontrado",
    });
    return { ok: false, message: "Credenciales inválidas." };
  }

  if (!user.activo) {
    await userRepository.auditAccess({
      userId: user.id,
      email: user.email,
      sistemaCodigo: selectedSystem,
      accion: "LOGIN",
      resultado: "BLOQUEADO",
      ip,
      userAgent,
      detalle: "Usuario inactivo",
    });
    return { ok: false, message: "El usuario está inactivo." };
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    await userRepository.incrementFailedAttempts(email);
    await userRepository.auditAccess({
      userId: user.id,
      email: user.email,
      sistemaCodigo: selectedSystem,
      accion: "LOGIN",
      resultado: "FALLIDO",
      ip,
      userAgent,
      detalle: "Contraseña incorrecta",
    });
    return { ok: false, message: "Credenciales inválidas." };
  }

  const roles = await userRepository.getRolesByUserId(user.id);
  const permissions = await userRepository.getPermissionsByUserId(user.id);
  const permissionCodes = permissions.map((permission) => permission.codigo);
  const requiredAccessPermission = `${selectedSystem}_ACCESS`;

  if (!permissionCodes.includes(requiredAccessPermission)) {
    await userRepository.auditAccess({
      userId: user.id,
      email: user.email,
      sistemaCodigo: selectedSystem,
      accion: "LOGIN",
      resultado: "DENEGADO",
      ip,
      userAgent,
      detalle: `No tiene ${requiredAccessPermission}`,
    });
    return {
      ok: false,
      message: `El usuario no tiene permisos para ingresar al sistema ${selectedSystem}.`,
    };
  }

  const token = jwt.sign(
    {
      userId: user.id,
      nombre: user.nombre,
      email: user.email,
      roles,
      system: selectedSystem,
      permissions: permissionCodes,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "1h" },
  );

  await userRepository.updateLastAccess(user.id);
  await userRepository.auditAccess({
    userId: user.id,
    email: user.email,
    sistemaCodigo: selectedSystem,
    accion: "LOGIN",
    resultado: "EXITOSO",
    ip,
    userAgent,
    detalle: `Ingreso a ${selectedSystem}`,
  });

  return {
    ok: true,
    redirectUrl: `${systemData.url_callback}?token=${encodeURIComponent(token)}`,
  };
}

module.exports = { login };
