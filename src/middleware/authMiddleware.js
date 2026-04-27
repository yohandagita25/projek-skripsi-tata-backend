const jwt = require('jsonwebtoken');
const pool = require("../config/db");

const authenticateToken = (req, res, next) => {
  // 1. Cek token di Cookie
  let token = req.cookies?.token;

  // 2. Jika di cookie tidak ada (diblokir browser), cek di Header Authorization
  if (!token) {
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ error: "Akses ditolak. Token tidak ditemukan." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    return res.status(403).json({ error: "Sesi kadaluarsa atau tidak valid." });
  }
};

module.exports = { authenticateToken };