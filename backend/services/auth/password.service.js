const argon2 = require('argon2');

const hashPassword = (password) => argon2.hash(password, { type: argon2.argon2id });

const verifyPassword = (passwordHash, password) => argon2.verify(passwordHash, password);

module.exports = {
  hashPassword,
  verifyPassword,
};
