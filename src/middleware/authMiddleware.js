const jwt = require('jsonwebtoken');
const pool = require("../config/db");

const authenticateToken = (req, res, next) => {
  // 1. Ambil token (Utamakan cookie untuk web)
  const token = req.cookies?.token || req.headers['authorization']?.split(' ')[1];

  if (!token) {
    console.log("Middleware: No token found");
    return res.status(401).json({ error: "Akses ditolak. Silakan login kembali." });
  }

  try {
    // 2. Verifikasi Token
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;

    // 3. Tracking Activity (Background Task)
    // Pastikan tabel 'user_sessions' sudah ada di Railway Bapak!
    if (req.user?.id) {
      pool.query(
        "UPDATE user_sessions SET last_active_at = NOW() WHERE user_id = $1 AND is_processed = FALSE",
        [req.user.id]
      ).catch(err => {
        // Kita log saja, jangan hentikan proses login hanya karena gagal update session
        console.error("Tracking Activity Skip:", err.message);
      });
    }

    next();
  } catch (err) {
    console.error("JWT Verify Error:", err.message);
    return res.status(403).json({ error: "Sesi tidak valid." });
  }
};

module.exports = authenticateToken;