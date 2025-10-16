// 1. Import necessary libraries
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path"); // A Node.js core module for working with file paths

// 2. Initialize the Express application
const app = express();
const PORT = 8000; // We'll run our server on port 8000

// 3. Apply middleware
app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Allow the server to parse JSON in request bodies
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Serve files from the 'uploads' directory statically

// 4. Configure Multer for file storage
const storage = multer.diskStorage({
  // Set the destination for uploaded files
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  // Set the filename for uploaded files
  filename: function (req, file, cb) {
    // Create a unique filename to avoid overwrites: timestamp + original name
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname));
  },
});

// Initialize multer with the storage configuration
const upload = multer({ storage: storage });

// 5. Define API Endpoints (Routes)

// A simple "health check" route to confirm the server is running
app.get("/", (req, res) => {
  res.json({ message: "Server is up and running!" });
});

// The main file upload route
// The 'upload.single("file")' middleware processes a single file upload from a form field named "file"
app.post("/api/upload", upload.single("file"), (req, res) => {
  // If the file upload is successful, multer adds a 'file' object to the request
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded." });
  }

  // We can access file details via req.file
  console.log("File uploaded successfully:", req.file);

  // For the frontend, we'll send back the path to the uploaded file
  // so it can be referenced later.
  const filePath = `/uploads/${req.file.filename}`;
  res.json({
    message: "File uploaded successfully!",
    filePath: filePath,
    fileName: req.file.filename
  });
});

// 6. Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is listening on http://localhost:${PORT}`);
});