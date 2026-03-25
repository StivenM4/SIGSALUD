/**
 * @file AuditService.js  (RIS)
 * @description Servicio de auditoría del RIS (HU49).
 * SRP: encapsula la lógica de auditoría del subsistema RIS.
 */
const AuditRepository = require('../repositories/AuditRepository');

class AuditService {
  async log(action, entity, entity_id, performed_by, detail) {
    try {
      await AuditRepository.log({ action, entity, entity_id, performed_by, detail });
    } catch (err) {
      console.error('[RIS][AuditService] Error:', err.message);
    }
  }
  getLogs(filters) { return AuditRepository.findAll(filters); }
}

module.exports = new AuditService();
