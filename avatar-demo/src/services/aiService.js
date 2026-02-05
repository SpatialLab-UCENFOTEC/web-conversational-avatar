// src/services/aiService.js

class AIService {
  constructor() {
    this.puterLoaded = typeof window.puter !== 'undefined';
  }

  async generateResponse(userMessage) {
    // Si Puter.js está cargado y autenticado, usamos su IA
    if (this.puterLoaded && window.puter.ai) {
      try {
        const response = await window.puter.ai.completions.create({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: userMessage }],
          max_tokens: 100,
        });
        return response.choices[0].message.content;
      } catch (error) {
        console.error('Error usando Puter AI, usando fallback:', error);
        // Si falla, usamos el fallback
      }
    }

    // Fallback: respuestas predefinidas
    return this.fallbackResponse(userMessage);
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