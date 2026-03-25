/**
 * @file IntegrationService.js
 * @description Servicio de integración inter-sistemas con LIS y RIS vía API REST (HU03, HU05-HU09).
 * Patrón Adapter: adapta las peticiones internas del HIS al formato esperado por LIS y RIS.
 * SRP: sólo gestiona la comunicación HTTP entre subsistemas.
 * OCP: para agregar un nuevo subsistema, sólo se extiende esta clase.
 */
const http  = require('http');
const https = require('https');

const LIS_URL = process.env.LIS_API_URL || 'http://127.0.0.1:3003';
const RIS_URL = process.env.RIS_API_URL || 'http://127.0.0.1:3002';
const SERVICE_KEY = process.env.INTERNAL_SERVICE_KEY || 'sigsalud-internal';

/**
 * Realiza una petición HTTP/HTTPS a un servicio externo.
 * @param {string} url
 * @param {string} method
 * @param {Object} [body]
 * @param {string} [token]
 * @returns {Promise<Object>}
 */
const request = (url, method, body, token) => {
  return new Promise((resolve, reject) => {
    const parsed  = new URL(url);
    const lib     = parsed.protocol === 'https:' ? https : http;
    const payload = body ? JSON.stringify(body) : null;

    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-service-key': SERVICE_KEY,
        ...(payload && { 'Content-Length': Buffer.byteLength(payload) }),
      },
    };

    const req = lib.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000, () => { req.destroy(); reject(new Error('Timeout al conectar con el subsistema.')); });

    if (payload) req.write(payload);
    req.end();
  });
};

class IntegrationService {
  /**
   * Envía una orden de laboratorio al subsistema LIS (HU03).
   * @param {Object} labOrder - Datos de la orden a enviar
   * @param {string} [token]  - Token JWT del servidor para autenticación inter-sistema
   * @returns {Promise<boolean>} true si fue recibida correctamente
   */
  async sendLabOrderToLIS(labOrder, token) {
    try {
      const { status } = await request(
        `${LIS_URL}/api/orders/receive`,
        'POST',
        {
          order_code:      labOrder.order_code,
          his_order_id:    labOrder.id,
          patient_id:      labOrder.patient_id,
          patient_name:    labOrder.patient_name,
          doctor_name:     labOrder.doctor_name,
          tests_requested: labOrder.tests_requested,
          priority:        labOrder.priority,
          notes:           labOrder.notes,
          created_at:      labOrder.created_at,
        },
        token
      );
      return status >= 200 && status < 300;
    } catch (err) {
      console.error('[IntegrationService] Error enviando orden al LIS:', err.message);
      return false;
    }
  }

  /**
   * Envía una orden de radiología al subsistema RIS (HU03).
   * @param {Object} radiologyOrder
   * @param {string} [token]
   * @returns {Promise<boolean>}
   */
  async sendRadiologyOrderToRIS(radiologyOrder, token) {
    try {
      const { status } = await request(
        `${RIS_URL}/api/orders/receive`,
        'POST',
        {
          order_code:   radiologyOrder.order_code,
          his_order_id: radiologyOrder.id,
          patient_id:   radiologyOrder.patient_id,
          patient_name: radiologyOrder.patient_name,
          doctor_name:  radiologyOrder.doctor_name,
          study_type:   radiologyOrder.study_type,
          body_region:  radiologyOrder.body_region,
          priority:     radiologyOrder.priority,
          notes:        radiologyOrder.notes,
          created_at:   radiologyOrder.created_at,
        },
        token
      );
      return status >= 200 && status < 300;
    } catch (err) {
      console.error('[IntegrationService] Error enviando orden al RIS:', err.message);
      return false;
    }
  }

  /**
   * Verifica si el LIS está activo (health check).
   * @returns {Promise<boolean>}
   */
  async checkLISHealth() {
    try {
      const { status } = await request(`${LIS_URL}/api/health`, 'GET');
      return status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Verifica si el RIS está activo (health check).
   * @returns {Promise<boolean>}
   */
  async checkRISHealth() {
    try {
      const { status } = await request(`${RIS_URL}/api/health`, 'GET');
      return status === 200;
    } catch {
      return false;
    }
  }
}

module.exports = new IntegrationService();
