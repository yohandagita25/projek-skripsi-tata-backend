const express = require("express");
const router = express.Router();
const { 
    getAvailableCourses, 
    getFullCourses, 
    getCourses, 
    getCourseDetail 
} = require("../controllers/courseController");

// --- RUTE SPESIFIK ---

// 1. Ambil course yang tersedia untuk test (Pretest/Posttest)
// Panggil di Frontend: /api/teacher/available
router.get("/available", getAvailableCourses);
router.get("/available-for-test", getAvailableCourses);

// --- RUTE UTAMA (JOIN TABLE) ---

// 2. Ambil semua data course LENGKAP dengan Modul & Materi
// ✅ SINKRONISASI: Saya pindahkan getFullCourses ke rute utama "/"
// Karena di Frontend Bapak memanggil: api.get("/api/teacher/courses")
router.get("/", getFullCourses); 

// 3. Cadangan rute spesifik jika tetap ingin dipanggil terpisah
router.get("/all/full", getFullCourses);


// --- RUTE DINAMIS & RINGKAS ---

// 4. Ambil data ringkas (Jika dibutuhkan)
router.get("/list/summary", getCourses);

// 5. Ambil detail satu course berdasarkan ID
// ✅ Wajib di paling bawah agar tidak bentrok dengan rute teks
router.get("/:id", getCourseDetail);

module.exports = router;