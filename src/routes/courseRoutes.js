const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");

// --- RUTE SPESIFIK (Wajib di Atas) ---

// 1. Ambil course yang tersedia untuk pretest/posttest
// Akses: /api/courses/available?type=pretest
router.get("/available", courseController.getAvailableCourses);

// 2. Ambil course yang tersedia (Nama rute alternatif jika Bapak pakai ini)
router.get("/available-for-test", courseController.getAvailableCourses);

// 3. Ambil Course lengkap dengan Modul & Materi
// Akses: /api/courses/courses-full
router.get("/courses-full", courseController.getFullCourses);


// --- RUTE DINAMIS & UMUM (Wajib di Bawah) ---

// 4. Ambil semua data course (Ringkas)
// Akses: /api/courses/
router.get("/", courseController.getCourses);

// 5. Ambil detail satu course berdasarkan ID
// Akses: /api/courses/1
// NOTE: Ini ditaruh paling bawah agar tidak memakan rute /available atau /courses-full
router.get("/:id", courseController.getCourseDetail);

module.exports = router;