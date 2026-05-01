const pool = require("../config/db");
const { runCCode } = require("../services/compilerService");

/**
 * HELPER: Update Learning Streak
 * Digunakan internal oleh controller
 */
const updateLearningStreak = async (userId) => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
        const userResult = await pool.query(
            "SELECT current_streak, last_activity_date FROM users WHERE id = $1", 
            [userId]
        );
        
        if (userResult.rows.length === 0) return;

        let { current_streak, last_activity_date } = userResult.rows[0];
        let newStreak = current_streak || 0;

        if (!last_activity_date) {
            newStreak = 1;
        } else {
            const lastDate = new Date(last_activity_date);
            const currentDate = new Date(today);
            const diffTime = currentDate - lastDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays === 1) {
                newStreak += 1;
            } else if (diffDays > 1) {
                newStreak = 1;
            } else if (diffDays === 0) {
                return; // Sudah diupdate hari ini
            }
        }

        await pool.query(
            "UPDATE users SET current_streak = $1, last_activity_date = $2 WHERE id = $3",
            [newStreak, today, userId]
        );
    } catch (err) {
        console.error("STREAK HELPER ERROR:", err.message);
    }
};

// 1. COMPILE & LOG PERCOBAAN
exports.runAndLogCode = async (req, res) => {
    const { materi_id, code, stdin } = req.body; // 👈 Ambil stdin dari frontend
    const user_id = req.user.id; 
    try {
        const result = await runCCode(code, stdin); // 👈 Teruskan ke service
        // Simpan ke history attempt (opsional: simpan juga stdin-nya)
        await pool.query(
            `INSERT INTO student_attempts (user_id, materi_id, code_content, output, status) 
             VALUES ($1, $2, $3, $4, $5)`,
            [user_id, materi_id, code, result.stdout || result.stderr || "No Output", result.stderr ? 'error' : 'success']
        );
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: "Gagal menjalankan kode: " + error.message });
    }
};

// 2. KIRIM JAWABAN FINAL
exports.submitAssignment = async (req, res) => {
    const { materi_id, content } = req.body;
    const user_id = req.user.id;
    try {
        const stringifiedContent = JSON.stringify(content);
        const query = `
            INSERT INTO student_submissions (materi_id, user_id, content, status) 
            VALUES ($1, $2, $3, 'submitted')
            ON CONFLICT (materi_id, user_id) 
            DO UPDATE SET content = EXCLUDED.content, status = 'submitted', updated_at = NOW()
            RETURNING *;
        `;
        const result = await pool.query(query, [Number(materi_id), user_id, stringifiedContent]);
        
        await updateLearningStreak(user_id);
        
        res.json({ message: "Jawaban berhasil dikirim!", data: result.rows[0] });
    } catch (error) {
        res.status(500).json({ error: "Gagal simpan ke DB: " + error.message });
    }
};
// 3. AMBIL STATUS SUBMISSION
exports.getSubmission = async (req, res) => {
    const { materi_id } = req.params;
    const user_id = req.user.id;
    try {
        const result = await pool.query(
            `SELECT * FROM student_submissions WHERE materi_id = $1 AND user_id = $2`,
            [materi_id, user_id]
        );
        res.json({ exists: result.rows.length > 0, data: result.rows[0] || null });
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil data submission" });
    }
};

// 4. AMBIL DATA KALENDER AKTIVITAS
exports.getActivityCalendar = async (req, res) => {
    try {
        const userId = req.user.id; 
        const query = `
            SELECT TO_CHAR(activity_date, 'YYYY-MM-DD') as date 
            FROM user_activities 
            WHERE user_id = $1 
            AND EXTRACT(MONTH FROM activity_date) = EXTRACT(MONTH FROM CURRENT_DATE)
            AND EXTRACT(YEAR FROM activity_date) = EXTRACT(YEAR FROM CURRENT_DATE)
            ORDER BY activity_date ASC
        `;
        const result = await pool.query(query, [userId]);
        res.json(result.rows.map(row => row.date));
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil data kalender" });
    }
};

// 5. CATAT AKTIVITAS BELAJAR & UPDATE STREAK
exports.logMateriActivity = async (req, res) => {
    try {
        const userId = req.user.id; 
        
        const query = `
            INSERT INTO user_activities (user_id, activity_date) 
            VALUES ($1, CURRENT_DATE) 
            ON CONFLICT (user_id, activity_date) DO NOTHING;
        `;
        await pool.query(query, [userId]);

        await updateLearningStreak(userId);

        res.status(200).json({ success: true, message: "Aktivitas dan Streak diperbarui" });
    } catch (error) {
        res.status(500).json({ success: false, error: "Gagal mencatat aktivitas" });
    }
};

// 6. AMBIL TOTAL DURASI BELAJAR
exports.getStudyDuration = async (req, res) => {
    try {
        const userId = req.user.id;
        const query = `
            SELECT COALESCE(SUM(duration_minutes), 0) as total_minutes 
            FROM user_sessions 
            WHERE user_id = $1 AND is_processed = TRUE
        `;
        const result = await pool.query(query, [userId]);
        res.json({ totalMinutes: parseInt(result.rows[0].total_minutes) });
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil durasi" });
    }
};

// 7. AMBIL ANGKA STREAK UNTUK DASHBOARD
exports.getLearningStreak = async (req, res) => {
    try {
        const userId = req.user.id;
        const result = await pool.query(
            "SELECT current_streak FROM users WHERE id = $1", 
            [userId]
        );
        res.json({ currentStreak: result.rows[0]?.current_streak || 0 });
    } catch (error) {
        res.status(500).json({ error: "Gagal mengambil data streak" });
    }
};

// 8. AMBIL OVERALL PROGRESS
exports.getOverallProgress = async (req, res) => {
  const userId = req.user.id;
  try {
    const query = `
      SELECT 
        c.id AS course_id,
        c.title AS course_title,
        
        (SELECT json_build_object(
          'score', ts.score,
          'status', ts.status
         ) FROM test_submissions ts 
         WHERE ts.user_id = $1 AND ts.course_id = c.id AND ts.test_type = 'pretest' 
         LIMIT 1) AS pretest,

        (SELECT json_build_object(
          'score', ts.score,
          'status', ts.status
         ) FROM test_submissions ts 
         WHERE ts.user_id = $1 AND ts.course_id = c.id AND ts.test_type = 'posttest' 
         LIMIT 1) AS posttest,

        (SELECT json_agg(json_build_object(
        'materi_id', m.id,
        'materi_title', m.title,
        'module_title', mo_inner.title,
        'assignment_id', a.id,
        'submission_status', ss.status,
        'submission_score', ss.score
        ))
        FROM materi m
        JOIN modules mo_inner ON m.module_id = mo_inner.id -- Join ke modul
        JOIN assignments a ON m.id = a.materi_id
        LEFT JOIN student_submissions ss ON m.id = ss.materi_id AND ss.user_id = $1
        WHERE m.module_id IN (SELECT id FROM modules WHERE course_id = c.id)
        ) AS assignments_progress

      FROM courses c
      ORDER BY c.created_at DESC;
    `;
    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error("GET PROGRESS ERROR:", error.message);
    res.status(500).json({ error: "Gagal memproses progres belajar" });
  }
};

// 9. AMBIL CHALLENGES
exports.getChallenges = async (req, res) => {
    const userId = req.user.id;
    try {
      const query = `
        SELECT 
          c.id AS course_id,
          c.title AS course_title,
          c.thumbnail,
          t.id AS test_id,
          t.duration,
          (SELECT COUNT(*) FROM questions q WHERE q.test_id = t.id) AS total_questions,
          EXISTS (
            SELECT 1 FROM test_submissions ts 
            WHERE ts.test_id = t.id AND ts.user_id = $1
          ) AS is_completed
        FROM courses c
        JOIN tests t ON c.id = t.course_id
        WHERE t.type = 'pretest'
        ORDER BY c.created_at DESC;
      `;
      const result = await pool.query(query, [userId]);
      res.json(result.rows);
    } catch (error) {
      console.error("GET CHALLENGES ERROR:", error.message);
      res.status(500).json({ error: "Gagal memuat data tantangan" });
    }
};

// Tambahkan fungsi ini di studentController.js
exports.getStudentStats = async (req, res) => {
    try {
        const userId = req.user.id;
        
        // 1. Hitung Total Kursus Diikuti
        const coursesCount = await pool.query("SELECT COUNT(*) FROM courses");
        
        // 2. Hitung Rata-rata Nilai Tugas (Logic Mastery)
        const avgScore = await pool.query(
            "SELECT AVG(score) as avg FROM student_submissions WHERE user_id = $1 AND score IS NOT NULL",
            [userId]
        );
        
        // 3. Hitung Jumlah Tugas Selesai (Status 'graded')
        const taskDone = await pool.query(
            "SELECT COUNT(*) FROM student_submissions WHERE user_id = $1 AND status = 'graded'",
            [userId]
        );

        res.json({
            enrolled: parseInt(coursesCount.rows[0].count),
            logicMastery: Math.round(avgScore.rows[0].avg || 0),
            tasksCompleted: parseInt(taskDone.rows[0].count)
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};