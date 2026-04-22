const jwt = require('jsonwebtoken');
const pool = require("../config/db"); // Pastikan import pool database Anda

const authenticateToken = (req, res, next) => {
  // 1. Cek token di Cookie (untuk Web) ATAU Header Authorization (untuk Postman/Mobile)
  let token = req.cookies?.token;

  if (!token && req.headers['authorization']) {
    const authHeader = req.headers['authorization'];
    token = authHeader.split(' ')[1]; // Mengambil string setelah 'Bearer '
  }

  // 2. Jika tidak ada token sama sekali
  if (!token) {
    return res.status(401).json({ error: "Akses ditolak. Token tidak ditemukan." });
  }

  // 3. Verifikasi Token
  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;

    // --- LOGIKA TRACKING ACTIVITY (START) ---
    // Update waktu aktivitas terakhir secara background. 
    // Kita tidak gunakan 'await' agar response API tetap cepat (non-blocking).
    if (req.user && req.user.id) {
      pool.query(
        "UPDATE user_sessions SET last_active_at = NOW() WHERE user_id = $1 AND is_processed = FALSE",
        [req.user.id]
      ).catch(err => console.error("Tracking Activity Error:", err.message));
    }
    // --- LOGIKA TRACKING ACTIVITY (END) ---

    next();
  } catch (err) {
    return res.status(403).json({ error: "Sesi kadaluarsa atau token tidak valid." });
  }
};

module.exports = authenticateToken;