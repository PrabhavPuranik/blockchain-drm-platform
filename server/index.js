// 1. Import necessary libraries
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

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

// 5. API Endpoints

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Server is up and running!" });
});

// 🟢 Upload route — computes file hash for blockchain
app.post("/api/upload", upload.single("file"), (req, res) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded." });

  try {
    const filePath = path.join(__dirname, "uploads", req.file.filename);
    const fileBuffer = fs.readFileSync(filePath);
    const fileHash = crypto.createHash("sha256").update(fileBuffer).digest("hex");

    console.log("✅ File uploaded:", req.file.filename);
    console.log("🔒 File hash:", fileHash);

    res.json({
      message: "File uploaded successfully!",
      filePath: `/uploads/${req.file.filename}`,
      fileName: req.file.filename,
      fileHash: fileHash,
    });
  } catch (error) {
    console.error("❌ Upload error:", error);
    res.status(500).json({ message: "Error computing file hash." });
  }
});

// 🟢 NEW: Video streaming with HTTP Range support
app.get("/stream/:filename", (req, res) => {
  const filePath = path.join(__dirname, "uploads", req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: "File not found." });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  // If client requests specific byte range (e.g., for seeking)
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

    if (start >= fileSize) {
      res.status(416).send("Requested range not satisfiable");
      return;
    }

    const chunkSize = end - start + 1;
    const file = fs.createReadStream(filePath, { start, end });
    const mimeType = getMimeType(filePath);

    const headers = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": mimeType,
    };
    res.writeHead(206, headers);
    file.pipe(res);
  } else {
    // Serve full file
    const mimeType = getMimeType(filePath);
    const headers = {
      "Content-Length": fileSize,
      "Content-Type": mimeType,
    };
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  }
});

// Helper: Detect MIME type by extension
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".mp4": "video/mp4",
    ".webm": "video/webm",
    ".mov": "video/quicktime",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

// 🟢 Optional: Log every access attempt (for watermark tracking)
app.post("/api/log-view", (req, res) => {
  const { contentId, viewerAddress } = req.body;
  const timestamp = new Date().toISOString();

  const logEntry = `[${timestamp}] Viewer: ${viewerAddress} viewed content ID: ${contentId}\n`;
  fs.appendFileSync("access-log.txt", logEntry);

  console.log("📜 View logged:", logEntry.trim());
  res.json({ success: true });
});

// 6. Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
});
