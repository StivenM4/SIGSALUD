/**
 * @file LisIntegrationService.js
 * @description Servicio de integración LIS → HIS para envío de resultados validados (HU25).
 * Patrón Adapter: adapta los datos internos del LIS al formato esperado por el HIS.
 * SRP: sólo gestiona la comunicación HTTP saliente hacia el HIS.
 */
const http  = require('http');
const https = require('https');

const HIS_URL          = process.env.HIS_API_URL           || 'http://localhost:3001';
const INTERNAL_KEY     = process.env.INTERNAL_SERVICE_KEY  || 'sigsalud-internal';

/**
 * Realiza una petición HTTP a un servicio externo.
 * @param {string} url
 * @param {Object} body
 * @returns {Promise<{status: number, body: any}>}
 */
const postRequest = (url, body) => {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(url);
    const lib     = parsed.protocol === 'https:' ? https : http;
    const payload = JSON.stringify(body);

    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || 80,
      path:     parsed.pathname,
      method:   'POST',
      headers: {
        'Content-Type':   'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'x-service-key':  INTERNAL_KEY,
      },
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', c => { data += c; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout HIS')); });
    req.write(payload);
    req.end();
  });
};

class LisIntegrationService {
  /**
   * Envía resultados validados al HIS (HU25).
   * @param {{ order, result, critical_tests, report_path }} data
   * @returns {Promise<boolean>}
   */
  async sendResultToHIS({ order, result, critical_tests, report_path }) {
    try {
      const { status } = await postRequest(
        `${HIS_URL}/api/clinical/webhooks/lis-result`,
        {
          his_order_id:  order.his_order_id,
          order_code:    order.order_code,
          patient_id:    order.patient_id,
          results:       JSON.parse(result.results_json),
          validated_by:  result.validated_by,
          report_url:    report_path,
          is_critical:   result.is_critical,
          critical_tests,
        }
      );
      return status >= 200 && status < 300;
    } catch (err) {
      console.error('[LIS] Error enviando resultado al HIS:', err.message);
      return false;
    }
  }
}

module.exports = new LisIntegrationService();
