// src/components/AvatarDemo.jsx
import { useState, useEffect, useRef } from 'react';
import Avatar from './Avatar';
import { speakWithElevenLabs, stopAllSpeech } from "/src/services/ttsService.jsx";
import './index.css';

const AvatarDemo = () => {
  const [userInput, setUserInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState([
    { text: '¡Hola! Soy el avatar del Cenfotec AI Lab, ahora con voz natural de ElevenLabs. ¿En qué puedo ayudarte?', fromUser: false }
  ]);
  const [apiKeyConfigured, setApiKeyConfigured] = useState(true);
  const messagesEndRef = useRef(null);

  // Verificar si la API Key está configurada
  useEffect(() => {
    const checkApiKey = () => {
      const apiKey = import.meta.env.VITE_ELEVENLABS_API_KEY;
      setApiKeyConfigured(!!apiKey);
      
      if (!apiKey) {
        console.warn('⚠️ API Key no configurada. El avatar usará voz nativa.');
      }
    };
    
    checkApiKey();
  }, []);

  // Desplazarse al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Respuestas mejoradas
  const getAvatarResponse = (input) => {
    const text = input.toLowerCase();
    
    const responses = {
      greeting: [
        '¡Hola! Es un placer conocerte. Soy el avatar del Cenfotec AI Lab.',
        '¡Hola! Qué bueno verte por aquí. ¿Cómo estás hoy?',
        '¡Saludos! Me da gusto conversar contigo.'
      ],
      feeling: [
        'Estoy muy bien, gracias por preguntar. Cada día aprendo algo nuevo.',
        'Me siento excelente, especialmente cuando puedo ayudar a alguien como tú.',
        'Todo bien por aquí, listo para ayudarte en lo que necesites.'
      ],
      identity: [
        'Soy un asistente virtual creado por el equipo del Cenfotec AI Lab. Uso tecnología de vanguardia para sonar natural.',
        'Soy el avatar oficial del laboratorio de IA de Cenfotec, diseñado para demostrar conversaciones naturales con IA.',
        'Me presento: soy un agente conversacional del Cenfotec AI Lab, potenciado por inteligencia artificial.'
      ],
      thanks: [
        '¡De nada! Ha sido un gusto ayudarte.',
        'No hay de qué. Siempre estoy aquí cuando me necesites.',
        '¡Gracias a ti por la conversación!'
      ],
      default: [
        'Interesante. ¿Podrías contarme un poco más sobre eso?',
        'Me gusta ese tema. ¿Qué más te gustaría saber?',
        'Ah, entiendo. ¿Hay algo específico sobre eso que te gustaría conversar?'
      ]
    };

    if (text.includes('hola') || text.includes('buenos días') || text.includes('buenas tardes')) {
      return responses.greeting[Math.floor(Math.random() * responses.greeting.length)];
    }
    if (text.includes('cómo estás') || text.includes('como estas') || text.includes('qué tal')) {
      return responses.feeling[Math.floor(Math.random() * responses.feeling.length)];
    }
    if (text.includes('quién eres') || text.includes('quien eres') || text.includes('qué eres')) {
      return responses.identity[Math.floor(Math.random() * responses.identity.length)];
    }
    if (text.includes('gracias') || text.includes('te lo agradezco')) {
      return responses.thanks[Math.floor(Math.random() * responses.thanks.length)];
    }
    if (text.includes('cenfotec') || text.includes('ai lab')) {
      return 'El Cenfotec AI Lab es un centro de investigación donde exploramos las últimas tecnologías en inteligencia artificial y aprendizaje automático.';
    }
    
    return responses.default[Math.floor(Math.random() * responses.default.length)];
  };

  // Manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userInput.trim() || isSpeaking || isLoading) return;
    
    // Agregar mensaje del usuario
    const userMessage = { text: userInput, fromUser: true };
    setMessages(prev => [...prev, userMessage]);
    
    // Obtener respuesta del avatar
    const response = getAvatarResponse(userInput);
    const avatarMessage = { text: response, fromUser: false };
    setMessages(prev => [...prev, avatarMessage]);
    
    // Limpiar input
    setUserInput('');
    
    // Indicar que está cargando
    setIsLoading(true);
    
    try {
      // Usar ElevenLabs para hablar
      await speakWithElevenLabs(response);
    } catch (error) {
      console.error('Error al hablar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Detener el habla
  const handleStopSpeaking = () => {
    stopAllSpeech();
    setIsSpeaking(false);
    setIsLoading(false);
  };

  // Manejar tecla Enter
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e);
    }
  };

  return (
    <div className="avatar-demo-container">
      {/* Avatar */}
      <div className="avatar-section">
        <Avatar isSpeaking={isSpeaking} />
        <div className="status-indicator">
          <div className={`status-dot ${isSpeaking ? 'speaking' : ''} ${isLoading ? 'loading' : ''}`}></div>
          <span>
            {isLoading ? 'Generando voz...' : 
             isSpeaking ? 'Hablando...' : 'Listo para conversar'}
          </span>
        </div>
      </div>

      {/* Historial de conversación */}
      <div className="conversation-section">
        <div className="messages-window">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.fromUser ? 'user-message' : 'avatar-message'}`}
            >
              <div className="message-sender">
                {message.fromUser ? 'Tú' : 'Avatar AI'}
              </div>
              <div className="message-content">
                {message.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Formulario de entrada */}
        <form onSubmit={handleSubmit} className="input-section">
          <div className="input-group">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escribe tu mensaje aquí..."
              disabled={isSpeaking || isLoading}
              className="message-input"
            />
            
            <div className="button-group">
              <button
                type="submit"
                disabled={!userInput.trim() || isSpeaking || isLoading}
                className="send-button"
              >
                {isLoading ? '🔄' : isSpeaking ? '🎤' : '💬'}
              </button>
              
              {(isSpeaking || isLoading) && (
                <button
                  type="button"
                  onClick={handleStopSpeaking}
                  className="stop-button"
                  title="Detener voz"
                >
                  ⏹️
                </button>
              )}
            </div>
          </div>
          
          <div className="input-hint">
            Presiona Enter para enviar • Usando {apiKeyConfigured ? '🎤 ElevenLabs' : '⚡ Voz nativa'}
          </div>
        </form>
      </div>

      {/* Panel de información sobre ElevenLabs */}
      {!apiKeyConfigured && (
        <div className="api-key-warning">
          <h3>⚠️ Configura tu API Key de ElevenLabs</h3>
          <p>Para disfrutar de voz natural de alta calidad:</p>
          <ol>
            <li>Regístrate en <a href="https://elevenlabs.io" target="_blank" rel="noopener noreferrer">elevenlabs.io</a></li>
            <li>Ve a tu perfil y copia tu API Key</li>
            <li>Crea un archivo <code>.env.local</code> en la raíz del proyecto</li>
            <li>Agrega: <code>VITE_ELEVENLABS_API_KEY=tu_api_key_aqui</code></li>
            <li>Reinicia el servidor de desarrollo</li>
          </ol>
          <p><small>Mientras tanto, el avatar usará la voz nativa del navegador.</small></p>
        </div>
      )}

      {/* Ejemplos de preguntas */}
      <div className="examples-section">
        <h4>💡 Prueba con estas preguntas:</h4>
        <div className="example-buttons">
          {['Hola, ¿cómo estás?', '¿Quién eres?', 'Cuéntame sobre Cenfotec', 'Gracias por tu ayuda'].map((example, idx) => (
            <button
              key={idx}
              onClick={() => {
                setUserInput(example);
                setTimeout(() => {
                  document.querySelector('.message-input')?.focus();
                }, 100);
              }}
              className="example-button"
              disabled={isSpeaking || isLoading}
            >
              {example}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AvatarDemo;