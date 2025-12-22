const crypto = require('crypto');

const generateRandomPassword = (length = 10) => {
  return crypto.randomBytes(length).toString('base64').slice(0, length);
};

module.exports = generateRandomPassword;


