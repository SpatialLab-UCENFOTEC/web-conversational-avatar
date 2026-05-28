// Vercel Serverless Function: genera la respuesta del avatar con Gemini.
// Ruta pública: /api/chat  (POST { message, history })
import { generateGeminiReply } from "../lib/gemini.js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export default async function handler(req, res) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, history } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "message es requerido" });
    }

    const reply = await generateGeminiReply({ message: message.trim(), history });
    return res.status(200).json({ response: reply });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
