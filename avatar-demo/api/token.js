// Vercel Serverless Function: emite un access_token de Google Cloud
// a partir de credenciales de service account guardadas en env var.
// Ruta pública: /api/token
import { GoogleAuth } from "google-auth-library";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

export default async function handler(req, res) {
  Object.entries(corsHeaders).forEach(([k, v]) => res.setHeader(k, v));

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const raw = process.env.GOOGLE_CREDENTIALS_JSON;
    if (!raw) {
      // Fallar explícito: sin credenciales no hay token posible.
      throw new Error("GOOGLE_CREDENTIALS_JSON no está definida");
    }

    const credentials = JSON.parse(raw);

    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const client = await auth.getClient();
    const tokenResponse = await client.getAccessToken();

    return res.status(200).json({ access_token: tokenResponse.token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
