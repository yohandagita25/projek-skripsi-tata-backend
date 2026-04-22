const pool = require("../config/db");

// 1. Ambil materi berdasarkan ID Modul
exports.getMateriByModule = async (req, res) => {
  try {
    const { moduleId } = req.params;
    const result = await pool.query(
      "SELECT * FROM materi WHERE module_id = $1 ORDER BY order_number ASC",
      [moduleId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Tambah Materi Baru (Update: Tambah has_reflection & reflection_question)
exports.createMateri = async (req, res) => {
  try {
    const { 
      module_id, title, content, video_url, order_number, type, 
      has_reflection, reflection_question 
    } = req.body;
    
    const result = await pool.query(
      `INSERT INTO materi (
        module_id, title, content, video_url, order_number, type, 
        has_reflection, reflection_question
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        module_id, 
        title || "Materi Baru", 
        content || "", 
        video_url || "", 
        Number(order_number) || 0, 
        type || "text",
        has_reflection || false, // Default false jika tidak dicentang
        reflection_question || ""
      ]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Error Create Materi:", err.message);
    res.status(500).json({ error: err.message });
  }
};

// 3. Update Materi (Fitur Edit) - Update: Tambah has_reflection & reflection_question
exports.updateMateri = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      title, type, content, video_url, order_number, 
      has_reflection, reflection_question 
    } = req.body;

    const result = await pool.query(
      `UPDATE materi 
       SET title = $1, 
           type = $2, 
           content = $3, 
           video_url = $4, 
           order_number = $5,
           has_reflection = $6,
           reflection_question = $7
       WHERE id = $8 RETURNING *`,
      [
        title || "Untitled", 
        type || "text", 
        content || "", 
        video_url || "", 
        Number(order_number) || 0, 
        has_reflection || false,
        reflection_question || "",
        id
      ]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Materi tidak ditemukan di database" });
    }
    
    res.json({ message: "Materi updated", data: result.rows[0] });
  } catch (err) {
    console.error("Error Update Materi:", err.message);
    res.status(500).json({ error: "Database Error: " + err.message });
  }
};

// 4. Hapus Materi
exports.deleteMateri = async (req, res) => {
  try {
    const { id } = req.params;
    // Otomatis menghapus tugas (assignment) terkait karena sudah ada relasi di DB
    const result = await pool.query("DELETE FROM materi WHERE id = $1", [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Materi sudah tidak ada" });
    }
    res.json({ message: "Materi berhasil dihapus" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};