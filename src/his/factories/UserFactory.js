/**
 * @file UserFactory.js
 * @description Patrón Factory para crear instancias de usuario según su rol (Paso 2).
 * OCP: para añadir un nuevo rol no se modifica la lógica existente, se extiende el mapa.
 */

const ROLE_PERMISSIONS = {
  ADMINISTRADOR:        ['manage_users', 'view_audit', 'manage_patients', 'manage_appointments', 'view_reports'],
  MEDICO:               ['view_patients', 'manage_appointments', 'create_orders', 'view_results', 'view_reports'],
  RECEPCIONISTA:        ['manage_patients', 'manage_appointments'],
  RADIOLOGO:            ['view_studies', 'create_radiology_report'],
  TECNICO_LABORATORIO:  ['view_lab_orders', 'register_results'],
  PACIENTE:             ['view_own_results'],
};

/**
 * Crea un objeto de usuario enriquecido con sus permisos según el rol.
 * @param {Object} userRecord - Registro de usuario de la BD
 * @returns {Object} Usuario con permisos
 */
const createUser = (userRecord) => {
  const permissions = ROLE_PERMISSIONS[userRecord.role_name] || [];
  return {
    id:          userRecord.id,
    username:    userRecord.username,
    full_name:   userRecord.full_name,
    email:       userRecord.email,
    role:        userRecord.role_name,
    permissions,
    is_active:   userRecord.is_active,
  };
};

/**
 * Verifica si un usuario tiene un permiso específico.
 * @param {Object} user
 * @param {string} permission
 * @returns {boolean}
 */
const hasPermission = (user, permission) => user.permissions.includes(permission);

module.exports = { createUser, hasPermission, ROLE_PERMISSIONS };
