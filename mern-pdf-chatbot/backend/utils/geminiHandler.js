const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function askGemini(question, chunks) {
  const context = chunks.join("\n\n").slice(0, 12000);
  const prompt = `Context:\n${context}\n\nQuestion: ${question}\nAnswer:`;
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (err) {
    console.error("Gemini API error:", err);
    return "Sorry, there was an error contacting Gemini API.";
  }
}

async function askGeminiSummary(chunks) {
  const context = chunks.join("\n\n").slice(0, 12000);
  const prompt = `Summarize the following document content in a concise and clear way for a user:\n\n${context}\n\nSummary:`;
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text().trim();
  } catch (err) {
    console.error("Gemini API error:", err);
    return "Sorry, there was an error contacting Gemini API for summary.";
  }
}

module.exports = { askGemini, askGeminiSummary };