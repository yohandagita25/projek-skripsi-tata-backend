const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const studentController = require("../controllers/studentController");
const testController = require("../controllers/testController");

// SEMUA RUTE DI BAWAH INI WAJIB LOGIN
router.use(authenticateToken);

// --- 1. MATERI & TUGAS (Flowchart/Code) ---
router.post("/run-code", studentController.runAndLogCode);
router.post("/submit-assignment", studentController.submitAssignment);
router.get("/submission/:materi_id", studentController.getSubmission);

// --- 2. PRE-TEST & POST-TEST (Gatekeeper) ---
router.get("/course-access/:courseId", testController.checkTestStatus);
router.get("/test-data/:testId", testController.getTestData);
router.post("/submit-test", testController.submitTest);
router.get("/test-review/:testId", testController.getTestReview);

// --- 3. AKTIVITAS & KALENDER (Fitur Baru) ---

// Mencatat aktivitas belajar (Trigger dari frontend MateriPage)
router.post("/log-activity", studentController.logMateriActivity);

// Mengambil total menit belajar untuk Dashboard
router.get("/study-duration", studentController.getStudyDuration);

// Mengambil data untuk mewarnai titik hijau di Kalender Dashboard
router.get("/activity-calendar", studentController.getActivityCalendar);

// --- FITUR BARU: LEARNING STREAK ---
// Tambahkan rute ini agar Dashboard bisa menampilkan angka "🔥 Streak"
router.get("/learning-streak", studentController.getLearningStreak);

router.get("/overall-progress", studentController.getOverallProgress);

// Route untuk menu Challenge
router.get("/challenges", studentController.getChallenges);

module.exports = router;