/**
 * @file RadiologyService.js  (RIS)
 * @description Servicio orquestador del subsistema RIS (HU36-HU50).
 * SRP: coordina la lógica de negocio radiológica sin acceder directamente a la BD.
 * DIP: depende de repositorios y servicios (abstracciones), no de la BD.
 * OCP: la integración con Orthanc y HIS se extienden en sus propios adaptadores.
 */
const RadiologyOrderRepository = require('../repositories/RadiologyOrderRepository');
const ScheduleRepository       = require('../repositories/ScheduleRepository');
const StudyRepository          = require('../repositories/StudyRepository');
const ReportRepository         = require('../repositories/ReportRepository');
const AuditService             = require('./AuditService');
const OrthancAdapterService    = require('./OrthancAdapterService');
const RisIntegrationService    = require('./RisIntegrationService');

const VALID_PRIORITIES = ['NORMAL', 'URGENTE', 'CRITICA'];

class RadiologyService {
  // ── Recepción de orden desde HIS (HU36, HU37) ─────────────────────────────

  /**
   * Recibe y almacena una orden radiológica enviada por el HIS.
   * Confirma la recepción de vuelta al HIS (HU37).
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async receiveOrder(payload) {
    const { order_code, his_order_id, patient_id, patient_name,
            doctor_name, study_type, body_region, priority, notes } = payload;

    if (!order_code || !patient_id || !patient_name || !study_type) {
      throw new Error('Campos requeridos: order_code, patient_id, patient_name, study_type.');
    }

    await RadiologyOrderRepository.create({
      order_code, his_order_id, patient_id, patient_name,
      doctor_name, study_type, body_region, priority, notes,
    });

    const order = await RadiologyOrderRepository.findByOrderCode(order_code);

    // Confirmar recepción al HIS (HU37) - no bloqueante
    setImmediate(async () => {
      const confirmed = await RisIntegrationService.confirmOrderReception(order);
      if (confirmed) {
        await RadiologyOrderRepository.updateStatus(order.id, 'CONFIRMADA',
          { confirmed_at: new Date().toISOString() });
      }
    });

    await AuditService.log('RECEIVE_ORDER', 'radiology_orders', order.id, 'SISTEMA_HIS',
      `Orden ${order_code} recibida desde HIS para ${patient_name}`);

    return order;
  }

  // ── Agendamiento (HU38, HU39) ──────────────────────────────────────────────

  /**
   * Programa un estudio radiológico verificando conflictos de sala (HU38, HU39).
   * @param {{ order_id, room, equipment, technician, scheduled_at, duration_minutes }} data
   * @returns {Promise<Object>}
   */
  async scheduleStudy({ order_id, room, equipment, technician, scheduled_at, duration_minutes }) {
    const order = await RadiologyOrderRepository.findById(order_id);
    if (!order) throw new Error('Orden radiológica no encontrada.');

    // HU39: verificar conflictos de sala
    const hasConflict = await ScheduleRepository.hasConflict(room, scheduled_at, duration_minutes);
    if (hasConflict) {
      throw new Error(`Conflicto de horario: la sala "${room}" ya está reservada en esa franja horaria.`);
    }

    const scheduleId = await ScheduleRepository.create({
      order_id, room, equipment, technician, scheduled_at, duration_minutes,
    });

    await RadiologyOrderRepository.updateStatus(order_id, 'PROGRAMADA');
    await AuditService.log('SCHEDULE_STUDY', 'schedules', scheduleId, technician,
      `Estudio programado en sala ${room} para orden ${order.order_code}`);

    return { schedule_id: scheduleId, order_code: order.order_code, room, scheduled_at };
  }

  /**
   * Lista la agenda de una sala en una fecha específica.
   * @param {string} [room]
   * @param {string} [date]
   * @returns {Promise<Object[]>}
   */
  getSchedule(room, date) {
    return ScheduleRepository.findByRoomAndDate(room, date);
  }

  // ── Registro de estudio realizado (HU40, HU46) ────────────────────────────

  /**
   * Registra la realización del estudio e integra con Orthanc PACS (HU40, RF7, HU46).
   * @param {{ order_id, technician, observations }} data
   * @returns {Promise<Object>}
   */
  async performStudy({ order_id, technician, observations }) {
    const order = await RadiologyOrderRepository.findById(order_id);
    if (!order) throw new Error('Orden radiológica no encontrada.');

    // Registrar en Orthanc PACS (Adapter RF7, HU46)
    const { orthanc_study_id, preview_url } = await OrthancAdapterService.registerStudyMetadata({
      order_code:  order.order_code,
      patient_name: order.patient_name,
      study_type:   order.study_type,
      body_region:  order.body_region,
    });

    const studyId = await StudyRepository.create({
      order_id, technician, observations,
      orthanc_study_id, image_url: preview_url,
    });

    await RadiologyOrderRepository.updateStatus(order_id, 'EN_PROCESO');
    await AuditService.log('PERFORM_STUDY', 'studies', studyId, technician,
      `Estudio realizado. OrthancID: ${orthanc_study_id}`);

    return { study_id: studyId, order_code: order.order_code, orthanc_study_id, image_url: preview_url };
  }

  // ── Estudios pendientes de interpretación (HU45) ──────────────────────────

  /**
   * Lista las órdenes en estado EN_PROCESO para su interpretación por el radiólogo.
   * @returns {Promise<Object[]>}
   */
  getPendingForInterpretation() {
    return RadiologyOrderRepository.findByStatus('EN_PROCESO');
  }

  // ── Redacción de informe diagnóstico (HU41) ────────────────────────────────

  /**
   * Crea un borrador de informe radiológico (HU41).
   * @param {{ order_id, radiologist, findings, conclusion, image_url }} data
   * @returns {Promise<Object>}
   */
  async createReport({ order_id, radiologist, findings, conclusion, image_url }) {
    if (!findings) throw new Error('Los hallazgos (findings) son requeridos para el informe.');

    const order = await RadiologyOrderRepository.findById(order_id);
    if (!order) throw new Error('Orden radiológica no encontrada.');

    // Si no se provee image_url, intentar obtenerla del estudio realizado (HU47)
    let imageRef = image_url;
    if (!imageRef) {
      const study = await StudyRepository.findByOrder(order_id);
      if (study?.image_url) imageRef = study.image_url;
    }

    const reportId = await ReportRepository.create({
      order_id, radiologist, findings, conclusion, image_url: imageRef,
    });

    await AuditService.log('CREATE_REPORT', 'radiology_reports', reportId, radiologist,
      `Informe redactado por ${radiologist} para orden ${order.order_code}`);

    return ReportRepository.findById(reportId);
  }

  // ── Validación electrónica del informe (HU42, HU43, HU44) ────────────────

  /**
   * Valida electrónicamente el informe. Inmutable tras validación (HU43).
   * Bloquea envío al HIS sin validación (HU43).
   * Envía automáticamente al HIS tras validar (HU44).
   * @param {{ report_id, radiologist }} data
   * @returns {Promise<Object>}
   */
  async validateReport({ report_id, radiologist }) {
    const report = await ReportRepository.findById(report_id);
    if (!report) throw new Error('Informe radiológico no encontrado.');
    if (report.is_validated) {
      throw new Error('Este informe ya fue validado y no puede modificarse. (HU43)');
    }

    // Validar electrónicamente (HU42)
    const validated = await ReportRepository.validate(report_id, radiologist);
    if (!validated) throw new Error('No se pudo validar el informe. Verifica que seas el radiólogo asignado.');

    const order          = await RadiologyOrderRepository.findById(report.order_id);
    const updatedReport  = await ReportRepository.findById(report_id);

    // Auditoría de validación (HU49)
    await AuditService.log('VALIDATE_REPORT', 'radiology_reports', report_id, radiologist,
      `Informe validado por ${radiologist} para orden ${order.order_code}`);

    // HU43: marcar la orden como completada
    await RadiologyOrderRepository.updateStatus(order.id, 'COMPLETADA',
      { completed_at: new Date().toISOString() });

    // Marcar como enviado y notificar al HIS (HU44) — no bloqueante
    await ReportRepository.markSentToHIS(report_id);
    setImmediate(async () => {
      const sent = await RisIntegrationService.sendReportToHIS({ order, report: updatedReport });
      if (sent) console.log(`[RIS] Informe de ${order.order_code} enviado al HIS.`);
      else      console.warn(`[RIS] No se pudo enviar el informe de ${order.order_code} al HIS.`);
    });

    return { validated: true, report: updatedReport };
  }

  // ── Historial de imágenes e informes del paciente (RF12, HU48, HU50) ──────

  /**
   * Obtiene el historial completo de estudios e informes de un paciente.
   * @param {number} patient_id
   * @returns {Promise<Object>}
   */
  async getPatientHistory(patient_id) {
    const [orders, reports] = await Promise.all([
      RadiologyOrderRepository.findByPatient(patient_id),
      ReportRepository.findByPatient(patient_id),
    ]);
    return { patient_id, orders, reports };
  }

  // ── Informe de un radiólogo pendiente de validación (HU45) ───────────────

  /**
   * @param {string} radiologist
   * @returns {Promise<Object[]>}
   */
  getPendingReports(radiologist) {
    return ReportRepository.findPendingByRadiologist(radiologist);
  }

  // ── Auditoría (HU49) ─────────────────────────────────────────────────────

  getAuditLogs(filters) {
    return AuditService.getLogs(filters);
  }

  // ── Estado de todas las órdenes ──────────────────────────────────────────

  getOrdersByStatus(status) {
    return RadiologyOrderRepository.findByStatus(status);
  }
}

module.exports = new RadiologyService();
