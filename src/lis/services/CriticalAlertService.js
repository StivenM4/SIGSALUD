/**
 * @file CriticalAlertService.js  (LIS)
 * @description Servicio de detección y emisión de alertas para valores críticos (HU32).
 * Patrón Observer: cuando un resultado es crítico, notifica a los suscriptores.
 * SRP: sólo gestiona la lógica de detección y alerta de valores críticos.
 * OCP: para añadir nuevos tipos de alerta, se extiende la lógica sin modificar la base.
 */
const ReferenceRangeRepository = require('../repositories/ReferenceRangeRepository');

class CriticalAlertService {
  /**
   * Evalúa si alguno de los resultados es crítico comparándolos con rangos de referencia.
   * @param {Object[]} results - Array de { test_name: string, value: number }
   * @returns {Promise<{ is_critical: boolean, critical_tests: Object[] }>}
   */
  async evaluate(results) {
    const critical_tests = [];

    for (const item of results) {
      const range = await ReferenceRangeRepository.findByTestName(item.test_name);
      if (!range) continue;

      const val = parseFloat(item.value);
      if (isNaN(val)) continue;

      const belowCriticalMin = range.critical_min !== null && val < range.critical_min;
      const aboveCriticalMax = range.critical_max !== null && val > range.critical_max;

      if (belowCriticalMin || aboveCriticalMax) {
        critical_tests.push({
          test_name: item.test_name,
          value:     val,
          unit:      range.unit,
          critical_min: range.critical_min,
          critical_max: range.critical_max,
          alert_type:   belowCriticalMin ? 'POR_DEBAJO_MINIMO_CRITICO' : 'POR_ENCIMA_MAXIMO_CRITICO',
        });
      }
    }

    const is_critical = critical_tests.length > 0;
    if (is_critical) {
      console.warn('[LIS] ⚠️  VALORES CRÍTICOS DETECTADOS:', critical_tests.map(t => t.test_name).join(', '));
    }
    return { is_critical, critical_tests };
  }
}

module.exports = new CriticalAlertService();
