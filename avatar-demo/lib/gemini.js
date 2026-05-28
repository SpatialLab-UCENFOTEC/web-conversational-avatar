// Lógica de LLM con Gemini, compartida entre la función serverless de Vercel
// (api/chat.js) y el proxy local de desarrollo (server/index.js).
// La API key vive solo en el servidor (GEMINI_API_KEY), nunca en el cliente.

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";

const SYSTEM_INSTRUCTION =
  "Eres un avatar conversacional en español. Responde de forma breve (1-3 frases), " +
  "natural y cálida, como en una conversación hablada. No uses markdown, listas ni emojis, " +
  "porque tu respuesta se convierte en voz.";

// Convierte el historial de la UI ({ sender, text }) al formato de Gemini.
function toGeminiContents(history, message) {
  const past = (history || [])
    .filter((m) => m && typeof m.text === "string" && m.text.trim())
    .map((m) => ({
      role: m.sender === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

  return [...past, { role: "user", parts: [{ text: message }] }];
}

export async function generateGeminiReply({ message, history = [] }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no está definida");
  }

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent` +
    `?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: toGeminiContents(history, message),
      generationConfig: { temperature: 0.8, maxOutputTokens: 256 },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Gemini ${res.status}: ${detail}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p) => p.text)
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini devolvió una respuesta vacía");
  }

  return text;
}
