/**
 * @file NotificationService.js
 * @description Servicio de notificaciones internas (HU09).
 * Patrón Observer: notifica a los médicos cuando llegan resultados.
 * SRP: sólo gestiona la lógica de notificación.
 */
const NotificationRepository = require('../repositories/NotificationRepository');

class NotificationService {
  /**
   * Crea una notificación para un usuario.
   * @param {{ user_id, type, message, entity, entity_id }} data
   * @returns {Promise<number>}
   */
  notify({ user_id, type, message, entity, entity_id }) {
    return NotificationRepository.create({ user_id, type, message, entity, entity_id });
  }

  /**
   * Notifica al médico que los resultados de laboratorio están disponibles (HU09).
   * @param {number} doctor_id
   * @param {number} lab_order_id
   * @param {string} patient_name
   * @param {boolean} is_critical
   * @returns {Promise<void>}
   */
  async notifyLabResultReady(doctor_id, lab_order_id, patient_name, is_critical = false) {
    const message = is_critical
      ? `⚠️ RESULTADO CRÍTICO: Los resultados de laboratorio para ${patient_name} requieren atención inmediata.`
      : `✅ Los resultados de laboratorio para ${patient_name} están disponibles para revisión.`;
    await this.notify({
      user_id:   doctor_id,
      type:      is_critical ? 'RESULTADO_CRITICO' : 'RESULTADO_LAB',
      message,
      entity:    'lab_orders',
      entity_id: lab_order_id,
    });
  }

  /**
   * Notifica al médico que el informe radiológico está disponible (HU09).
   * @param {number} doctor_id
   * @param {number} radiology_order_id
   * @param {string} patient_name
   * @returns {Promise<void>}
   */
  async notifyRadiologyReportReady(doctor_id, radiology_order_id, patient_name) {
    await this.notify({
      user_id:   doctor_id,
      type:      'INFORME_RADIOLOGICO',
      message:   `🩻 El informe radiológico para ${patient_name} está disponible en la historia clínica.`,
      entity:    'radiology_orders',
      entity_id: radiology_order_id,
    });
  }

  /**
   * Obtiene las notificaciones de un usuario.
   * @param {number} user_id
   * @param {boolean} [onlyUnread]
   * @returns {Promise<Object[]>}
   */
  getNotifications(user_id, onlyUnread = false) {
    return NotificationRepository.findByUser(user_id, onlyUnread);
  }

  /**
   * Cuenta las notificaciones no leídas.
   * @param {number} user_id
   * @returns {Promise<number>}
   */
  countUnread(user_id) {
    return NotificationRepository.countUnread(user_id);
  }

  /**
   * Marca notificaciones como leídas.
   * @param {number} user_id
   * @param {number|null} [notification_id]
   * @returns {Promise<void>}
   */
  markAsRead(user_id, notification_id = null) {
    return NotificationRepository.markAsRead(user_id, notification_id);
  }
}

module.exports = new NotificationService();
