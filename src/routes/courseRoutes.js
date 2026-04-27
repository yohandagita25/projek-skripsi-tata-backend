const express = require("express");
const router = express.Router();
const { 
    getAvailableCourses, 
    getFullCourses, 
    getCourses, 
    getCourseDetail 
} = require("../controllers/courseController");

// --- RUTE SPESIFIK (Wajib di Atas) ---

// 1. Ambil course yang tersedia untuk pretest/posttest
router.get("/available", getAvailableCourses);

// 2. Ambil course yang tersedia (Alternatif)
router.get("/available-for-test", getAvailableCourses);

// 3. Ambil Course lengkap dengan Modul & Materi
router.get("/courses-full", getFullCourses);


// --- RUTE DINAMIS & UMUM (Wajib di Bawah) ---

// 4. Ambil semua data course (Ringkas)
router.get("/", getCourses);

// 5. Ambil detail satu course berdasarkan ID
router.get("/:id", getCourseDetail);

module.exports = router;