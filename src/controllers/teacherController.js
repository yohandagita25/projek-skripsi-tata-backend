const pool = require("../config/db");

// 1. STATISTIK UTAMA DASHBOARD
exports.getDashboardStats = async (req, res) => {
  try {
    const coursesRes = await pool.query("SELECT COUNT(*) FROM courses");
    const studentsRes = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'student'");
    const modulesRes = await pool.query("SELECT COUNT(*) FROM modules");
    const courseListRes = await pool.query("SELECT id, title FROM courses ORDER BY created_at DESC");

    res.json({
      totalCourses: parseInt(coursesRes.rows[0].count),
      totalStudents: parseInt(studentsRes.rows[0].count),
      totalModules: parseInt(modulesRes.rows[0].count),
      courseList: courseListRes.rows
    });
  } catch (error) {
    console.error("STATS ERROR:", error.message);
    res.status(500).json({ error: "Gagal mengambil statistik dashboard" });
  }
};

// 2. GRAFIK PROGRES PER KURSUS
exports.getCourseProgressStats = async (req, res) => {
  const { courseId } = req.params;
  try {
    const query = `
      SELECT 
        m.title as module_name, 
        COUNT(DISTINCT ss.user_id) as completed_count
      FROM modules m
      LEFT JOIN materi mat ON m.id = mat.module_id
      LEFT JOIN student_submissions ss ON mat.id = ss.materi_id
      WHERE m.course_id = $1
      GROUP BY m.id, m.title, m.module_order
      ORDER BY m.module_order ASC;
    `;
    const result = await pool.query(query, [courseId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data progres kursus" });
  }
};

// 3. MONITORING SISWA (STREAK & MATERI TERAKHIR)
exports.getStudentProgress = async (req, res) => {
  try {
    const query = `
      SELECT 
        u.id as student_id, u.name as student_name, u.email as student_email,
        u.current_streak, u.last_activity_date,
        (SELECT m.title FROM student_submissions sub 
         JOIN materi m ON sub.materi_id = m.id 
         WHERE sub.user_id = u.id ORDER BY sub.created_at DESC LIMIT 1) as last_materi,
        (SELECT c.title FROM student_submissions sub 
         JOIN materi m ON sub.materi_id = m.id 
         JOIN modules mo ON m.module_id = mo.id
         JOIN courses c ON mo.course_id = c.id
         WHERE sub.user_id = u.id ORDER BY sub.created_at DESC LIMIT 1) as last_course
      FROM users u
      WHERE u.role = 'student'
      ORDER BY u.last_activity_date DESC NULLS LAST;
    `;
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Gagal memproses data siswa" });
  }
};

// 4. DAFTAR SUB-BAB UNTUK PENILAIAN (GRADING HUB)
exports.getGradingModules = async (req, res) => {
  const { courseId } = req.params;
  try {
    const query = `
      SELECT 
        m.id, m.title, m.type,
        COUNT(ss.id) FILTER (WHERE ss.status = 'submitted') as pending_count,
        COUNT(ss.id) FILTER (WHERE ss.status = 'graded') as graded_count
      FROM materi m
      JOIN modules mo ON m.module_id = mo.id
      JOIN assignments a ON m.id = a.materi_id
      LEFT JOIN student_submissions ss ON m.id = ss.materi_id
      WHERE mo.course_id = $1
      GROUP BY m.id, m.title, m.type, m.order_number
      ORDER BY m.order_number ASC;
    `;
    const result = await pool.query(query, [courseId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 5. DAFTAR JAWABAN SISWA PER MATERI
exports.getSubmissionsByMateri = async (req, res) => {
  const { materiId } = req.params;
  try {
    const query = `
      SELECT 
        ss.id as submission_id, u.name as student_name, 
        ss.content, ss.status, ss.score, ss.feedback,
        a.instruction as task_instruction
      FROM student_submissions ss
      JOIN users u ON ss.user_id = u.id
      JOIN assignments a ON ss.materi_id = a.materi_id
      WHERE ss.materi_id = $1
      ORDER BY ss.status DESC, ss.created_at ASC;
    `;
    const result = await pool.query(query, [materiId]);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 6. UPDATE NILAI (ACTION)
exports.updateGrade = async (req, res) => {
  const { submissionId } = req.params;
  const { score, feedback } = req.body;
  try {
    const query = `
      UPDATE student_submissions 
      SET score = $1, feedback = $2, status = 'graded', updated_at = NOW()
      WHERE id = $3
      RETURNING *;
    `;
    const result = await pool.query(query, [score, feedback, submissionId]);
    res.json({ message: "Nilai berhasil diperbarui!", data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 7. MANAJEMEN ASSIGNMENT (UPSERT)
exports.upsertAssignment = async (req, res) => {
  const { materi_id, instruction, type, starter_code } = req.body;
  try {
    const check = await pool.query("SELECT id FROM assignments WHERE materi_id = $1", [materi_id]);
    if (check.rows.length > 0) {
      await pool.query(
        "UPDATE assignments SET instruction = $1, type = $2, starter_code = $3 WHERE materi_id = $4",
        [instruction, type, starter_code, materi_id]
      );
    } else {
      await pool.query(
        "INSERT INTO assignments (materi_id, instruction, type, starter_code) VALUES ($1, $2, $3, $4)",
        [materi_id, instruction, type, starter_code]
      );
    }
    res.json({ message: "Assignment berhasil diperbarui" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 8. DELETE ASSIGNMENT
exports.deleteAssignment = async (req, res) => {
  try {
    const { materiId } = req.params;
    await pool.query("DELETE FROM assignments WHERE materi_id = $1", [materiId]);
    res.json({ message: "Berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 9. REKAP NILAI TEST (DINAMIS: PRETEST & POSTTEST)
exports.getTestResults = async (req, res) => {
  const { courseId, testType } = req.params; // testType diambil dari rute :testType
  try {
    const query = `
      SELECT 
        ts.id as submission_id,
        u.name as student_name,
        u.email as student_email,
        t.title as test_title,
        ts.score,
        ts.status,
        TO_CHAR(ts.created_at, 'DD Mon YYYY, HH24:MI') as submitted_at
      FROM test_submissions ts
      JOIN users u ON ts.user_id = u.id
      JOIN tests t ON ts.test_id = t.id
      WHERE ts.course_id = $1 
        AND ts.test_type = $2
      ORDER BY ts.created_at DESC;
    `;
    const result = await pool.query(query, [courseId, testType]);
    res.json(result.rows);
  } catch (error) {
    console.error(`ERROR FETCHING ${testType}:`, error.message);
    res.status(500).json({ error: `Gagal mengambil data nilai ${testType}` });
  }
};