const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false 
  }
});

// Tidak perlu pool.connect() manual di sini untuk Vercel
// Cukup ekspor pool-nya saja
module.exports = pool;