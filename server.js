const app = require("./src/app");

const PORT = process.env.PORT || 5000;

// Ini tetap ada agar bisa jalan di lokal
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

// WAJIB: Ekspor app agar Vercel bisa mengenali rute-rutenya
module.exports = app;