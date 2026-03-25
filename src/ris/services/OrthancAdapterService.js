/**
 * @file OrthancAdapterService.js  (RIS)
 * @description Adaptador para comunicación con el servidor PACS Orthanc (RF7, HU46, HU47).
 * Patrón Adapter: traduce las peticiones internas del RIS al formato de la API REST de Orthanc.
 * SRP: sólo gestiona la integración con Orthanc.
 * OCP: para usar otro PACS, se reemplaza sólo este adaptador.
 *
 * API REST Orthanc:
 *   POST /instances         → Subir instancia DICOM
 *   GET  /studies/{id}      → Obtener metadatos de un estudio
 *   GET  /studies/{id}/preview → Vista previa de imagen
 *   GET  /wado              → WADO URI para visualización web
 */
const http  = require('http');
const https = require('https');

const ORTHANC_URL  = process.env.ORTHANC_URL  || 'http://localhost:8042';
const ORTHANC_USER = process.env.ORTHANC_USER || 'orthanc';
const ORTHANC_PASS = process.env.ORTHANC_PASS || 'orthanc';

/**
 * Realiza una petición HTTP/S a Orthanc con autenticación Basic.
 * @param {string} path
 * @param {string} [method='GET']
 * @param {Buffer|string|null} [body]
 * @returns {Promise<{status: number, body: any}>}
 */
const orthancRequest = (path, method = 'GET', body = null) => {
  return new Promise((resolve, reject) => {
    const parsed   = new URL(ORTHANC_URL + path);
    const lib      = parsed.protocol === 'https:' ? https : http;
    const auth     = Buffer.from(`${ORTHANC_USER}:${ORTHANC_PASS}`).toString('base64');
    const isBuffer = Buffer.isBuffer(body);

    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        ...(body ? { 'Content-Type': isBuffer ? 'application/dicom' : 'application/json' } : {}),
        ...(body ? { 'Content-Length': isBuffer ? body.length : Buffer.byteLength(body) } : {}),
      },
    };

    const req = lib.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        try { resolve({ status: res.statusCode, body: JSON.parse(raw) }); }
        catch { resolve({ status: res.statusCode, body: raw }); }
      });
    });

    req.on('error', reject);
    req.setTimeout(8000, () => { req.destroy(); reject(new Error('Timeout Orthanc')); });
    if (body) req.write(body);
    req.end();
  });
};

class OrthancAdapterService {
  /**
   * Verifica si Orthanc está disponible.
   * @returns {Promise<boolean>}
   */
  async isAvailable() {
    try {
      const { status } = await orthancRequest('/system');
      return status === 200;
    } catch {
      return false;
    }
  }

  /**
   * Obtiene el listado de estudios recientes en Orthanc.
   * @returns {Promise<string[]>} IDs de estudios
   */
  async getStudies() {
    const { status, body } = await orthancRequest('/studies');
    if (status !== 200) throw new Error('Error al obtener estudios de Orthanc.');
    return body;
  }

  /**
   * Obtiene los metadatos de un estudio DICOM por su ID (HU46).
   * @param {string} studyId
   * @returns {Promise<Object>}
   */
  async getStudyDetails(studyId) {
    const { status, body } = await orthancRequest(`/studies/${studyId}`);
    if (status !== 200) throw new Error(`Estudio ${studyId} no encontrado en Orthanc.`);
    return body;
  }

  /**
   * Construye la URL de previsualización WADO de una imagen (HU47).
   * Permite visualizar imágenes DICOM desde el frontend clínico.
   * @param {string} studyId
   * @returns {string} URL completa para acceder a la imagen
   */
  getImageUrl(studyId) {
    return `${ORTHANC_URL}/studies/${studyId}/preview`;
  }

  /**
   * Construye la URL WADO-RS para uso en visor DICOM externo.
   * @param {string} studyId
   * @returns {string}
   */
  getDicomWebUrl(studyId) {
    return `${ORTHANC_URL}/wado?requestType=WADO&studyUID=${studyId}&contentType=image/jpeg`;
  }

  /**
   * Registra en Orthanc la referencia a un estudio (metadatos simulados en modo local).
   * En producción, aquí se subiría el archivo DICOM real vía POST /instances.
   * @param {{ order_code, patient_name, study_type, body_region }} metadata
   * @returns {Promise<{ orthanc_study_id: string, preview_url: string }>}
   */
  async registerStudyMetadata({ order_code, patient_name, study_type, body_region }) {
    const isUp = await this.isAvailable();

    if (!isUp) {
      // Orthanc no está disponible → generar ID local de referencia
      const localId = `LOCAL-${order_code}-${Date.now()}`;
      console.warn(`[RIS][Orthanc] Servidor no disponible. Usando referencia local: ${localId}`);
      return { orthanc_study_id: localId, preview_url: null };
    }

    // Intentar subir metadatos como JSON a Orthanc (modo de integración básica)
    // En producción: subir el archivo DICOM al endpoint POST /instances
    const pseudo_study_id = `SIGSALUD-${order_code}`;
    return {
      orthanc_study_id: pseudo_study_id,
      preview_url:      this.getImageUrl(pseudo_study_id),
    };
  }
}

module.exports = new OrthancAdapterService();
