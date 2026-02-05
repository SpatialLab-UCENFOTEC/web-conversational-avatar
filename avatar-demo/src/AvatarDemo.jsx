import { useState, useEffect, useRef, useCallback } from "react";
import Avatar from "./Avatar";
import { puterTTS } from "./services/puterTTS";
import { aiService } from "./services/aiService"; // Asegúrate de crear este archivo
import "./AvatarDemo.css";

const AvatarDemo = () => {
  const [inputText, setInputText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [ttsStatus, setTtsStatus] = useState({
    puterLoaded: false,
    speechApiAvailable: false,
  });
  const avatarRef = useRef(null);
  const conversationEndRef = useRef(null);

  // Verificar estado del TTS al cargar
  useEffect(() => {
    const checkTTSStatus = () => {
      const status = puterTTS.getStatus ? puterTTS.getStatus() : {
        puterLoaded: typeof window.puter !== 'undefined',
        speechApiAvailable: 'speechSynthesis' in window,
      };
      
      setTtsStatus(status);
    };

    const timer = setTimeout(() => {
      checkTTSStatus();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Desplazar la conversación hacia abajo cuando se agreguen mensajes
  useEffect(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversation]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim()) {
      alert("Por favor, ingresa un mensaje");
      return;
    }

    const userMessage = inputText.trim();
    setInputText("");
    
    // Agregar mensaje del usuario a la conversación
    const userMessageObj = { sender: 'user', text: userMessage };
    setConversation(prev => [...prev, userMessageObj]);

    setIsProcessing(true);

    try {
      // Obtener respuesta de la IA
      const aiResponse = await aiService.generateResponse(userMessage);
      
      // Agregar respuesta de la IA a la conversación
      const aiMessageObj = { sender: 'ai', text: aiResponse };
      setConversation(prev => [...prev, aiMessageObj]);

      // Animar el avatar
      if (avatarRef.current) {
        avatarRef.current.speak();
      }

      setIsSpeaking(true);
      
      // Usar TTS para hablar la respuesta
      await puterTTS.speak(aiResponse, "es-ES", {
        speed: 1.0,
        volume: 1.0,
        voice: "alloy"
      });

    } catch (error) {
      console.error("Error en la conversación:", error);
      alert("Error al procesar la respuesta: " + error.message);
    } finally {
      setIsProcessing(false);
      setIsSpeaking(false);
      if (avatarRef.current) {
        avatarRef.current.stopSpeaking();
      }
    }
  }, [inputText]);

  const handleStop = useCallback(() => {
    puterTTS.stop();
    setIsSpeaking(false);
    setIsProcessing(false);
    if (avatarRef.current) {
      avatarRef.current.stopSpeaking();
    }
  }, []);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="avatar-demo">
      <h1>Avatar Conversacional</h1>
      
      <div className="status-panel">
        <div className="status-item">
          <span className="status-label">Puter.js:</span>
          <span className={`status-value ${ttsStatus.puterLoaded ? 'available' : 'unavailable'}`}>
            {ttsStatus.puterLoaded ? '✅ Cargado' : '⚠️ No cargado'}
          </span>
        </div>
        
        <div className="status-item">
          <span className="status-label">TTS del navegador:</span>
          <span className={`status-value ${ttsStatus.speechApiAvailable ? 'available' : 'unavailable'}`}>
            {ttsStatus.speechApiAvailable ? '✅ Disponible' : '❌ No disponible'}
          </span>
        </div>
        
        <div className="status-item">
          <span className="status-label">Estado:</span>
          <span className={`status-value ${isSpeaking ? 'speaking' : isProcessing ? 'processing' : 'idle'}`}>
            {isSpeaking ? '🎤 Hablando...' : isProcessing ? '🤖 Procesando...' : '✅ Listo'}
          </span>
        </div>
      </div>

      <div className="avatar-container">
        <Avatar ref={avatarRef} />
      </div>

      <div className="conversation-container">
        <div className="conversation">
          {conversation.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-content">
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={conversationEndRef} />
        </div>
      </div>

      <div className="controls">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Escribe tu mensaje aquí..."
          rows={3}
          disabled={isSpeaking || isProcessing}
        />
        
        <div className="buttons">
          <button 
            onClick={handleSendMessage} 
            disabled={isSpeaking || isProcessing || !inputText.trim()}
            className="send-button"
          >
            {isProcessing ? 'Procesando...' : 'Enviar'}
          </button>
          
          <button 
            onClick={handleStop} 
            disabled={!isSpeaking}
            className="stop-button"
          >
            Detener
          </button>
        </div>
      </div>

      <div className="info-panel">
        <h3>Información:</h3>
        <p>
          Escribe un mensaje y el avatar responderá usando IA y Text-to-Speech.
        </p>
        {!ttsStatus.speechApiAvailable && (
          <p className="warning">
            ⚠️ Tu navegador no soporta Web Speech API. Prueba con Chrome o Edge.
          </p>
        )}
      </div>
    </div>
  );
};

export default AvatarDemo;