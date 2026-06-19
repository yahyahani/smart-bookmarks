require('dotenv').config();
const { Pool } = require('pg');

// Een "pool" beheert meerdere database-connecties tegelijk,
// zodat we niet voor elke query een nieuwe connectie hoeven te openen.
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

pool.on('connect', () => {
  console.log('✅ Verbonden met PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Onverwachte fout bij de database pool:', err);
});

module.exports = pool;
