/**
 * @file AuthService.js
 * @description Servicio de autenticación y autorización mediante JWT (RF2, HU11).
 * SRP: sólo gestiona la lógica de autenticación.
 * DIP: depende de abstracciones (UserRepository, UserFactory), no de implementaciones.
 */
const jwt  = require('jsonwebtoken');
const crypto = require('crypto');
const UserRepository = require('../repositories/UserRepository');
const { createUser } = require('../factories/UserFactory');

const JWT_SECRET  = process.env.JWT_SECRET || 'default_secret_change_me';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '8h';

/**
 * Hashea una contraseña usando SHA-256 con salt.
 * @param {string} password
 * @param {string} [salt]
 * @returns {{ hash: string, salt: string }}
 */
const hashPassword = (password, salt = crypto.randomBytes(16).toString('hex')) => {
  const hash = crypto.createHmac('sha256', salt).update(password).digest('hex');
  return { hash, salt };
};

/**
 * Verifica una contraseña contra su hash almacenado.
 * @param {string} password     - Contraseña en texto plano
 * @param {string} storedHash   - Hash almacenado en BD (formato: salt:hash)
 * @returns {boolean}
 */
const verifyPassword = (password, storedHash) => {
  const [salt, hash] = storedHash.split(':');
  const { hash: computed } = hashPassword(password, salt);
  return computed === hash;
};

class AuthService {
  /**
   * Autentica un usuario y devuelve un token JWT.
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{ token: string, user: Object }>}
   */
  async login(username, password) {
    const record = await UserRepository.findByUsername(username);

    if (!record) {
      throw new Error('Credenciales inválidas.');
    }

    const isValid = verifyPassword(password, record.password);
    if (!isValid) {
      throw new Error('Credenciales inválidas.');
    }

    const user  = createUser(record);
    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES }
    );

    return { token, user };
  }

  /**
   * Genera el hash para almacenar una contraseña. Formato: salt:hash.
   * @param {string} password
   * @returns {string}
   */
  encodePassword(password) {
    const { hash, salt } = hashPassword(password);
    return `${salt}:${hash}`;
  }

  /**
   * Verifica y decodifica un token JWT.
   * @param {string} token
   * @returns {Object} Payload decodificado
   */
  verifyToken(token) {
    return jwt.verify(token, JWT_SECRET);
  }
}

module.exports = new AuthService();
