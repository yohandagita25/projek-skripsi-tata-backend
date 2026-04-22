const express = require("express");
const router = express.Router();
const testController = require("../controllers/testController");
const upload = require("../middleware/uploadMiddleware");

router.post("/upload", upload.single("file"), testController.uploadAndParse);
router.post("/upload-image", upload.single("image"), testController.uploadImage);
router.post("/", testController.createTest);

module.exports = router;