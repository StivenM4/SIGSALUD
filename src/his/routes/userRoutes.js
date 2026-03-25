/**
 * @file userRoutes.js
 * @description Rutas de gestión de usuarios y roles (RF11, HU12, HU18).
 * ISP: rutas específicas para el dominio de usuarios.
 */
const express = require('express');
const UserController  = require('../controllers/UserController');
const { authenticate, authorize, requireRole } = require('../middlewares/authMiddleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// Gestión de roles - cualquier usuario autenticado puede ver los roles
router.get('/roles', UserController.getRoles);

// Operaciones reservadas para ADMINISTRADOR
router.post('/',              requireRole('ADMINISTRADOR'), UserController.createUser);
router.get('/',               requireRole('ADMINISTRADOR'), UserController.getAllUsers);
router.get('/audit-logs',     requireRole('ADMINISTRADOR'), authorize('view_audit'), UserController.getAuditLogs);
router.get('/:id',            requireRole('ADMINISTRADOR'), UserController.getUserById);
router.patch('/:id/status',   requireRole('ADMINISTRADOR'), UserController.setUserStatus);

module.exports = router;
