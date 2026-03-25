/**
 * @file AuditService.js  (LIS)
 * @description Servicio de auditoría del LIS (HU31, HU33).
 * SRP: encapsula la lógica de registro de auditoría para el subsistema LIS.
 */
const AuditRepository = require('../repositories/AuditRepository');

class AuditService {
  /**
   * Registra una acción de auditoría de forma silenciosa (no interrumpe el flujo).
   * @param {string} action
   * @param {string} entity
   * @param {number} entity_id
   * @param {string} performed_by
   * @param {string} [detail]
   * @returns {Promise<void>}
   */
  async log(action, entity, entity_id, performed_by, detail) {
    try {
      await AuditRepository.log({ action, entity, entity_id, performed_by, detail });
    } catch (err) {
      console.error('[LIS][AuditService] Error en auditoría:', err.message);
    }
  }

  getLogs(filters) {
    return AuditRepository.findAll(filters);
  }
}

module.exports = new AuditService();
