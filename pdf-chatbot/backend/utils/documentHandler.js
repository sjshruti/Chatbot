const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const path = require("path");

async function extractTextFromDocuments(files) {
  const chunks = [];

  for (const file of files) {
    const ext = path.extname(file.originalname).toLowerCase();
    try {
      if (ext === ".pdf") {
        const data = await pdfParse(file.buffer);
        const lines = data.text.match(/(.|\n){1,500}/g);
        if (lines) chunks.push(...lines);
      } else if (ext === ".docx") {
        const result = await mammoth.extractRawText({ buffer: file.buffer });
        const lines = result.value.match(/(.|\n){1,500}/g);
        if (lines) chunks.push(...lines);
      } else if (ext === ".txt") {
        const text = file.buffer.toString("utf-8");
        const lines = text.match(/(.|\n){1,500}/g);
        if (lines) chunks.push(...lines);
      } else {
        console.warn(`Unsupported file type: ${file.originalname}`);
      }
    } catch (err) {
      console.error(`Error processing file ${file.originalname}:`, err);
      // Continue processing other files
    }
  }

  return chunks;
}

module.exports = { extractTextFromDocuments };