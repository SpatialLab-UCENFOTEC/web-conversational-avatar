// src/services/aiService.js

class AIService {
  constructor() {
    this.puterLoaded = typeof window.puter !== 'undefined';
  }

  async generateResponse(userMessage) {
    try {
      const response = await fetch(`${window.location.origin}/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: userMessage,
          model: 'llama3.2'
        })
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.response;

    } catch (error) {
      console.error('Error al obtener respuesta:', error);
      
      // Fallback: respuestas predefinidas
      return this.fallbackResponse(userMessage);
    }
  }

  fallbackResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('hola')) {
      return '¡Hola! ¿Cómo estás?';
    } else if (lowerMessage.includes('cómo estás')) {
      return 'Estoy bien, gracias por preguntar.';
    } else if (lowerMessage.includes('qué es un avatar')) {
      return 'Un avatar es una representación digital de una persona, a menudo usada en entornos virtuales.';
    } else if (lowerMessage.includes('qué puedes hacer')) {
      return 'Puedo responder tus preguntas y hablar contigo usando texto a voz.';
    } else {
      return 'Interesante pregunta. ¿Puedes contarme más?';
    }
  }
}

export const aiService = new AIService();