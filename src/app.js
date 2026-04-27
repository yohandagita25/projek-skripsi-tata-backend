require("dotenv").config()
const express = require("express")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const path = require("path"); 

const authRoutes = require("./routes/authRoutes")
const courseRoutes = require("./routes/courseRoutes")
const moduleRoutes = require("./routes/moduleRoutes")
const teacherRoutes = require("./routes/teacherRoutes")
const testRoutes = require("./routes/testRoutes");
const studentRoutes = require("./routes/studentRoutes");

const app = express()

// ✅ 1. Cukup Gunakan Library CORS saja (Hapus yang manual tadi)
app.use(
  cors({
    origin: "https://projek-skripsi-tata.vercel.app",
    credentials: true, 
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

app.use(express.json())
app.use(cookieParser())

// Akses statis folder uploads
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (req,res)=>{
  res.send("Backend Semantic Wave Running")
})

// Rute API
app.use("/api/auth", authRoutes)
app.use("/api/courses", courseRoutes)
app.use("/api/modules", moduleRoutes)
app.use("/api/teacher", teacherRoutes)
app.use("/api/tests", testRoutes);
app.use("/api/student", studentRoutes);

module.exports = app