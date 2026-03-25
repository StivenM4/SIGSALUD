/**
 * @file authMiddleware.js
 * @description Middleware de autenticación JWT y control de acceso basado en roles (RBAC).
 * SRP: sólo valida el token y adjunta el usuario al request.
 */
const AuthService = require('../services/AuthService');
const UserRepository = require('../repositories/UserRepository');
const { createUser, hasPermission } = require('../factories/UserFactory');

/**
 * Verifica el token JWT y adjunta el usuario decodificado al request.
 * @type {import('express').RequestHandler}
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token de autenticación no proporcionado.' });
    }

    const token   = authHeader.split(' ')[1];
    const payload = AuthService.verifyToken(token);

    // Recargar usuario desde la BD para verificar que sigue activo
    const record = await UserRepository.findById(payload.id);
    if (!record || !record.is_active) {
      return res.status(401).json({ error: 'Usuario inactivo o no encontrado.' });
    }

    req.user = createUser(record);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};

/**
 * Middleware de autorización por permiso específico.
 * @param {string} permission - Permiso requerido
 * @returns {import('express').RequestHandler}
 */
const authorize = (permission) => (req, res, next) => {
  if (!req.user || !hasPermission(req.user, permission)) {
    return res.status(403).json({ error: 'No tiene permiso para realizar esta acción.' });
  }
  next();
};

/**
 * Middleware de autorización por rol.
 * @param {...string} roles - Roles permitidos
 * @returns {import('express').RequestHandler}
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Rol no autorizado para esta acción.' });
  }
  next();
};

module.exports = { authenticate, authorize, requireRole };
