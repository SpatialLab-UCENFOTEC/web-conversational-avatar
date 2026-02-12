import { useState, useEffect, useRef, useCallback } from "react";
import Avatar from "./Avatar";
import { puterTTS } from "./services/puterTTS";
import { aiService } from "./services/aiService";
import { sttService } from "./services/sttService";
import "./AvatarDemo.css";

const AvatarDemo = () => {
  const [inputText, setInputText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  //  estados STT
  const [isListening, setIsListening] = useState(false);
  const [sttStatus, setSttStatus] = useState({ sttAvailable: false });
  const [interimTranscript, setInterimTranscript] = useState("");

  const [conversation, setConversation] = useState([]);
  const [ttsStatus, setTtsStatus] = useState({
    puterLoaded: false,
    speechApiAvailable: false,
  });

  const avatarRef = useRef(null);
  const conversationEndRef = useRef(null);
  const avatarContainerRef = useRef(null); // Nueva referencia para el contenedor del avatar

  // Verificar estado del TTS + STT al cargar
 useEffect(() => {
  const checkTTSStatus = () => {
    const status = puterTTS.getStatus
      ? puterTTS.getStatus()
      : {
          puterLoaded: typeof window.puter !== "undefined",
          speechApiAvailable: "speechSynthesis" in window,
        };

    setTtsStatus(status);

    //  STT: actualizar disponibilidad del micrófono
    setSttStatus(sttService.getStatus());
  };

  const timer = setTimeout(() => {
    checkTTSStatus();
  }, 1000);

  return () => clearTimeout(timer);
}, []);

  // Función para hacer scroll al avatar
  const scrollToAvatar = useCallback(() => {
    if (avatarContainerRef.current) {
      avatarContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      avatarContainerRef.current.classList.add("avatar-highlight");
      setTimeout(() => {
        if (avatarContainerRef.current) {
          avatarContainerRef.current.classList.remove("avatar-highlight");
        }
      }, 1000);
    }
  }, []);

  // Función para hacer scroll al chat
  const scrollToChat = useCallback(() => {
    if (conversationEndRef.current) {
      conversationEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, []);

  // ✅ NUEVO: detener escucha
const stopListening = useCallback(() => {
  sttService.stop();
  setIsListening(false);

  // ✅ Vuelve a normal al presionar
  if (avatarRef.current?.setMode) {
    avatarRef.current.setMode("idle");
  }
}, []);

  // ✅ NUEVO: iniciar escucha
  const startListening = useCallback(() => {
  if (isSpeaking || isProcessing) return;

  setIsListening(true);

  // ✅ Cambia imagen al presionar
  if (avatarRef.current?.setMode) {
    avatarRef.current.setMode("listening");
  }

  try {
    sttService.start({
      lang: "es-ES",
      onResult: (text, isFinal) => {
        if (isFinal && text) {
          setInputText(text); // pone lo que dices en el textarea
        }
      },
      onEnd: () => {
        setIsListening(false);
        if (avatarRef.current?.setMode) avatarRef.current.setMode("idle");
      },
      onError: () => {
        setIsListening(false);
        if (avatarRef.current?.setMode) avatarRef.current.setMode("idle");
      }
    });
  } catch (err) {
    setIsListening(false);
    if (avatarRef.current?.setMode) avatarRef.current.setMode("idle");
    alert("No se pudo iniciar el micrófono: " + err.message);
  }
}, [isSpeaking, isProcessing]);


  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim()) {
      alert("Por favor, ingresa un mensaje");
      return;
    }

    // ✅ NUEVO: si está escuchando, detenemos para evitar conflictos
    if (isListening) stopListening();

    const userMessage = inputText.trim();
    setInputText("");

    // 1. Primero, hacer scroll al avatar
    scrollToAvatar();

    // 2. Agregar mensaje del usuario a la conversación
    const userMessageObj = { sender: "user", text: userMessage };
    setConversation((prev) => [...prev, userMessageObj]);

    setIsProcessing(true);

    // ✅ NUEVO: si tu Avatar soporta setMode, marcamos processing
    if (avatarRef.current?.setMode) {
      avatarRef.current.setMode("processing");
    }

    try {
      // 3. Obtener respuesta de la IA
      const aiResponse = await aiService.generateResponse(userMessage);

      // 4. Agregar respuesta de la IA a la conversación
      const aiMessageObj = { sender: "ai", text: aiResponse };
      setConversation((prev) => [...prev, aiMessageObj]);

      // 5. Animar el avatar (esto hará que el avatar cambie a modo speaking)
      if (avatarRef.current) {
        avatarRef.current.speak();
      }

      setIsSpeaking(true);

      // 6. Usar TTS para hablar la respuesta (✅ NO TOCAR: queda igual)
      await puterTTS.speak(aiResponse, "es-ES", {
        speed: 1.0,
        volume: 1.0,
        voice: "alloy",
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
  }, [inputText, scrollToAvatar, scrollToChat, isListening, stopListening]);

  const handleStop = useCallback(() => {
    puterTTS.stop();
    setIsSpeaking(false);
    setIsProcessing(false);

    // ✅ NUEVO: también detener STT si estaba escuchando
    if (isListening) stopListening();

    if (avatarRef.current) {
      avatarRef.current.stopSpeaking();
    }
  }, [isListening, stopListening]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleViewAvatar = () => {
    scrollToAvatar();
  };

  const handleViewChat = () => {
    scrollToChat();
  };

  return (
    <div className="avatar-demo">
      <h1 className="demo-title">Avatar Conversacional</h1>

      <div className="status-panel">
        <div className="status-item">
          <span className="status-label">Puter.js:</span>
          <span className={`status-value ${ttsStatus.puterLoaded ? "available" : "unavailable"}`}>
            {ttsStatus.puterLoaded ? "✅ Cargado" : "⚠️ No cargado"}
          </span>
        </div>

        <div className="status-item">
          <span className="status-label">TTS del navegador:</span>
          <span className={`status-value ${ttsStatus.speechApiAvailable ? "available" : "unavailable"}`}>
            {ttsStatus.speechApiAvailable ? "✅ Disponible" : "❌ No disponible"}
          </span>
        </div>

        {/* ✅ NUEVO: STT status */}
        <div className="status-item">
          <span className="status-label">STT (Micrófono):</span>
          <span className={`status-value ${sttStatus.sttAvailable ? "available" : "unavailable"}`}>
            {sttStatus.sttAvailable ? "✅ Disponible" : "❌ No disponible"}
          </span>
        </div>

        <div className="status-item">
          <span className="status-label">Estado:</span>
          <span
            className={`status-value ${
              isListening ? "listening" : isSpeaking ? "speaking" : isProcessing ? "processing" : "idle"
            }`}
          >
            {isListening
              ? "🎙️ Escuchando..."
              : isSpeaking
              ? "🎤 Hablando..."
              : isProcessing
              ? "🤖 Procesando..."
              : "✅ Listo"}
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
                <span
                  className={`status-dot ${
                    isListening ? "listening" : isSpeaking ? "speaking" : isProcessing ? "processing" : "idle"
                  }`}
                ></span>
                <span className="status-text">
                  {isListening ? "Escuchando..." : isSpeaking ? "Hablando..." : isProcessing ? "Procesando..." : "En espera"}
                </span>
              </div>
            </div>

            {/* Botones de navegación */}
            <div className="navigation-buttons">
              <button onClick={handleViewAvatar} className="nav-button view-avatar" title="Ver avatar">
                👁️ Ver avatar
              </button>
              <button onClick={handleViewChat} className="nav-button view-chat" title="Ver conversación">
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
                  <div className="message-content">{msg.text}</div>
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
                disabled={isSpeaking || isProcessing || isListening} // ✅ NUEVO
              />

              {/* ✅ NUEVO: texto intermedio mientras escucha */}
              {isListening && interimTranscript && (
                <div className="interim">
                  <em>Escuchando:</em> {interimTranscript}
                </div>
              )}

              <div className="buttons">
                <button
                  onClick={handleSendMessage}
                  disabled={isSpeaking || isProcessing || isListening || !inputText.trim()} // ✅ NUEVO
                  className="send-button"
                >
                  {isProcessing ? "Procesando..." : "Enviar mensaje"}
                </button>

                <button onClick={handleStop} disabled={!isSpeaking} className="stop-button">
                  Detener voz
                </button>

                {/* ✅ NUEVO: botón micrófono */}
                <button
                  onClick={isListening ? stopListening : startListening}
                  disabled={!sttStatus.sttAvailable || isSpeaking || isProcessing}
                  className={`mic-button ${isListening ? "active" : ""}`}
                  title={isListening ? "Detener micrófono" : "Hablar"}
                >
                  {isListening ? "⏹️ Detener mic" : "🎙️ Hablar"}
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
            <strong>Desarrollado por:</strong> Cenfotec Spatial Lab
          </div>
        </div>

        {!ttsStatus.speechApiAvailable && (
          <p className="warning">⚠️ Tu navegador no soporta Web Speech API. Prueba con Chrome o Edge.</p>
        )}

        {/* ✅ NUEVO: warning STT */}
        {!sttStatus.sttAvailable && (
          <p className="warning">⚠️ Tu navegador no soporta SpeechRecognition (STT). Prueba con Chrome o Edge.</p>
        )}

        <div className="usage-tip">
          💡 <strong>Consejo:</strong> Presiona 🎙️ para hablar; tu texto aparecerá en la caja.
        </div>
      </div>
    </div>
  );
};

export default AvatarDemo;