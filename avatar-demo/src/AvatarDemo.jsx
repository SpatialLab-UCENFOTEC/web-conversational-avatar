import { useState, useEffect, useRef, useCallback } from "react";
import Avatar from "./Avatar";
import { puterTTS } from "./services/puterTTS";
import { aiService } from "./services/aiService";
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
  const avatarContainerRef = useRef(null); // Nueva referencia para el contenedor del avatar

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

  // Función para hacer scroll al avatar
  const scrollToAvatar = useCallback(() => {
    if (avatarContainerRef.current) {
      // Hacer scroll suave al contenedor del avatar
      avatarContainerRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center', // Centrar verticalmente
        inline: 'nearest' 
      });
      
      // Agregar un efecto visual de resaltado
      avatarContainerRef.current.classList.add('avatar-highlight');
      setTimeout(() => {
        if (avatarContainerRef.current) {
          avatarContainerRef.current.classList.remove('avatar-highlight');
        }
      }, 1000);
    }
  }, []);

  // Función para hacer scroll al chat
  const scrollToChat = useCallback(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end' 
      });
    }
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim()) {
      alert("Por favor, ingresa un mensaje");
      return;
    }

    const userMessage = inputText.trim();
    setInputText("");
    
    // 1. Primero, hacer scroll al avatar
    scrollToAvatar();
    
    // 2. Agregar mensaje del usuario a la conversación
    const userMessageObj = { sender: 'user', text: userMessage };
    setConversation(prev => [...prev, userMessageObj]);

    setIsProcessing(true);

    try {
      // 3. Obtener respuesta de la IA
      const aiResponse = await aiService.generateResponse(userMessage);
      
      // 4. Agregar respuesta de la IA a la conversación
      const aiMessageObj = { sender: 'ai', text: aiResponse };
      setConversation(prev => [...prev, aiMessageObj]);

      // 5. Animar el avatar (esto hará que el avatar cambie a modo speaking)
      if (avatarRef.current) {
        avatarRef.current.speak();
      }

      setIsSpeaking(true);
      
      // 6. Usar TTS para hablar la respuesta
      await puterTTS.speak(aiResponse, "es-ES", {
        speed: 1.0,
        volume: 1.0,
        voice: "alloy"
      });

      // 7. Cuando termine de hablar, hacer scroll al chat para ver la respuesta completa
      scrollToChat();

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
  }, [inputText, scrollToAvatar, scrollToChat]);

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

  // Opcional: Agregar botón para ver el avatar manualmente
  const handleViewAvatar = () => {
    scrollToAvatar();
  };

  // Opcional: Agregar botón para ver el chat manualmente
  const handleViewChat = () => {
    scrollToChat();
  };

  return (
    <div className="avatar-demo">
      <h1 className="demo-title">Avatar Conversacional</h1>
      
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

      <div className="main-content">
        {/* Sección izquierda: Avatar */}
        <div className="avatar-section" ref={avatarContainerRef}>
          <div className="avatar-container">
            <Avatar ref={avatarRef} />
          </div>
          
          <div className="avatar-info">
            <h3>🤖 Avatar IA</h3>
            <p>Representación digital del Cenfotec AI Lab</p>
            <div className="avatar-status">
              <div className="status-indicator">
                <span className={`status-dot ${isSpeaking ? 'speaking' : isProcessing ? 'processing' : 'idle'}`}></span>
                <span className="status-text">
                  {isSpeaking ? 'Hablando...' : isProcessing ? 'Procesando...' : 'En espera'}
                </span>
              </div>
            </div>
            
            {/* Botones de navegación */}
            <div className="navigation-buttons">
              <button 
                onClick={handleViewAvatar}
                className="nav-button view-avatar"
                title="Ver avatar"
              >
                👁️ Ver avatar
              </button>
              <button 
                onClick={handleViewChat}
                className="nav-button view-chat"
                title="Ver conversación"
              >
                💬 Ver chat
              </button>
            </div>
          </div>
        </div>

        {/* Sección derecha: Chat */}
        <div className="chat-section">
          <div className="chat-header">
            <h3>💬 Conversación</h3>
            <div className="chat-stats">
              <span className="stat-item">📊 {conversation.length} mensajes</span>
              <span className="stat-item">🤖 Modelo: llama3.2</span>
            </div>
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

          <div className="chat-controls">
            <div className="controls">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Escribe tu mensaje aquí (Presiona Enter para enviar)..."
                rows={3}
                disabled={isSpeaking || isProcessing}
              />
              
              <div className="buttons">
                <button 
                  onClick={handleSendMessage} 
                  disabled={isSpeaking || isProcessing || !inputText.trim()}
                  className="send-button"
                >
                  {isProcessing ? 'Procesando...' : 'Enviar mensaje'}
                </button>
                
                <button 
                  onClick={handleStop} 
                  disabled={!isSpeaking}
                  className="stop-button"
                >
                  Detener voz
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="info-panel">
        <h3>ℹ️ Información del sistema</h3>
        <div className="info-grid">
          <div className="info-item">
            <strong>Backend:</strong> FastAPI con Ollama
          </div>
          <div className="info-item">
            <strong>TTS:</strong> Puter.js + Web Speech API
          </div>
          <div className="info-item">
            <strong>IA:</strong> Modelo llama3.2
          </div>
          <div className="info-item">
            <strong>Desarrollado por:</strong> Cenfotec AI Lab
          </div>
        </div>
        {!ttsStatus.speechApiAvailable && (
          <p className="warning">
            ⚠️ Tu navegador no soporta Web Speech API. Prueba con Chrome o Edge.
          </p>
        )}
        <div className="usage-tip">
          💡 <strong>Consejo:</strong> El avatar se animará cuando hable. La pantalla se moverá automáticamente para mostrarlo.
        </div>
      </div>
    </div>
  );
};

export default AvatarDemo;