const express = require("express");
const router = express.Router();

const {
  getModules,
  getModuleDetail,
  createModule,
  updateModule,
  deleteModule,
  getModulesByCourse
} = require("../controllers/moduleController");

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

// Rute Publik
router.get("/", getModules);
router.get("/:id", getModuleDetail);
router.get("/course/:courseId", getModulesByCourse);

// Rute Khusus Guru (Edit, Tambah, Hapus)
router.post("/", authenticateToken, authorizeRole(["teacher"]), createModule);
router.put("/:id", authenticateToken, authorizeRole(["teacher"]), updateModule);
router.delete("/:id", authenticateToken, authorizeRole(["teacher"]), deleteModule);

module.exports = router;