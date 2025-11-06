// 1. Import necessary libraries
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");             // 🟢 NEW: to read the uploaded file
const crypto = require("crypto");     // 🟢 NEW: to compute file hash

// 2. Initialize the Express application
const app = express();
const PORT = 8000;

// 3. Apply middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 4. Configure Multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// 5. Define API Endpoints (Routes)

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Server is up and running!" });
});

// 🟢 Updated upload route with hash computation
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  try {
    // --- Compute SHA-256 hash of uploaded file ---
    const filePath = path.join(__dirname, "uploads", req.file.filename);
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    // --- End hash computation ---

    console.log("✅ File uploaded:", req.file.filename);
    console.log("🔒 File hash:", fileHash);

    // Send both file path and hash back to frontend
    res.json({
      message: "File uploaded successfully!",
      filePath: `/uploads/${req.file.filename}`,
      fileName: req.file.filename,
      fileHash: fileHash, // 🟢 Send hash to frontend
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ message: "Error computing file hash." });
  }
});

// 6. Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});
