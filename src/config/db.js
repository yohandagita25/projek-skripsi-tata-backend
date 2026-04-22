const { Pool } = require('pg');
require('dotenv').config();

// Kita gunakan connectionString agar lebih simpel dan tambahkan pengaturan SSL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    // Ini bagian paling penting agar bisa konek ke database online
    rejectUnauthorized: false 
  }
});

pool.connect()
  .then(() => console.log("✅ Database Connected Successfully to Railway!"))
  .catch(err => {
    console.error("❌ Database Connection Error:");
    console.error(err.message);
  });

module.exports = pool;