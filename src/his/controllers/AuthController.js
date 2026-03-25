/**
 * @file AuthController.js
 * @description Controlador de autenticación (RF2, HU11).
 * SRP: sólo gestiona las peticiones HTTP del módulo de autenticación.
 */
const AuthService  = require('../services/AuthService');
const AuditService = require('../services/AuditService');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * POST /api/auth/login
 * Autentica al usuario y devuelve un token JWT.
 */
const login = asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña son requeridos.' });
  }

  const { token, user } = await AuthService.login(username, password);

  await AuditService.log(req, 'LOGIN', 'users', user.id, `Login exitoso para: ${username}`);

  res.json({ token, user });
});

/**
 * GET /api/auth/me
 * Devuelve el perfil del usuario autenticado.
 */
const me = asyncHandler(async (req, res) => {
  res.json({ user: req.user });
});

module.exports = { login, me };
