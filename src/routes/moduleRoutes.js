const express = require("express");
const router = express.Router();
const { 
    getModules, 
    getModuleById, 
    createModule, 
    updateModule, 
    deleteModule 
} = require("../controllers/moduleController");
const authenticateToken = require("../middleware/authMiddleware");
const authorizeRole = require("../middleware/roleMiddleware");

router.get("/", authenticateToken, getModules);
router.get("/:id", authenticateToken, getModuleById);
router.post("/", authenticateToken, authorizeRole(['teacher']), createModule);
router.put("/:id", authenticateToken, authorizeRole(['teacher']), updateModule);
router.delete("/:id", authenticateToken, authorizeRole(['teacher']), deleteModule);

module.exports = router;