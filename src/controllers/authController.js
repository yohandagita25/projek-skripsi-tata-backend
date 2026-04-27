const pool = require("../config/db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
  try {
    const { name, email, password, school_level } = req.body;
    const role = 'student'; 
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `INSERT INTO users (name, email, password, school_level, role) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, role`,
      [name, email, hashed, school_level, role]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Register Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      "SELECT * FROM users WHERE email=$1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "User not found" });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(400).json({ error: "Wrong password" });
    }

    // --- LOGIKA DURASI BELAJAR (START) ---
    // 1. Cek apakah ada sesi sebelumnya yang belum diproses (is_processed = false)
    const lastSession = await pool.query(
      "SELECT id, login_at, last_active_at FROM user_sessions WHERE user_id = $1 AND is_processed = FALSE",
      [user.id]
    );

    if (lastSession.rows.length > 0) {
      const session = lastSession.rows[0];
      const loginTimePrev = new Date(session.login_at);
      const activeTimePrev = new Date(session.last_active_at);
      
      // Hitung selisih dalam menit
      const diffMs = activeTimePrev - loginTimePrev;
      const diffMins = Math.floor(diffMs / 60000);

      // Simpan durasi ke sesi lama dan tandai SELESAI
      await pool.query(
        "UPDATE user_sessions SET duration_minutes = $1, is_processed = TRUE WHERE id = $2",
        [diffMins > 0 ? diffMins : 0, session.id]
      );
    }

    // 2. Buat record Sesi Baru untuk login saat ini
    await pool.query(
      "INSERT INTO user_sessions (user_id, login_at, last_active_at) VALUES ($1, NOW(), NOW())",
      [user.id]
    );
    // --- LOGIKA DURASI BELAJAR (END) ---

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      message: "Login success",
      role: user.role
    });

  } catch (err) {
    console.error("Login Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

exports.logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "none",
    path: "/",
    secure: true
  });
  res.json({ message: "Logout success" });
};

exports.me = async (req, res) => {
  try {
    // 1. Ambil token dari cookie-parser (Pastikan app.use(cookieParser()) sudah ada di app.js)
    let token = req.cookies.token;

    // 2. Backup: Jika cookie-parser gagal, ambil manual dari headers
    if (!token && req.headers.cookie) {
      const cookies = req.headers.cookie.split(';').reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split('=');
        acc[name] = value;
        return acc;
      }, {});
      token = cookies['token'];
    }

    if (!token) {
      return res.status(401).json({ message: "Unauthorized: No Token" });
    }

    // 3. Verifikasi
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const result = await pool.query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [decoded.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error("Auth Me Error:", err.message);
    res.clearCookie("token", { httpOnly: true, sameSite: "none", secure: true });
    res.status(401).json({ message: "Invalid token" });
  }
};