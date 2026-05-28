// Cliente del LLM. Llama a la función serverless /api/chat (Gemini server-side).
// En local apunta al proxy (VITE_CHAT_PROXY_URL, p.ej. http://localhost:3001);
// en producción usa "/api" (mismo origen en Vercel).
class AIService {
  constructor() {
    this.base = import.meta.env.VITE_CHAT_PROXY_URL || "/api";
  }

  async generateResponse(message, history = []) {
    try {
      const res = await fetch(`${this.base}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });

      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.error || `Error ${res.status}`);
      }

      const data = await res.json();
      return data.response;
    } catch (error) {
      console.error("Error al obtener respuesta del LLM:", error);
      return this.fallbackResponse(message);
    }
  }

  // Respuesta de respaldo si el LLM no está disponible.
  fallbackResponse(message) {
    const m = message.toLowerCase();
    if (m.includes("hola")) return "¡Hola! ¿En qué te ayudo?";
    if (m.includes("ayuda")) return "Puedes hablarme por micrófono o escribir.";
    return "Lo siento, ahora mismo no puedo responder. Intenta de nuevo.";
  }
}

export const aiService = new AIService();
