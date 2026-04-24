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

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "https://projek-skripsi-tata.vercel.app");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  
  if (req.method === "OPTIONS") {
    return res.sendStatus(200); // Langsung jawab OK untuk cek ombak browser
  }
  next();
});

// 1. CORS HARUS PALING ATAS agar gambar tidak diblokir browser
// Izinkan Frontend Vercel Bapak untuk mengakses Backend ini
app.use(
  cors({
    origin: [
      "http://localhost:3000", 
      "https://projek-skripsi-tata.vercel.app"
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
  })
);

app.use(express.json())
app.use(cookieParser())

// 2. Akses statis folder uploads
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

app.get("/", (req,res)=>{
  res.send("Backend Semantic Wave Running")
})

// 3. Rute API
app.use("/api/auth", authRoutes)
app.use("/api/courses", courseRoutes)
app.use("/api/modules", moduleRoutes)
app.use("/api/teacher", teacherRoutes)
app.use("/api/tests", testRoutes);
app.use("/api/student", studentRoutes);

module.exports = app