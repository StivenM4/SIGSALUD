/**
 * @file UserController.js
 * @description Controlador de gestión de usuarios y roles (RF11, HU12, HU18).
 * SRP: sólo gestiona las peticiones HTTP del módulo de usuarios.
 */
const UserService  = require('../services/UserService');
const AuditService = require('../services/AuditService');
const { asyncHandler } = require('../middlewares/errorHandler');

/**
 * POST /api/users
 * Crea un nuevo usuario (solo ADMINISTRADOR).
 */
const createUser = asyncHandler(async (req, res) => {
  const user = await UserService.createUser(req.body);
  await AuditService.log(req, 'CREATE_USER', 'users', user.id, `Usuario creado: ${user.username} con rol ${user.role}`);
  res.status(201).json({ message: 'Usuario creado exitosamente.', user });
});

/**
 * GET /api/users
 * Lista todos los usuarios (solo ADMINISTRADOR).
 */
const getAllUsers = asyncHandler(async (req, res) => {
  const users = await UserService.getAllUsers();
  res.json({ users });
});

/**
 * GET /api/users/:id
 * Obtiene un usuario por ID.
 */
const getUserById = asyncHandler(async (req, res) => {
  const user = await UserService.getUserById(Number(req.params.id));
  res.json({ user });
});

/**
 * PATCH /api/users/:id/status
 * Activa o desactiva un usuario (solo ADMINISTRADOR).
 */
const setUserStatus = asyncHandler(async (req, res) => {
  const { is_active } = req.body;
  if (is_active === undefined) return res.status(400).json({ error: 'Campo is_active requerido.' });

  await UserService.setUserStatus(Number(req.params.id), Boolean(is_active));
  await AuditService.log(req, is_active ? 'ENABLE_USER' : 'DISABLE_USER', 'users', Number(req.params.id));
  res.json({ message: `Usuario ${is_active ? 'activado' : 'desactivado'} correctamente.` });
});

/**
 * GET /api/users/roles
 * Lista todos los roles disponibles.
 */
const getRoles = asyncHandler(async (req, res) => {
  const roles = await UserService.getRoles();
  res.json({ roles });
});

/**
 * GET /api/users/audit-logs
 * Obtiene los registros de auditoría (HU18).
 */
const getAuditLogs = asyncHandler(async (req, res) => {
  const { user_id, entity, limit } = req.query;
  const logs = await AuditService.getLogs({
    user_id:  user_id ? Number(user_id) : undefined,
    entity,
    limit:    limit ? Number(limit) : 100,
  });
  res.json({ logs });
});

module.exports = { createUser, getAllUsers, getUserById, setUserStatus, getRoles, getAuditLogs };
