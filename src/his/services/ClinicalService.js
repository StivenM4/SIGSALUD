/**
 * @file ClinicalService.js
 * @description Servicio principal del módulo HIS Paso 5: historial clínico, órdenes
 * diagnósticas, recepción de resultados y notificaciones (RF4, RF9, RF10, HU01-HU16).
 * SRP: orquesta la lógica de negocio clínica sin acceder directamente a la BD.
 * DIP: depende de abstracciones (repositorios y servicios), no de implementaciones.
 */
const ClinicalRecordRepository = require('../repositories/ClinicalRecordRepository');
const OrderRepository          = require('../repositories/OrderRepository');
const ResultRepository         = require('../repositories/ResultRepository');
const PatientRepository        = require('../repositories/PatientRepository');
const UserRepository           = require('../repositories/UserRepository');
const NotificationService      = require('./NotificationService');
const IntegrationService       = require('./IntegrationService');
const AuditService             = require('./AuditService');

const VALID_ORDER_STATUSES = ['PENDIENTE', 'ENVIADA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'];
const VALID_PRIORITIES     = ['NORMAL', 'URGENTE', 'CRITICA'];

class ClinicalService {
  // ── Historial Clínico (RF4, HU10, HU14, HU16) ─────────────────────────────

  /**
   * Crea un nuevo registro en el historial clínico del paciente.
   * @param {Object} data
   * @param {Object} req - Express request (para auditoría)
   * @returns {Promise<Object>}
   */
  async createClinicalRecord(data, req) {
    const patient = await PatientRepository.findById(data.patient_id);
    if (!patient) throw new Error('Paciente no encontrado.');

    const id     = await ClinicalRecordRepository.create(data);
    const record = await ClinicalRecordRepository.findById(id);

    await AuditService.log(req, 'CREATE_CLINICAL_RECORD', 'clinical_records', id,
      `Registro clínico creado para ${patient.full_name}`);

    return record;
  }

  /**
   * Obtiene el historial clínico completo de un paciente con sus órdenes y resultados.
   * @param {number} patient_id
   * @returns {Promise<Object>}
   */
  async getPatientHistory(patient_id) {
    const patient  = await PatientRepository.findById(patient_id);
    if (!patient) throw new Error('Paciente no encontrado.');

    const [records, labOrders, radiologyOrders, labResults, radiologyReports] = await Promise.all([
      ClinicalRecordRepository.findByPatient(patient_id),
      OrderRepository.findLabOrdersByPatient(patient_id),
      OrderRepository.findRadiologyOrdersByPatient(patient_id),
      ResultRepository.findLabResultsByPatient(patient_id),
      ResultRepository.findRadiologyReportsByPatient(patient_id),
    ]);

    return { patient, records, labOrders, radiologyOrders, labResults, radiologyReports };
  }

  // ── Órdenes de Laboratorio (HU01, HU03, HU04, HU15, HU17) ─────────────────

  /**
   * Crea una orden de laboratorio y la envía automáticamente al LIS (HU01, HU03, HU17).
   * @param {Object} data
   * @param {Object} req
   * @returns {Promise<Object>}
   */
  async createLabOrder(data, req) {
    if (!data.tests_requested || !Array.isArray(data.tests_requested) || data.tests_requested.length === 0) {
      throw new Error('Se debe especificar al menos un análisis solicitado.');
    }
    if (data.priority && !VALID_PRIORITIES.includes(data.priority)) {
      throw new Error(`Prioridad inválida. Use: ${VALID_PRIORITIES.join(', ')}`);
    }

    const { id, order_code } = await OrderRepository.createLabOrder(data);
    const order = await OrderRepository.findLabOrderById(id);

    await AuditService.log(req, 'CREATE_LAB_ORDER', 'lab_orders', id,
      `Orden LAB ${order_code} creada para paciente ${order.patient_name}`);

    // Envío automático al LIS (HU03) — de forma no bloqueante
    setImmediate(async () => {
      const sent = await IntegrationService.sendLabOrderToLIS(order);
      if (sent) {
        await OrderRepository.updateLabOrderStatus(id, 'ENVIADA', new Date().toISOString());
        console.log(`[HIS] Orden ${order_code} enviada al LIS.`);
      } else {
        console.warn(`[HIS] No se pudo enviar la orden ${order_code} al LIS. Se reintentará manualmente.`);
      }
    });

    return { ...order, status: 'PENDIENTE', sent_to_lis: false };
  }

  /**
   * Crea una orden de radiología y la envía automáticamente al RIS (HU02, HU03, HU17).
   * @param {Object} data
   * @param {Object} req
   * @returns {Promise<Object>}
   */
  async createRadiologyOrder(data, req) {
    if (!data.study_type) throw new Error('El tipo de estudio radiológico es requerido.');
    if (data.priority && !VALID_PRIORITIES.includes(data.priority)) {
      throw new Error(`Prioridad inválida. Use: ${VALID_PRIORITIES.join(', ')}`);
    }

    const { id, order_code } = await OrderRepository.createRadiologyOrder(data);
    const order = await OrderRepository.findRadiologyOrderById(id);

    await AuditService.log(req, 'CREATE_RADIOLOGY_ORDER', 'radiology_orders', id,
      `Orden RAD ${order_code} creada para paciente ${order.patient_name}`);

    // Envío automático al RIS (HU03)
    setImmediate(async () => {
      const sent = await IntegrationService.sendRadiologyOrderToRIS(order);
      if (sent) {
        await OrderRepository.updateRadiologyOrderStatus(id, 'ENVIADA', new Date().toISOString());
        console.log(`[HIS] Orden ${order_code} enviada al RIS.`);
      } else {
        console.warn(`[HIS] No se pudo enviar la orden ${order_code} al RIS.`);
      }
    });

    return { ...order, status: 'PENDIENTE', sent_to_ris: false };
  }

  /**
   * Consulta el estado de las órdenes diagnósticas de un paciente (HU04, HU13).
   * @param {number} patient_id
   * @returns {Promise<Object>}
   */
  async getOrderStatus(patient_id) {
    const [labOrders, radiologyOrders] = await Promise.all([
      OrderRepository.findLabOrdersByPatient(patient_id),
      OrderRepository.findRadiologyOrdersByPatient(patient_id),
    ]);
    return { labOrders, radiologyOrders };
  }

  // ── Recepción de Resultados desde LIS (HU05, HU07, HU09) ──────────────────

  /**
   * Registra resultados de laboratorio recibidos desde el LIS (Webhook HIS ← LIS).
   * Actualiza el estado de la orden, guarda el resultado y notifica al médico.
   * @param {Object} payload - Datos enviados por el LIS
   * @returns {Promise<Object>}
   */
  async receiveLisResult(payload) {
    const { his_order_id, results, validated_by, report_url, is_critical } = payload;
    if (!his_order_id) throw new Error('his_order_id es requerido.');

    const order = await OrderRepository.findLabOrderById(his_order_id);
    if (!order) throw new Error(`Orden de laboratorio ${his_order_id} no encontrada.`);

    // Guardar resultado (HU07)
    const resultId = await ResultRepository.saveLabResult({
      lab_order_id:  his_order_id,
      patient_id:    order.patient_id,
      results_json:  results,
      validated_by,
      report_url,
      is_critical,
    });

    // Actualizar estado de la orden (HU04, HU15)
    await OrderRepository.updateLabOrderStatus(his_order_id, 'COMPLETADA');

    // Notificar al médico (HU09 - patrón Observer)
    await NotificationService.notifyLabResultReady(
      order.doctor_id, his_order_id, order.patient_name, is_critical
    );

    return { result_id: resultId, order_code: order.order_code, is_critical };
  }

  // ── Recepción de Informes desde RIS (HU06, HU08, HU09) ────────────────────

  /**
   * Registra informe radiológico recibido desde el RIS (Webhook HIS ← RIS).
   * Actualiza el estado de la orden, guarda el informe y notifica al médico.
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async receiveRisReport(payload) {
    const { his_order_id, findings, conclusion, radiologist_name, image_url } = payload;
    if (!his_order_id) throw new Error('his_order_id es requerido.');

    const order = await OrderRepository.findRadiologyOrderById(his_order_id);
    if (!order) throw new Error(`Orden de radiología ${his_order_id} no encontrada.`);

    // Guardar informe (HU08)
    const reportId = await ResultRepository.saveRadiologyReport({
      radiology_order_id: his_order_id,
      patient_id:         order.patient_id,
      radiologist_name,
      findings,
      conclusion,
      image_url,
    });

    // Actualizar estado (HU04)
    await OrderRepository.updateRadiologyOrderStatus(his_order_id, 'COMPLETADA');

    // Notificar al médico (HU09 - Observer)
    await NotificationService.notifyRadiologyReportReady(
      order.doctor_id, his_order_id, order.patient_name
    );

    return { report_id: reportId, order_code: order.order_code };
  }

  // ── Resultados en historial (HU05, HU06) ──────────────────────────────────

  /**
   * Obtiene los resultados de laboratorio del historial de un paciente (HU05, HU29).
   * @param {number} patient_id
   * @returns {Promise<Object[]>}
   */
  getLabResultsHistory(patient_id) {
    return ResultRepository.findLabResultsByPatient(patient_id);
  }

  /**
   * Obtiene los informes radiológicos del historial de un paciente (HU06, HU50).
   * @param {number} patient_id
   * @returns {Promise<Object[]>}
   */
  getRadiologyReportsHistory(patient_id) {
    return ResultRepository.findRadiologyReportsByPatient(patient_id);
  }
}

module.exports = new ClinicalService();
