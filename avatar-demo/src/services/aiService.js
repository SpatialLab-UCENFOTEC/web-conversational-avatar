// src/services/aiService.js
class AIService {
  constructor() {
    this.apiBase = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
  }

  async generateResponse(userMessage) {
    try {
      const response = await fetch(`${this.apiBase}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: userMessage,
          model: "llama3.2",
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error("Error al obtener respuesta:", error);
      return this.fallbackResponse(userMessage);
    }
  }

  fallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("hola")) return "¡Hola! ¿Cómo estás?";
    if (lowerMessage.includes("cómo estás")) return "Estoy bien, gracias por preguntar.";
    if (lowerMessage.includes("qué es un avatar"))
      return "Un avatar es una representación digital de una persona, a menudo usada en entornos virtuales.";
    if (lowerMessage.includes("qué puedes hacer"))
      return "Puedo responder tus preguntas y hablar contigo usando texto a voz.";
    return "Interesante pregunta. ¿Puedes contarme más?";
  }
}

export const aiService = new AIService();