const pool = require("../config/db");

// 1. Ambil semua data course
exports.getCourses = async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM courses ORDER BY id DESC");
    res.json(result.rows);
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
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Ambil Course lengkap dengan Modul & Materi
exports.getFullCourses = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id AS course_id, c.title AS course_title, c.instructor, c.thumbnail, c.description,
             m.id AS module_id, m.title AS module_title, m.module_order,
             t.id AS materi_id, t.title AS materi_title, t.content, t.video_url, t.type, t.order_number,
             t.has_reflection, t.reflection_question,
             a.id AS assignment_id, a.instruction AS assignment_instruction, a.type AS assignment_type
      FROM courses c
      LEFT JOIN modules m ON m.course_id = c.id
      LEFT JOIN materi t ON t.module_id = m.id
      LEFT JOIN assignments a ON a.materi_id = t.id
      ORDER BY c.id DESC, m.module_order ASC, t.order_number ASC
    `);

    const coursesMap = {};
    result.rows.forEach(row => {
      if (!coursesMap[row.course_id]) {
        coursesMap[row.course_id] = {
          id: row.course_id, 
          title: row.course_title, 
          instructor: row.instructor,
          thumbnail: row.thumbnail, 
          description: row.description || "", 
          modules: []
        };
      }
      const course = coursesMap[row.course_id];
      
      let module = course.modules.find(m => m.id === row.module_id);
      if (!module && row.module_id) {
        module = { 
          id: row.module_id, 
          title: row.module_title, 
          module_order: row.module_order, 
          materi: [] 
        };
        course.modules.push(module);
      }
      
      if (module && row.materi_id) {
        module.materi.push({ 
          id: row.materi_id, 
          title: row.materi_title, 
          content: row.content || "", 
          video_url: row.video_url || "", 
          type: row.type || "text",
          order_number: row.order_number,
          has_reflection: row.has_reflection,
          reflection_question: row.reflection_question,
          assignment: row.assignment_id ? {
            id: row.assignment_id,
            type: row.assignment_type,
            instruction: row.assignment_instruction
          } : null
        });
      }
    });

    res.json(Object.values(coursesMap));
  } catch (err) {
    res.status(500).json({ error: err.message });
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
    res.json(result.rows[0]);
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
    res.json({ message: "Course updated", data: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Delete Course
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    // Urutan delete penting untuk menjaga relasi database
    await pool.query("DELETE FROM materi WHERE module_id IN (SELECT id FROM modules WHERE course_id = $1)", [id]);
    await pool.query("DELETE FROM modules WHERE course_id = $1", [id]);
    await pool.query("DELETE FROM courses WHERE id = $1", [id]);
    res.json({ message: "Course deleted successfully" });
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
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};