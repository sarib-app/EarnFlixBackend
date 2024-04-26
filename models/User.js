const mysql = require('mysql2/promise');
const dbConfig = require('../config/db.config'); // Import database configuration
const hashedPassword = require('../utils/hashPassword')
class User {
  constructor(username, email, password, firstname, lastname) {
    this.username = username;
    this.password = password;

    this.email = email;
    this.firstname = firstname;
    this.lastname = lastname;
  }

  async save() {
    const connection = await mysql.createConnection(dbConfig);
    try {
// Hash password with a cost factor of 10
      await connection.query('INSERT INTO users SET ?', {
        username: this.username,
        password: this.password,
        email: this.email,
        firstname: this.firstname,
        lastname: this.lastname,
      });
    } catch (error) {
      console.error(error);
      throw error; // Re-throw the error for handling in server.js
    } finally {
      await connection.end();
    }
  }
}


module.exports = User;
