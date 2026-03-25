const http = require('http');
const app = require('./src/ris/app');

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
  process.exit(1);
});

console.log('DEBUG: Iniciando servidor RIS con monitoreo de errores...');
