const bcrypt = require('bcryptjs');

async function hashPassword(password) {
    console.log(hashPassword)
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

module.exports = hashPassword;
