const pool = require("../config/db");

// 1. Ambil semua data course (Daftar Ringkas)
exports.getCourses = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM courses ORDER BY id DESC");
    // ✅ Bungkus dalam objek data agar konsisten dengan Frontend
    res.json({ status: "success", data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Ambil detail satu course saja
exports.getCourseDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query("SELECT * FROM courses WHERE id = $1", [id]);
    if (result.rows.length === 0) return res.status(404).json({ message: "Course tidak ditemukan" });
    res.json({ status: "success", data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Ambil Course lengkap dengan Modul & Materi (JOIN SESUAI ERD)
exports.getFullCourses = async (req, res) => {
  try {
    // Gunakan alias eksplisit untuk menghindari kebingungan kolom 'type' dan 'starter_code'
    const result = await pool.query(`
      SELECT 
        c.id AS c_id, c.title AS c_title, c.instructor AS c_instructor, c.thumbnail AS c_thumb, c.description AS c_desc,
        m.id AS m_id, m.title AS m_title, m.module_order AS m_order,
        t.id AS mat_id, t.title AS mat_title, t.content AS mat_content, t.video_url AS mat_video, t.type AS mat_type, 
        t.has_reflection AS mat_reflect, t.reflection_question AS mat_reflect_q,
        a.id AS assign_id, a.instruction AS assign_inst, a.type AS assign_type, a.starter_code AS assign_starter
      FROM courses c
      LEFT JOIN modules m ON m.course_id = c.id
      LEFT JOIN materi t ON t.module_id = m.id
      LEFT JOIN assignments a ON a.materi_id = t.id
      ORDER BY c.id DESC, m.module_order ASC, t.order_number ASC
    `);

    const coursesMap = {};

    result.rows.forEach(row => {
      // 1. Inisialisasi Course
      if (!coursesMap[row.c_id]) {
        coursesMap[row.c_id] = {
          id: row.c_id, 
          title: row.c_title, 
          instructor: row.c_instructor,
          thumbnail: row.c_thumb, 
          description: row.c_desc || "", 
          modules: []
        };
      }
      
      const course = coursesMap[row.c_id];

      // 2. Inisialisasi Module
      if (row.m_id) {
        let module = course.modules.find(m => m.id === row.m_id);
        if (!module) {
          module = { 
            id: row.m_id, 
            title: row.m_title, 
            module_order: row.m_order, 
            materi: [] 
          };
          course.modules.push(module);
        }

        // 3. Inisialisasi Materi
        if (row.mat_id) {
          let materiExists = module.materi.find(mat => mat.id === row.mat_id);
          if (!materiExists) {
            module.materi.push({ 
              id: row.mat_id, 
              title: row.mat_title, 
              content: row.mat_content, 
              video_url: row.mat_video,
              type: row.mat_type,
              has_reflection: row.mat_reflect,
              reflection_question: row.mat_reflect_q,
              assignment: row.assign_id ? { 
                id: row.assign_id, 
                type: row.assign_type,
                instruction: row.assign_inst,
                starter_code: row.assign_starter // Data starter_code dari DB
              } : null
            });
          }
        }
      }
    });

    res.status(200).json({
      status: "success",
      data: Object.values(coursesMap)
    });

  } catch (err) {
    console.error("FATAL ERROR DB:", err.message);
    res.status(500).json({ status: "error", message: "Database Sync Error: " + err.message });
  }
};

// 4. Buat Course Baru
exports.createCourse = async (req, res) => {
  try {
    const { title, instructor, thumbnail, description } = req.body;
    const result = await pool.query(
      "INSERT INTO courses (title, instructor, thumbnail, description) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, instructor, thumbnail, description || ""]
    );
    res.json({ status: "success", data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Update Course
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, instructor, thumbnail, description } = req.body;
    const result = await pool.query(
      "UPDATE courses SET title = $1, instructor = $2, thumbnail = $3, description = $4 WHERE id = $5 RETURNING *",
      [title, instructor, thumbnail, description, id]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: "Gagal update" });
    res.json({ status: "success", data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Delete Course
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    // Cascade Delete Manual sesuai ERD
    await pool.query("DELETE FROM assignments WHERE materi_id IN (SELECT id FROM materi WHERE module_id IN (SELECT id FROM modules WHERE course_id = $1))", [id]);
    await pool.query("DELETE FROM materi WHERE module_id IN (SELECT id FROM modules WHERE course_id = $1)", [id]);
    await pool.query("DELETE FROM modules WHERE course_id = $1", [id]);
    await pool.query("DELETE FROM courses WHERE id = $1", [id]);
    res.json({ status: "success", message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 7. Ambil course yang tersedia untuk test
exports.getAvailableCourses = async (req, res) => {
  try {
    const { type } = req.query; 
    const result = await pool.query(
      `SELECT c.id, c.title FROM courses c
       WHERE c.id NOT IN (
         SELECT course_id FROM tests WHERE type = $1
       )
       ORDER BY c.id DESC`, 
      [type || 'pretest']
    );
    res.json({ status: "success", data: result.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};