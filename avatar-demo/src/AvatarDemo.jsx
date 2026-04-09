import { useState, useEffect, useRef, useCallback } from "react";
import { googleTTS } from "./services/googleTTS";
import { sttService } from "./services/googleSTT";
import { startFakeLipSync } from "./services/lipSync";
import InochiAvatarCanvas from "./components/InochiAvatarCanvas";
import "./AvatarDemo.css";

const AvatarDemo = () => {
  const [inputText, setInputText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [conversation, setConversation] = useState([]);

  const [ttsStatus, setTtsStatus] = useState({
    googleLoaded: false,
    speechApiAvailable: false,
    proxyConfigured: false,
  });

  const [sttStatus, setSttStatus] = useState({
    sttAvailable: false,
  });

  const avatarRef = useRef(null);
  const lipSyncRef = useRef(null);
  const conversationEndRef = useRef(null);
  const avatarContainerRef = useRef(null);

  const getLocalResponse = useCallback((userMessage) => {
    const m = userMessage.toLowerCase();

    if (m.includes("hola")) {
      return "¡Hola! Estoy funcionando con Inochi2D en React. ¿En qué te ayudo?";
    }
    if (m.includes("quién") || m.includes("quien")) {
      return "Soy un avatar conversacional renderizado con Inochi2D, con voz y sincronización labial.";
    }
    if (m.includes("ayuda")) {
      return "Puedes hablar con el micrófono o escribir. Yo responderé con voz.";
    }
    if (m.includes("lip") || m.includes("boca")) {
      return "Estoy moviendo la boca con parámetros del modelo Inochi2D.";
    }

    return "Estoy en modo demo sin servidor. Si quieres IA real, luego conectamos un backend.";
  }, []);

  useEffect(() => {
    const checkStatus = () => {
      const tts = googleTTS.getStatus?.() || {};
      const stt = sttService.getStatus?.() || {};

      setTtsStatus({
        googleLoaded: !!tts.googleLoaded,
        speechApiAvailable: !!tts.speechApiAvailable,
        proxyConfigured: !!tts.proxyConfigured,
      });

      setSttStatus({
        sttAvailable: !!stt.sttAvailable,
      });
    };

    const timer = setTimeout(checkStatus, 500);
    return () => clearTimeout(timer);
  }, []);

  const scrollToAvatar = useCallback(() => {
    if (!avatarContainerRef.current) return;

    avatarContainerRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });

    avatarContainerRef.current.classList.add("avatar-highlight");

    setTimeout(() => {
      avatarContainerRef.current?.classList.remove("avatar-highlight");
    }, 1000);
  }, []);

  const scrollToChat = useCallback(() => {
    conversationEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, []);

  const stopLipSync = useCallback(() => {
    if (lipSyncRef.current) {
      lipSyncRef.current.stop();
      lipSyncRef.current = null;
    }

    avatarRef.current?.setMouthOpen?.(0);
    avatarRef.current?.setMode?.("idle");
  }, []);

  const stopListening = useCallback(() => {
    sttService.stop?.();
    setIsListening(false);
    setInterimTranscript("");
    avatarRef.current?.setMode?.("idle");
  }, []);

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
          if (isFinal && text) {
            setInputText(text);
          }
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

    if (isListening) {
      stopListening();
    }

    const userMessage = inputText.trim();
    setInputText("");

    scrollToAvatar();
    setConversation((prev) => [...prev, { sender: "user", text: userMessage }]);
    setIsProcessing(true);

    try {
      const aiResponse = getLocalResponse(userMessage);

      setConversation((prev) => [
        ...prev,
        { sender: "ai", text: aiResponse },
      ]);

      avatarRef.current?.setMode?.("speaking");
      setIsSpeaking(true);

      stopLipSync();

      lipSyncRef.current = startFakeLipSync((value) => {
        avatarRef.current?.setMouthOpen?.(value);
      });

     await googleTTS.speak(aiResponse, "es-US", {
      speed: 0.95,
      voiceName: "es-US-Chirp-HD-O",
      languageCode: "es-US"
      });
      scrollToChat();
    } catch (error) {
      console.error("Error:", error);
      alert("Error al hablar: " + error.message);
    } finally {
      setIsProcessing(false);
      setIsSpeaking(false);
      stopLipSync();
      avatarRef.current?.setMouthOpen?.(0);
      avatarRef.current?.setMode?.("idle");
    }
  }, [
    inputText,
    isListening,
    stopListening,
    scrollToAvatar,
    scrollToChat,
    getLocalResponse,
    stopLipSync,
  ]);

  const handleStop = useCallback(() => {
    googleTTS.stop?.();
    setIsSpeaking(false);
    setIsProcessing(false);

    if (isListening) {
      stopListening();
    }

    stopLipSync();
    avatarRef.current?.setMode?.("idle");
  }, [isListening, stopListening, stopLipSync]);

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

return (
  <div className="avatar-demo">
    <h1 className="demo-title">Avatar Conversacional Inochi2D</h1>

    <div className="status-panel">
      <div className="status-item">
        <span className="status-label">Google TTS:</span>
        <span className={`status-value ${ttsStatus.proxyConfigured ? "available" : "unavailable"}`}>
          {ttsStatus.proxyConfigured ? "Proxy configurado" : "Sin proxy"}
        </span>
      </div>

      <div className="status-item">
        <span className="status-label">TTS del navegador:</span>
        <span className={`status-value ${ttsStatus.speechApiAvailable ? "available" : "unavailable"}`}>
          {ttsStatus.speechApiAvailable ? "Disponible" : "No disponible"}
        </span>
      </div>

      <div className="status-item">
        <span className="status-label">STT:</span>
        <span className={`status-value ${sttStatus.sttAvailable ? "available" : "unavailable"}`}>
          {sttStatus.sttAvailable ? "Disponible" : "No disponible"}
        </span>
      </div>

      <div className="status-item">
        <span className="status-label">Estado:</span>
        <span
          className={`status-value ${
            isListening
              ? "listening"
              : isSpeaking
              ? "speaking"
              : isProcessing
              ? "processing"
              : "idle"
          }`}
        >
          {isListening
            ? "Escuchando..."
            : isSpeaking
            ? "Hablando..."
            : isProcessing
            ? "Procesando..."
            : "Listo"}
        </span>
      </div>
    </div>

    <div className="main-content">
      <div className="avatar-section" ref={avatarContainerRef}>
        <div className="avatar-container">
          <InochiAvatarCanvas
          ref={avatarRef}
          avatarUrl="/avatar/Irene.inp"
        />
        </div>
      </div>

      <div className="chat-section">
        <div className="conversation-container">
          <div className="conversation">
            {conversation.map((msg, index) => (
              <div key={index} className={`message ${msg.sender}`}>
                <div className="message-content">{msg.text}</div>
              </div>
            ))}

            {interimTranscript && (
              <div className="message user interim">
                <div className="message-content">{interimTranscript}</div>
              </div>
            )}

            <div ref={conversationEndRef} />
          </div>
        </div>

        <div className="chat-controls">
          <div className="controls">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Escribe o usa el micrófono..."
              rows={3}
              disabled={isProcessing}
            />

            <div className="button-group">
              <button
                onClick={handleSendMessage}
                disabled={isProcessing || !inputText.trim()}
              >
                Enviar
              </button>

              <button
                onClick={isListening ? stopListening : startListening}
                disabled={isProcessing || isSpeaking}
              >
                {isListening ? "Detener micrófono" : "Hablar"}
              </button>

              <button onClick={handleStop}>
                Detener todo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};

export default AvatarDemo;