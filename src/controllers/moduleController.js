const pool = require("../config/db");

exports.getModules = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM modules ORDER BY id ASC");
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getModuleById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query("SELECT * FROM modules WHERE id = $1", [id]);
        if (result.rows.length === 0) return res.status(404).json({ message: "Module not found" });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.createModule = async (req, res) => {
    try {
        const { course_id, title, content, order_index } = req.body;
        const result = await pool.query(
            "INSERT INTO modules (course_id, title, content, order_index) VALUES ($1, $2, $3, $4) RETURNING *",
            [course_id, title, content, order_index]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateModule = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, content, order_index } = req.body;
        const result = await pool.query(
            "UPDATE modules SET title = $1, content = $2, order_index = $3 WHERE id = $4 RETURNING *",
            [title, content, order_index, id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteModule = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM modules WHERE id = $1", [id]);
        res.json({ message: "Module deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};