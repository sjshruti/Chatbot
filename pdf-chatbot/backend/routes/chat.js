const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const { askGemini, askGeminiSummary } = require("../utils/geminiHandler");

let chunks = [];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

router.post("/upload", upload.array("documents"), async (req, res) => {
  try {
    chunks = [];
    for (const file of req.files) {
      let content = "";
      const ext = path.extname(file.originalname).toLowerCase();
      if (
        file.mimetype === "application/pdf" ||
        ext === ".pdf"
      ) {
        // Extract text from PDF
        const dataBuffer = fs.readFileSync(file.path);
        const pdfData = await pdfParse(dataBuffer);
        content = pdfData.text;
      } else if (
        file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
        ext === ".docx"
      ) {
        // Extract text from DOCX
        const result = await mammoth.extractRawText({ path: file.path });
        content = result.value;
      } else if (
        file.mimetype === "text/plain" ||
        ext === ".txt"
      ) {
        // Plain text file
        content = fs.readFileSync(file.path, "utf8");
      } else {
        content = "";
      }
      chunks.push(content);
    }
    res.json({ message: "Files uploaded and processed." });
  } catch (err) {
    res.status(500).json({ error: "Failed to process files." });
  }
});

router.post("/chat", async (req, res) => {
  const { question } = req.body;
  if (!chunks.length) {
    return res.status(400).json({ error: "No documents uploaded" });
  }
  try {
    const answer = await askGemini(question, chunks.slice(0, 20));
    res.json({ answer });
  } catch (err) {
    res.status(500).json({ error: "Failed to get answer" });
  }
});

router.post("/summary", async (req, res) => {
  if (!chunks.length) {
    return res.status(400).json({ error: "No documents uploaded" });
  }
  try {
    const summary = await askGeminiSummary(chunks.slice(0, 20));
    res.json({ summary });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate summary" });
  }
});

module.exports = router;