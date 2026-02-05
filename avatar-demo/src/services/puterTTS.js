// src/services/puterTTS.js
/**
 * Servicio de Text-to-Speech con Puter.js (si está disponible)
 */
class PuterTTS {
  constructor() {
    this.isSpeaking = false;
    this.currentAudio = null;
    this.puterLoaded = false;
    
    // Verificar si Puter.js está cargado
    this.checkPuter();
  }

  /**
   * Verificar si Puter.js está disponible
   */
  checkPuter() {
    this.puterLoaded = typeof window.puter !== 'undefined';
    
    if (this.puterLoaded) {
      console.log('✅ Puter.js detectado en el sistema');
      // No intentamos autenticar automáticamente para evitar errores 401
    } else {
      console.log('⚠️ Puter.js no disponible. Usando Web Speech API');
    }
    
    return this.puterLoaded;
  }

  /**
   * Convertir texto a voz
   */
  async speak(text, language = 'es-ES', options = {}) {
    if (!text || text.trim() === '') {
      throw new Error('El texto no puede estar vacío');
    }

    // Detener cualquier audio actual
    this.stop();

    console.log('🔊 Iniciando síntesis de voz...');
    console.log('📝 Texto:', text.substring(0, 100));

    this.isSpeaking = true;

    // Primero intentamos con Puter.js si está cargado
    if (this.puterLoaded) {
      try {
        return await this.speakWithPuter(text, options);
      } catch (puterError) {
        console.warn('⚠️ Error con Puter.js, usando fallback:', puterError.message);
        // Si Puter.js falla, continuamos con el fallback
      }
    }

    // Usar Web Speech API como fallback o primera opción
    return await this.speakWithWebSpeech(text, language, options);
  }

  /**
   * Usar Puter.js para TTS
   */
  async speakWithPuter(text, options = {}) {
    console.log('🔊 Usando Puter.js para TTS');
    
    // NOTA: Puter.js podría requerir autenticación
    // Si no estamos autenticados, esto fallará silenciosamente
    // y caerá al fallback
    
    try {
      // Verificar si puter.openai está disponible
      if (!window.puter.openai || !window.puter.openai.audio) {
        throw new Error('API de OpenAI no disponible en Puter.js');
      }

      const response = await window.puter.openai.audio.speech.create({
        model: options.model || 'tts-1',
        voice: options.voice || 'alloy',
        input: text,
        speed: options.speed || 1.0,
      });

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      const audio = new Audio(audioUrl);
      audio.volume = options.volume || 1.0;
      
      this.currentAudio = audio;

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          this.isSpeaking = false;
          this.currentAudio = null;
          URL.revokeObjectURL(audioUrl);
          resolve();
        };

        audio.onerror = (error) => {
          this.isSpeaking = false;
          this.currentAudio = null;
          URL.revokeObjectURL(audioUrl);
          reject(error);
        };

        audio.play().catch(reject);
      });

    } catch (error) {
      // Si hay error de autenticación (401) u otro error, lo propagamos
      throw error;
    }
  }

  /**
   * Usar Web Speech API del navegador
   */
  async speakWithWebSpeech(text, language = 'es-ES', options = {}) {
    console.log('🔊 Usando Web Speech API');
    
    if (!('speechSynthesis' in window)) {
      throw new Error('Tu navegador no soporta Text-to-Speech');
    }

    // Detener cualquier síntesis previa
    window.speechSynthesis.cancel();

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = options.speed || 1.0;
      utterance.volume = options.volume || 1.0;
      utterance.pitch = options.pitch || 1.0;

      // Configurar voz (si está disponible)
      if (options.voice) {
        const voices = window.speechSynthesis.getVoices();
        const selectedVoice = voices.find(v => v.name.includes(options.voice));
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      }

      utterance.onstart = () => {
        console.log('▶️ Web Speech TTS iniciado');
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        console.log('✅ Web Speech TTS terminado');
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        console.error('❌ Error en Web Speech TTS:', event.error);
        reject(new Error(event.error));
      };

      // Si las voces no están cargadas, esperar a que se carguen
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => {
          window.speechSynthesis.speak(utterance);
        };
      } else {
        window.speechSynthesis.speak(utterance);
      }
    });
  }

  /**
   * Detener reproducción actual
   */
  stop() {
    // Detener audio de Puter
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }
    
    // Detener Web Speech API
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    if (this.isSpeaking) {
      this.isSpeaking = false;
      console.log('⏹️ Audio detenido');
    }
  }

  /**
   * Obtener estado del servicio
   */
  getStatus() {
    return {
      puterLoaded: this.puterLoaded,
      speechApiAvailable: 'speechSynthesis' in window,
      isSpeaking: this.isSpeaking,
      puterAuthenticated: false // No verificamos autenticación para evitar errores
    };
  }
}

// Exportar instancia única
export const puterTTS = new PuterTTS();