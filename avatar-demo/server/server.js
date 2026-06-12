// server.js — Proxy local para desarrollo
// Replica /api/chat y /api/token de las Vercel Serverless Functions
import express from "express";
import cors from "cors";
import { GoogleAuth } from "google-auth-library";
import { GoogleGenerativeAI } from "@google/generative-ai";
import "dotenv/config";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// ── /api/token — Access token de Google Cloud (para TTS/STT) ──────────────
app.get("/api/token", async (req, res) => {
  try {
    const raw = process.env.GOOGLE_CREDENTIALS_JSON;
    if (!raw) throw new Error("GOOGLE_CREDENTIALS_JSON no está definida en .env");

    const credentials = JSON.parse(raw);
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    return res.json({ access_token: tokenResponse.token });
  } catch (err) {
    console.error("❌ /api/token error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

// ── /api/chat — Respuesta del avatar con Gemini ───────────────────────────
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body || {};
    if (!message?.trim()) {
      return res.status(400).json({ error: "message es requerido" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY no está definida en .env");

    const modelName = process.env.GEMINI_MODEL || "gemini-2.0-flash";
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });

    // Convertir historial al formato que espera Gemini
    const geminiHistory = history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({ history: geminiHistory });
    const result = await chat.sendMessage(message.trim());
    const reply = result.response.text();

    return res.json({ response: reply });
  } catch (err) {
    console.error("❌ /api/chat error:", err.message);
    return res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Proxy local corriendo en http://localhost:${PORT}`);
  console.log(`   → POST http://localhost:${PORT}/api/chat`);
  console.log(`   → GET  http://localhost:${PORT}/api/token`);
});