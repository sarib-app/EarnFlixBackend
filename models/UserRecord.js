const mysql = require('mysql2/promise');
const dbConfig = require('../config/db.config'); // Import database configuration
const hashedPassword = require('../utils/hashPassword')

class UserRecord {
    constructor(userId, timeSpent, segmentEarning) {
      this.userId = userId;
      this.timeSpent = timeSpent;
      this.segmentEarning = segmentEarning;
    }
  
    async save(connection) {
      const now = new Date().toISOString().slice(0, 19).replace('T', ' ');
      try {
        await connection.query('INSERT INTO user_record SET ?', {
          user_id: this.userId,
          time_spent: this.timeSpent,
          segment_earning: this.segmentEarning,
          created_at: now,
          updated_at: now,
        });
      } catch (error) {
        console.error(error);
        throw error; // Re-throw for handling in API route
      }
    }
  
    static async fetchByUserId(connection, userId) {
      try {
        const results = await connection.query(
          'SELECT * FROM user_record WHERE user_id = ?',
          [userId]
        );
        return results[0]; // Assuming you only want the first record for a user
      } catch (error) {
        console.error(error);
        throw error; // Re-throw for handling in API route
      }
    }
  }

  module.exports = UserRecord;

  