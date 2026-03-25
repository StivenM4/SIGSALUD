/**
 * @file authRoutes.js
 * @description Rutas de autenticación (RF2, HU11).
 * ISP: rutas específicas para el dominio de autenticación.
 */
const express = require('express');
const AuthController  = require('../controllers/AuthController');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', AuthController.login);
router.get('/me',     authenticate, AuthController.me);

module.exports = router;
