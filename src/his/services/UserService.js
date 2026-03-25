/**
 * @file UserService.js
 * @description Servicio de gestión de usuarios y roles (RF11, HU12).
 * SRP: lógica de negocio de usuarios.
 * DIP: depende de UserRepository (abstracción), no de la BD directamente.
 */
const UserRepository = require('../repositories/UserRepository');
const AuthService    = require('./AuthService');
const { createUser } = require('../factories/UserFactory');

class UserService {
  /**
   * Registra un nuevo usuario en el sistema.
   * @param {{ username, password, full_name, email, role_name }} data
   * @returns {Promise<Object>} Usuario creado
   */
  async createUser({ username, password, full_name, email, role_name }) {
    // Verificar que el rol exista
    const role = await UserRepository.findRoleByName(role_name);
    if (!role) throw new Error(`Rol "${role_name}" no existe.`);

    // Verificar que el username no esté duplicado
    const existing = await UserRepository.findByUsername(username);
    if (existing) throw new Error(`El nombre de usuario "${username}" ya está en uso.`);

    const encodedPassword = AuthService.encodePassword(password);
    const userId = await UserRepository.create({
      username, password: encodedPassword, full_name, email, role_id: role.id,
    });

    const record = await UserRepository.findById(userId);
    return createUser(record);
  }

  /**
   * Obtiene un usuario por ID enriquecido con permisos.
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async getUserById(id) {
    const record = await UserRepository.findById(id);
    if (!record) throw new Error('Usuario no encontrado.');
    return createUser(record);
  }

  /**
   * Obtiene todos los usuarios.
   * @returns {Promise<Object[]>}
   */
  async getAllUsers() {
    const records = await UserRepository.findAll();
    return records.map(createUser);
  }

  /**
   * Activa o desactiva un usuario.
   * @param {number} id
   * @param {boolean} isActive
   * @returns {Promise<void>}
   */
  async setUserStatus(id, isActive) {
    const record = await UserRepository.findById(id);
    if (!record) throw new Error('Usuario no encontrado.');
    await UserRepository.updateStatus(id, isActive ? 1 : 0);
  }

  /**
   * Obtiene todos los roles disponibles.
   * @returns {Promise<Object[]>}
   */
  getRoles() {
    return UserRepository.findAllRoles();
  }
}

module.exports = new UserService();
