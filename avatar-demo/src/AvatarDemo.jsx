import { useState, useEffect, useRef, useCallback } from "react";
import { puterTTS } from "./services/puterTTS";
import { aiService } from "./services/aiService";
import { sttService } from "./services/sttService";
import "./AvatarDemo.css";
import Live2DAvatar from "./Live2DAvatar";

const AvatarDemo = () => {
  const [inputText, setInputText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ Estados STT
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
  const avatarContainerRef = useRef(null);

  // ✅ Verificar estado del TTS + STT al cargar
  useEffect(() => {
    const checkStatus = () => {
      const status = puterTTS.getStatus
        ? puterTTS.getStatus()
        : {
            puterLoaded: typeof window.puter !== "undefined",
            speechApiAvailable: "speechSynthesis" in window,
          };

      setTtsStatus(status);
      setSttStatus(sttService.getStatus());
    };

    const timer = setTimeout(checkStatus, 1000);
    return () => clearTimeout(timer);
  }, []);

  // ✅ Scroll al avatar
  const scrollToAvatar = useCallback(() => {
    if (avatarContainerRef.current) {
      avatarContainerRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
        inline: "nearest",
      });

      avatarContainerRef.current.classList.add("avatar-highlight");
      setTimeout(() => {
        avatarContainerRef.current?.classList.remove("avatar-highlight");
      }, 1000);
    }
  }, []);

  // ✅ Scroll al chat
  const scrollToChat = useCallback(() => {
    conversationEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, []);

  // ✅ Detener escucha
  const stopListening = useCallback(() => {
    sttService.stop();
    setIsListening(false);
    setInterimTranscript("");

    avatarRef.current?.setMode?.("idle");
  }, []);

  // ✅ Iniciar escucha
  const startListening = useCallback(() => {
    if (isSpeaking || isProcessing) return;

    setIsListening(true);
    setInterimTranscript("");
    scrollToAvatar();

    avatarRef.current?.setMode?.("listening");

    try {
      sttService.start({
        lang: "es-ES",
        onResult: (text, isFinal) => {
          setInterimTranscript(isFinal ? "" : text);
          if (isFinal && text) setInputText(text);
        },
        onEnd: () => {
          setIsListening(false);
          setInterimTranscript("");
          avatarRef.current?.setMode?.("idle");
        },
        onError: () => {
          setIsListening(false);
          setInterimTranscript("");
          avatarRef.current?.setMode?.("idle");
        },
      });
    } catch (err) {
      setIsListening(false);
      setInterimTranscript("");
      avatarRef.current?.setMode?.("idle");
      alert("No se pudo iniciar el micrófono: " + err.message);
    }
  }, [isSpeaking, isProcessing, scrollToAvatar]);

  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim()) {
      alert("Por favor, ingresa un mensaje");
      return;
    }

    // ✅ Si estaba escuchando, detener STT
    if (isListening) stopListening();

    const userMessage = inputText.trim();
    setInputText("");

    scrollToAvatar();
    setConversation((prev) => [...prev, { sender: "user", text: userMessage }]);

    setIsProcessing(true);

    try {
      const aiResponse = await aiService.generateResponse(userMessage);

      setConversation((prev) => [...prev, { sender: "ai", text: aiResponse }]);

      avatarRef.current?.setMode?.("speaking");
      setIsSpeaking(true);

      // ✅ TTS intacto
      await puterTTS.speak(aiResponse, "es-ES", {
        speed: 1.0,
        volume: 1.0,
        voice: "alloy",
      });

      scrollToChat();
    } catch (error) {
      console.error("Error en la conversación:", error);
      alert("Error al procesar la respuesta: " + error.message);
    } finally {
      setIsProcessing(false);
      setIsSpeaking(false);
      avatarRef.current?.setMode?.("idle");
    }
  }, [inputText, isListening, stopListening, scrollToAvatar, scrollToChat]);

  const handleStop = useCallback(() => {
    puterTTS.stop();
    setIsSpeaking(false);
    setIsProcessing(false);

    if (isListening) stopListening();

    avatarRef.current?.setMode?.("idle");
  }, [isListening, stopListening]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleViewAvatar = () => scrollToAvatar();
  const handleViewChat = () => scrollToChat();

  return (
    <div className="avatar-demo">
      <h1 className="demo-title">Avatar Conversacional</h1>

      <div className="status-panel">
        <div className="status-item">
          <span className="status-label">Puter.js:</span>
          <span className={`status-value ${ttsStatus.puterLoaded ? "available" : "unavailable"}`}>
            {ttsStatus.puterLoaded ? "Cargado" : "No cargado"}
          </span>
        </div>

        <div className="status-item">
          <span className="status-label">TTS del navegador:</span>
          <span className={`status-value ${ttsStatus.speechApiAvailable ? "available" : "unavailable"}`}>
            {ttsStatus.speechApiAvailable ? "Disponible" : "No disponible"}
          </span>
        </div>

        <div className="status-item">
          <span className="status-label">STT (Micrófono):</span>
          <span className={`status-value ${sttStatus.sttAvailable ? "available" : "unavailable"}`}>
            {sttStatus.sttAvailable ? "Disponible" : "No disponible"}
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
        <div className="avatar-section" ref={avatarContainerRef}>
          <div className="avatar-container">
            <Live2DAvatar ref={avatarRef} />
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
                  {isListening
                    ? "Escuchando..."
                    : isSpeaking
                    ? "Hablando..."
                    : isProcessing
                    ? "Procesando..."
                    : "En espera"}
                </span>
              </div>
            </div>

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
                disabled={isSpeaking || isProcessing || isListening}
              />

              {isListening && interimTranscript && (
                <div className="interim">
                  <em>Escuchando:</em> {interimTranscript}
                </div>
              )}

              <div className="buttons">
                <button
                  onClick={handleSendMessage}
                  disabled={isSpeaking || isProcessing || isListening || !inputText.trim()}
                  className="send-button"
                >
                  {isProcessing ? "Procesando..." : "Enviar mensaje"}
                </button>

                <button onClick={handleStop} disabled={!isSpeaking} className="stop-button">
                  Detener voz
                </button>

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
          <p className="warning">Tu navegador no soporta Web Speech API. Prueba con Chrome o Edge.</p>
        )}

        {!sttStatus.sttAvailable && (
          <p className="warning">Tu navegador no soporta SpeechRecognition (STT). Prueba con Chrome o Edge.</p>
        )}

        <div className="usage-tip">
          💡 <strong>Consejo:</strong> Presiona 🎙️ para hablar; tu texto aparecerá en la caja.
        </div>
      </div>
    </div>
  );
};

export default AvatarDemo;