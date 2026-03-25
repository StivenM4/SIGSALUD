/**
 * @file LabService.js
 * @description Servicio orquestador principal del LIS (HU19-HU35).
 * SRP: coordina la lógica de negocio sin acceder directamente a la BD.
 * DIP: depende de repositorios (abstracciones), no de implementaciones concretas.
 * OCP: la lógica de alertas y PDF se extiende en servicios separados.
 */
const LabOrderRepository    = require('../repositories/LabOrderRepository');
const SampleRepository      = require('../repositories/SampleRepository');
const LabResultRepository   = require('../repositories/LabResultRepository');
const AuditService          = require('./AuditService');
const CriticalAlertService  = require('./CriticalAlertService');
const PdfReportService      = require('./PdfReportService');
const LisIntegrationService = require('./LisIntegrationService');

const VALID_STATUSES = ['RECIBIDA', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA'];

class LabService {
  // ── Recepción de órdenes desde HIS (HU19) ─────────────────────────────────

  /**
   * Recibe y almacena una orden de laboratorio enviada por el HIS (HU19).
   * @param {Object} payload
   * @returns {Promise<Object>}
   */
  async receiveOrder(payload) {
    const { order_code, his_order_id, patient_id, patient_name,
            doctor_name, tests_requested, priority, notes } = payload;

    if (!order_code || !patient_id || !patient_name || !tests_requested) {
      throw new Error('Faltan campos requeridos: order_code, patient_id, patient_name, tests_requested.');
    }

    // INSERT OR IGNORE si ya existe la orden (idempotencia HU37 del RIS)
    const id = await LabOrderRepository.create({
      order_code, his_order_id, patient_id, patient_name,
      doctor_name, tests_requested, priority, notes,
    });

    const order = await LabOrderRepository.findByOrderCode(order_code);

    await AuditService.log('RECEIVE_ORDER', 'lab_orders', order.id, 'SISTEMA_HIS',
      `Orden ${order_code} recibida desde HIS para ${patient_name}`);

    return order;
  }

  // ── Bandeja de órdenes pendientes (HU20, HU30) ────────────────────────────

  /**
   * Lista órdenes de laboratorio por estado (HU20, HU30).
   * @param {string} [status='RECIBIDA']
   * @returns {Promise<Object[]>}
   */
  getOrdersByStatus(status = 'RECIBIDA') {
    return LabOrderRepository.findByStatus(status);
  }

  // ── Registro de toma de muestra (HU21, HU33) ──────────────────────────────

  /**
   * Registra la toma de muestra y avanza el estado de la orden.
   * @param {{ lab_order_id, technician, sample_type, observations }} data
   * @returns {Promise<Object>}
   */
  async registerSample({ lab_order_id, technician, sample_type, observations }) {
    const order = await LabOrderRepository.findById(lab_order_id);
    if (!order) throw new Error('Orden de laboratorio no encontrada.');

    const sampleId = await SampleRepository.create({ lab_order_id, technician, sample_type, observations });

    // Actualizar estado de la orden a EN_PROCESO (HU26)
    await LabOrderRepository.updateStatus(lab_order_id, 'EN_PROCESO');

    await AuditService.log('REGISTER_SAMPLE', 'lab_orders', lab_order_id, technician,
      `Muestra "${sample_type}" recolectada por ${technician}`);

    return { sample_id: sampleId, order_code: order.order_code };
  }

  // ── Registro de resultados desde analizador (HU22) ────────────────────────

  /**
   * Registra o actualiza resultados de análisis (HU22).
   * Evalúa si son críticos automáticamente (HU32 - Observer).
   * @param {{ lab_order_id, results, technician }} data
   * @returns {Promise<{ result_id: number, is_critical: boolean, critical_tests: Object[] }>}
   */
  async registerResults({ lab_order_id, results, technician }) {
    const order = await LabOrderRepository.findById(lab_order_id);
    if (!order) throw new Error('Orden no encontrada.');

    // HU32: detectar valores críticos (Observer/Strategy)
    const { is_critical, critical_tests } = await CriticalAlertService.evaluate(
      Array.isArray(results) ? results : []
    );

    const result_id = await LabResultRepository.create({
      lab_order_id,
      results_json: results,
    });

    // Si hay valores críticos, advertir inmediatamente (HU32)
    if (is_critical) {
      console.warn(`[LIS] ⚠️  ALERTA CRÍTICA en orden ${order.order_code}:`,
        critical_tests.map(t => `${t.test_name}=${t.value}`).join(' | '));
    }

    await AuditService.log('REGISTER_RESULTS', 'lab_results', result_id, technician,
      `Resultados registrados. Crítico: ${is_critical}`);

    return { result_id, is_critical, critical_tests };
  }

  // ── Validación electrónica del bacteriólogo (HU23, HU24, HU28) ────────────

  /**
   * Valida electrónicamente resultados. Bloquea re-validación (HU24, HU28).
   * Tras validar: genera PDF, envía al HIS (HU25), registra auditoría (HU31).
   * @param {{ result_id, bacteriologist, lab_order_id }} data
   * @returns {Promise<Object>}
   */
  async validateResult({ result_id, bacteriologist, lab_order_id }) {
    const result = await LabResultRepository.findById(result_id);
    if (!result) throw new Error('Resultado no encontrado.');

    if (result.is_validated) {
      throw new Error('Este resultado ya fue validado y no puede modificarse. (HU28)');
    }

    // HU24: evaluar criticidad final antes de validar
    let parsedResults = [];
    try { parsedResults = JSON.parse(result.results_json); } catch { /* no array */ }
    const { is_critical, critical_tests } = await CriticalAlertService.evaluate(parsedResults);

    // Validar electrónicamente (HU23)
    const wasValidated = await LabResultRepository.validate(result_id, bacteriologist, is_critical ? 1 : 0);
    if (!wasValidated) throw new Error('No se pudo validar el resultado (ya validado o no existe).');

    const order          = await LabOrderRepository.findById(lab_order_id || result.lab_order_id);
    const updatedResult  = await LabResultRepository.findById(result_id);
    const sample         = (await SampleRepository.findByOrder(order.id))[0] || null;

    // Auditoría de validación (HU31, HU33)
    await AuditService.log('VALIDATE_RESULT', 'lab_results', result_id, bacteriologist,
      `Validado por ${bacteriologist}. Crítico: ${is_critical}`);

    // Generar reporte (HU27, RF10)
    let report_path = null;
    try {
      report_path = await PdfReportService.generate({ order, results: updatedResult, sample, critical_tests });
    } catch (pdfErr) {
      console.error('[LIS] Error generando reporte:', pdfErr.message);
    }

    // Marcar como enviado y actualizar ruta del reporte
    await LabResultRepository.markSentToHIS(result_id, report_path);
    await LabOrderRepository.updateStatus(order.id, 'COMPLETADA', new Date().toISOString());

    // Enviar al HIS de forma no bloqueante (HU25, Observer)
    setImmediate(async () => {
      const sent = await LisIntegrationService.sendResultToHIS({
        order, result: updatedResult, critical_tests, report_path,
      });
      if (sent) console.log(`[LIS] Resultado de orden ${order.order_code} enviado al HIS.`);
      else      console.warn(`[LIS] No se pudo enviar el resultado de ${order.order_code} al HIS.`);
    });

    return { validated: true, is_critical, critical_tests, report_path };
  }

  // ── Historial de resultados por paciente (HU29, HU34, HU35) ───────────────

  /**
   * Obtiene el historial de órdenes y resultados de un paciente.
   * @param {number} patient_id
   * @returns {Promise<Object>}
   */
  async getPatientHistory(patient_id) {
    const [orders, results] = await Promise.all([
      LabOrderRepository.findByPatient(patient_id),
      LabResultRepository.findByPatient(patient_id),
    ]);
    return { patient_id, orders, results };
  }

  // ── Auditoría (HU31, HU33) ────────────────────────────────────────────────

  getAuditLogs(filters) {
    return AuditService.getLogs(filters);
  }
}

module.exports = new LabService();
