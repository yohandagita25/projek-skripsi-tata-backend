const express = require("express");
const router = express.Router();
const { 
    uploadAndParse, 
    uploadImage, 
    createTest, 
    checkTestStatus, 
    submitTest, 
    getTestData, 
    getTestReview 
} = require("../controllers/testController");

const upload = require("../middleware/uploadMiddleware");
const authenticateToken = require("../middleware/authMiddleware");

// --- RUTE GURU ---
router.post("/upload", upload.single("file"), uploadAndParse);
router.post("/upload-image", upload.single("image"), uploadImage);
router.post("/", authenticateToken, createTest);

// --- RUTE SISWA ---
// (Rute-rute ini juga dipanggil di studentRoutes.js Bapak)
router.get("/course-access/:courseId", authenticateToken, checkTestStatus);
router.get("/test-data/:testId", authenticateToken, getTestData);
router.post("/submit-test", authenticateToken, submitTest);
router.get("/test-review/:testId", authenticateToken, getTestReview);

module.exports = router;