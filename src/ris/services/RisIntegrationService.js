/**
 * @file RisIntegrationService.js  (RIS)
 * @description Servicio de integración RIS → HIS (HU37, HU44).
 * Patrón Adapter: adapta los datos internos del RIS al formato del webhook del HIS.
 * SRP: sólo gestiona la comunicación HTTP saliente hacia el HIS.
 */
const http  = require('http');
const https = require('https');

const HIS_URL      = process.env.HIS_API_URL          || 'http://localhost:3001';
const SERVICE_KEY  = process.env.INTERNAL_SERVICE_KEY || 'sigsalud-internal';

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
        'x-service-key':  SERVICE_KEY,
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

class RisIntegrationService {
  /**
   * Notifica al HIS que una orden radiológica fue recibida (HU37).
   * @param {{ order_code, his_order_id }} order
   * @returns {Promise<boolean>}
   */
  async confirmOrderReception(order) {
    if (!order.his_order_id) return true; // Sin HIS_ORDER_ID no hay webhook necesario
    try {
      const { status } = await postRequest(
        `${HIS_URL}/api/clinical/orders/radiology-confirm`,
        { his_order_id: order.his_order_id, order_code: order.order_code, confirmed_at: new Date().toISOString() }
      );
      return status >= 200 && status < 300;
    } catch (err) {
      console.error('[RIS] Error confirmando recepción al HIS:', err.message);
      return false;
    }
  }

  /**
   * Envía informe radiológico validado al HIS (HU44).
   * @param {{ order, report }} data
   * @returns {Promise<boolean>}
   */
  async sendReportToHIS({ order, report }) {
    try {
      const { status } = await postRequest(
        `${HIS_URL}/api/clinical/webhooks/ris-report`,
        {
          his_order_id:     order.his_order_id,
          order_code:       order.order_code,
          patient_id:       order.patient_id,
          radiologist_name: report.radiologist,
          findings:         report.findings,
          conclusion:       report.conclusion,
          image_url:        report.image_url,
        }
      );
      return status >= 200 && status < 300;
    } catch (err) {
      console.error('[RIS] Error enviando informe al HIS:', err.message);
      return false;
    }
  }
}

module.exports = new RisIntegrationService();
