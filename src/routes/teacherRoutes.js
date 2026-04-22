const express = require("express");
const router = express.Router();

const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

// Import Controllers
const teacherController = require("../controllers/teacherController");
const { createCourse, getCourses, updateCourse, deleteCourse } = require("../controllers/courseController");
const { createModule, getModulesByCourse, updateModule, deleteModule } = require("../controllers/moduleController");
const { createMateri, getMateriByModule, updateMateri, deleteMateri } = require("../controllers/materiController");

// Proteksi rute (Hanya Guru)
router.use(authenticateToken);
router.use(authorizeRole(["teacher"]));

// --- COURSE ---
router.post("/courses", createCourse);
router.get("/courses", getCourses);
router.put("/courses/:id", updateCourse);
router.delete("/courses/:id", deleteCourse);

// --- MODULE ---
router.get("/modules/:courseId", getModulesByCourse);
router.post("/modules", createModule);
router.put("/modules/:id", updateModule);
router.delete("/modules/:id", deleteModule);

// --- MATERI ---
router.post("/materi", createMateri);
router.get("/materi/:moduleId", getMateriByModule);
router.put("/materi/:id", updateMateri);
router.delete("/materi/:id", deleteMateri);

// --- ASSIGNMENTS ---
router.post("/assignments/upsert", teacherController.upsertAssignment);
router.delete("/assignments/:materiId", teacherController.deleteAssignment);

// --- DASHBOARD TEACHER ---
router.get("/dashboard-stats", teacherController.getDashboardStats);
router.get("/course-progress/:courseId", teacherController.getCourseProgressStats);
router.get("/students-monitor", teacherController.getStudentProgress);

// --- GRADING (TUGAS) ---
router.get("/grading/course/:courseId", teacherController.getGradingModules);
router.get("/grading/materi/:materiId", teacherController.getSubmissionsByMateri);
router.put("/grading/submit/:submissionId", teacherController.updateGrade);

// --- STUDENT RESULTS (PRETEST & POSTTEST) ---
// ✅ Perbaikan: Menggunakan fungsi getTestResults yang dinamis
router.get("/results/:testType/:courseId", teacherController.getTestResults);

module.exports = router;