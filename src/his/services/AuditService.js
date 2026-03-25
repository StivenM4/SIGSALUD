/**
 * @file AuditService.js
 * @description Servicio de auditoría. Implementa el patrón Observer para notificar
 * eventos y registrarlos de forma desacoplada (HU18, HU31, HU49).
 * SRP: sólo gestiona la lógica de auditoría.
 */
const AuditRepository = require('../repositories/AuditRepository');

class AuditService {
  /**
   * Registra una acción de auditoría extrayendo los datos de la request.
   * @param {Object} req - Objeto request de Express
   * @param {string} action - Código de acción (ej. 'LOGIN', 'CREATE_PATIENT')
   * @param {string} entity  - Entidad afectada (ej. 'users', 'patients')
   * @param {number} [entityId] - ID de la entidad afectada
   * @param {string} [detail]   - Detalle adicional
   * @returns {Promise<void>}
   */
  async log(req, action, entity, entityId, detail) {
    const user_id    = req.user?.id || null;
    const ip_address = req.ip || req.connection?.remoteAddress || null;

    try {
      await AuditRepository.log({ user_id, action, entity, entity_id: entityId, detail, ip_address });
    } catch (err) {
      // La auditoría no debe interrumpir el flujo principal
      console.error('[AuditService] Error al registrar auditoría:', err.message);
    }
  }

  /**
   * Obtiene el registro de auditoría con filtros opcionales.
   * @param {Object} filters
   * @returns {Promise<Object[]>}
   */
  getLogs(filters) {
    return AuditRepository.findAll(filters);
  }
}

module.exports = new AuditService();
