// server/index.js
import express from "express";
import cors from "cors";
import { GoogleAuth } from "google-auth-library";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors({ origin: "http://localhost:5173" })); // puerto de Vite
app.use(express.json());

// ── Google Auth ──────────────────────────────────────────────────────────────
const auth = new GoogleAuth({
  keyFile: join(__dirname, "google-credentials.json"),
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

// ── GET /token → devuelve access token temporal (~1h) ────────────────────────
app.get("/token", async (req, res) => {
  try {
    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();
    res.json({ access_token: tokenResponse.token });
  } catch (err) {
    console.error("❌ Error generando token:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", (_, res) => res.json({ status: "ok" }));

app.listen(PORT, () => {
  console.log(`✅ Proxy corriendo en http://localhost:${PORT}`);
});