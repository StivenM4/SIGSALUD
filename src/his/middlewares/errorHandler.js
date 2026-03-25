/**
 * @file errorHandler.js
 * @description Middleware centralizado de manejo de errores (Clean Code - manejo de errores centralizado).
 * SRP: sólo gestiona la respuesta de error al cliente.
 */

/**
 * Middleware de manejo de errores global para Express.
 * @type {import('express').ErrorRequestHandler}
 */
const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message    = err.message    || 'Error interno del servidor.';

  console.error(`[ERROR] ${req.method} ${req.originalUrl} - ${statusCode}: ${message}`);

  res.status(statusCode).json({
    error:   message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

/**
 * Envuelve un handler async para capturar errores sin try/catch repetitivo.
 * @param {Function} fn - Función async de Express
 * @returns {Function}
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { errorHandler, asyncHandler };
