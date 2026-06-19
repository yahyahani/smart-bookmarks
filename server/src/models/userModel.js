const pool = require('../db');

// Maak een nieuwe gebruiker aan en geef de aangemaakte rij terug
async function createUser(email, passwordHash) {
  const result = await pool.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
    [email, passwordHash]
  );
  return result.rows[0];
}

// Zoek een gebruiker op e-mailadres (gebruikt bij login)
async function findUserByEmail(email) {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0]; // undefined als niet gevonden
}

module.exports = { createUser, findUserByEmail };
