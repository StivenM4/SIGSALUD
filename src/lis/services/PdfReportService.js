/**
 * @file PdfReportService.js  (LIS)
 * @description Servicio de generación de reportes PDF de resultados (HU27, RF10).
 * SRP: sólo genera el documento PDF.
 * OCP: para cambiar el motor PDF se cambia solo esta clase.
 *
 * Nota: Genera PDFs usando el módulo nativo sin dependencias externas (usando texto plano
 * formateado si PDFKit no está disponible, para permitir desarrollo sin instalación adicional).
 */
const path = require('path');
const fs   = require('fs');

const REPORTS_DIR = path.resolve(__dirname, '..', 'reports');
if (!fs.existsSync(REPORTS_DIR)) fs.mkdirSync(REPORTS_DIR, { recursive: true });

class PdfReportService {
  /**
   * Genera un reporte de resultados de laboratorio en formato texto/PDF.
   * @param {{ order, results, sample, critical_tests }} data
   * @returns {Promise<string>} Ruta del archivo generado
   */
  async generate({ order, results, sample, critical_tests = [] }) {
    const filename  = `LAB_${order.order_code}_${Date.now()}.txt`;
    const filepath  = path.join(REPORTS_DIR, filename);
    const separator = '─'.repeat(60);
    const now       = new Date().toLocaleString('es-CO', { timeZone: 'America/Bogota' });

    let resultsText = '';
    try {
      const parsed = typeof results.results_json === 'string'
        ? JSON.parse(results.results_json)
        : results.results_json;

      if (Array.isArray(parsed)) {
        parsed.forEach(r => {
          resultsText += `  ${r.test_name.padEnd(30)} ${String(r.value).padEnd(12)} ${r.unit || ''}\n`;
        });
      } else {
        resultsText = JSON.stringify(parsed, null, 2);
      }
    } catch {
      resultsText = results.results_json || 'Sin datos';
    }

    const content = [
      separator,
      '         SIGSALUD - REPORTE DE LABORATORIO',
      separator,
      '',
      `Fecha de reporte  : ${now}`,
      `Orden / Código    : ${order.order_code}`,
      `Paciente          : ${order.patient_name}`,
      `Médico solicitante: ${order.doctor_name || 'N/A'}`,
      `Prioridad         : ${order.priority}`,
      '',
      separator,
      'MUESTRA',
      separator,
      sample ? `Tipo              : ${sample.sample_type}` : 'Sin datos de muestra',
      sample ? `Técnico           : ${sample.technician}` : '',
      sample ? `Recolección       : ${sample.collected_at}` : '',
      '',
      separator,
      'RESULTADOS',
      separator,
      `${'ANÁLISIS'.padEnd(32)} ${'RESULTADO'.padEnd(14)} UNIDAD`,
      '',
      resultsText,
      '',
      results.is_validated
        ? `✅ Validado por   : ${results.validated_by}  (${results.validated_at})`
        : '⚠️  Pendiente de validación',
      '',
      ...(critical_tests.length > 0 ? [
        separator,
        '⚠️  VALORES CRÍTICOS DETECTADOS',
        separator,
        ...critical_tests.map(t =>
          `  ${t.test_name}: ${t.value} ${t.unit} → ${t.alert_type}`),
        '',
      ] : []),
      separator,
      'SIGSALUD - Sistema Hospitalario Interoperable | Licencia MIT',
      separator,
    ].join('\n');

    fs.writeFileSync(filepath, content, 'utf8');
    console.log(`[LIS] Reporte generado: ${filepath}`);
    return filepath;
  }
}

module.exports = new PdfReportService();
