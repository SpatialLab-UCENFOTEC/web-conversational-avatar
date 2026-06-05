import express from "express";
import cors from "cors";
import { GoogleAuth } from "google-auth-library";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { generateGeminiReply } from "../lib/gemini.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

// Prioriza credenciales por env var (mismo mecanismo que prod en Vercel).
// Fallback al archivo local solo para desarrollo; el archivo está gitignored.
const scopes = ["https://www.googleapis.com/auth/cloud-platform"];
const auth = process.env.GOOGLE_CREDENTIALS_JSON
  ? new GoogleAuth({ credentials: JSON.parse(process.env.GOOGLE_CREDENTIALS_JSON), scopes })
  : new GoogleAuth({ keyFile: join(__dirname, "google-credentials.json"), scopes });

app.get("/token", async (_req, res) => {
  try {
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    res.json({ access_token: tokenResponse.token });
  } catch (err) {
    console.error("❌ Error generando token:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post("/chat", async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "message es requerido" });
    }
    const reply = await generateGeminiReply({ message: message.trim(), history });
    res.json({ response: reply });
  } catch (err) {
    console.error("❌ Error en /chat:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`✅ Proxy corriendo en http://localhost:${PORT}`);
});