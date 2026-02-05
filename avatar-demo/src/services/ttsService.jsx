import axios from 'axios';

/**
 * Servicio simple para convertir texto a voz usando ElevenLabs
 * @param {string} text - Texto a convertir en voz
 * @returns {Promise} - Promesa que se resuelve cuando termina de hablar
 */
export const speakWithElevenLabs = async (text) => {
  try {
    // Obtener la API Key desde variables de entorno
    // Vite usa import.meta.env, Create React App usa process.env
    const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
    
    if (!apiKey) {
      console.warn('⚠️ API Key de ElevenLabs no encontrada. Usando voz nativa como fallback.');
      return fallbackToNativeTTS(text);
    }

    console.log('🎙️ Generando voz con ElevenLabs...');
    
    // Hacer la petición a la API de ElevenLabs
    const response = await axios.post(
      'https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM', // Voz en español
      {
        text: text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,      // Controla la consistencia de la voz (0-1)
          similarity_boost: 0.75, // Qué tan similar a la voz original (0-1)
          style: 0.3,          // Estilo emocional (0-1)
          use_speaker_boost: true // Mejora la calidad del hablante
        }
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg'
        },
        responseType: 'arraybuffer' // IMPORTANTE: recibir datos binarios
      }
    );
    
    console.log('✅ Audio generado correctamente');
    
    // Crear un Blob con los datos de audio
    const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
    
    // Crear una URL temporal para el blob
    const audioUrl = URL.createObjectURL(audioBlob);
    
    // Crear un elemento de audio y reproducirlo
    const audio = new Audio(audioUrl);
    
    // Retornar una promesa que se resuelve cuando termina la reproducción
    return new Promise((resolve, reject) => {
      audio.onplay = () => {
        console.log('▶️ Reproduciendo audio...');
      };
      
      audio.onended = () => {
        console.log('✅ Audio terminado');
        URL.revokeObjectURL(audioUrl); // Liberar memoria
        resolve();
      };
      
      audio.onerror = (error) => {
        console.error('❌ Error al reproducir audio:', error);
        URL.revokeObjectURL(audioUrl);
        reject(error);
      };
      
      // Intentar reproducir el audio
      audio.play().catch(error => {
        console.error('❌ Error al iniciar reproducción:', error);
        reject(error);
      });
    });
    
  } catch (error) {
    console.error('❌ Error en ElevenLabs TTS:', error);
    
    // Si hay error con ElevenLabs, usar voz nativa como fallback
    console.log('🔄 Usando voz nativa como fallback...');
    return fallbackToNativeTTS(text);
  }
};

/**
 * Función de fallback que usa la Web Speech API nativa
 * @param {string} text - Texto a convertir en voz
 */
const fallbackToNativeTTS = (text) => {
  return new Promise((resolve) => {
    // Verificar si el navegador soporta speechSynthesis
    if (!('speechSynthesis' in window)) {
      console.error('❌ Este navegador no soporta síntesis de voz');
      resolve();
      return;
    }
    
    // Crear el utterance
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Configurar para español
    utterance.lang = 'es-ES';
    utterance.rate = 0.9; // Un poco más lento para sonar más natural
    utterance.pitch = 1.0;
    utterance.volume = 1;
    
    // Seleccionar la mejor voz disponible en español
    const voices = speechSynthesis.getVoices();
    const spanishVoice = voices.find(voice => 
      voice.lang.includes('es') || voice.lang.includes('spa')
    );
    
    if (spanishVoice) {
      utterance.voice = spanishVoice;
    }
    
    // Eventos
    utterance.onend = () => {
      console.log('✅ Voz nativa terminada');
      resolve();
    };
    
    utterance.onerror = (event) => {
      console.error('❌ Error en voz nativa:', event);
      resolve();
    };
    
    // Hablar
    speechSynthesis.speak(utterance);
  });
};

/**
 * Función para detener cualquier reproducción en curso
 */
export const stopAllSpeech = () => {
  // Detener audio de ElevenLabs
  const audioElements = document.querySelectorAll('audio');
  audioElements.forEach(audio => {
    audio.pause();
    audio.currentTime = 0;
  });
  
  // Detener speechSynthesis nativo
  if (speechSynthesis.speaking) {
    speechSynthesis.cancel();
  }
};