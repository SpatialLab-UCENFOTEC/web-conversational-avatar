import { useState, useEffect, useRef, useCallback } from "react";
import { puterTTS } from "./services/puterTTS";
import { sttService } from "./services/sttService";
import "./AvatarDemo.css";
import Live2DAvatar from "./Live2DAvatar";
import { startFakeLipSync } from "./services/lipSync";

const AvatarDemo = () => {
  const [inputText, setInputText] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // ✅ STT
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

  // ✅ Lip sync controller
  const lipSyncRef = useRef(null);

  const stopLipSync = useCallback(() => {
    if (lipSyncRef.current) {
      lipSyncRef.current.stop();
      lipSyncRef.current = null;
    }
    avatarRef.current?.setMouthOpen?.(0);
  }, []);

  // ✅ Mock IA local (sin backend)
  const getLocalResponse = useCallback((userMessage) => {
    const m = userMessage.toLowerCase();

    if (m.includes("hola")) return "¡Hola! Estoy funcionando sin backend. ¿En qué te ayudo?";
    if (m.includes("quién") || m.includes("quien")) return "Soy un avatar de demostración con voz y sincronización labial.";
    if (m.includes("ayuda")) return "Puedes hablar con el micrófono o escribir. Yo responderé con voz.";
    if (m.includes("lip") || m.includes("boca")) return "¡Mira mi boca moverse! Eso es lip-sync en Live2D.";
    return "Estoy en modo demo sin servidor. Si quieres IA real, luego conectamos un backend.";
  }, []);

  // ✅ Estado TTS + STT al cargar
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

    const timer = setTimeout(checkStatus, 500);
    return () => clearTimeout(timer);
  }, []);

  // ✅ Scroll helpers
  const scrollToAvatar = useCallback(() => {
    if (!avatarContainerRef.current) return;

    avatarContainerRef.current.scrollIntoView({
      behavior: "smooth",
      block: "center",
      inline: "nearest",
    });

    avatarContainerRef.current.classList.add("avatar-highlight");
    setTimeout(() => avatarContainerRef.current?.classList.remove("avatar-highlight"), 1000);
  }, []);

  const scrollToChat = useCallback(() => {
    conversationEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  // ✅ STT controls
  const stopListening = useCallback(() => {
    sttService.stop();
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

  // ✅ SEND (sin backend + con lip sync)
 // REEMPLAZA solo la función handleSendMessage en AvatarDemo.jsx

const handleSendMessage = useCallback(async () => {
  if (!inputText.trim()) {
    alert("Por favor, ingresa un mensaje");
    return;
  }

  if (isListening) stopListening();

  const userMessage = inputText.trim();
  setInputText("");

  scrollToAvatar();
  setConversation((prev) => [...prev, { sender: "user", text: userMessage }]);
  setIsProcessing(true);

  try {
    const aiResponse = getLocalResponse(userMessage);
    setConversation((prev) => [...prev, { sender: "ai", text: aiResponse }]);

    // 1. Poner avatar en modo speaking ANTES de hablar
    avatarRef.current?.setMode?.("speaking");
    setIsSpeaking(true);

    // 2. Detener lip sync anterior
    stopLipSync();

    // 3. Iniciar lip sync apropiado según el TTS que se usará
    const audioEl = puterTTS.getCurrentAudio?.();

    if (audioEl) {
      // ✅ Caso Puter: audio real → lip sync real
      lipSyncRef.current = startLipSyncFromAudioElement(audioEl, (v) => {
        avatarRef.current?.setMouthOpen?.(v);
      });
    } else {
      // ✅ Caso Web Speech: no hay audio real → lip sync falso
      const approxMs = Math.max(1500, aiResponse.length * 55);
      lipSyncRef.current = startFakeLipSync(approxMs, (v) => {
        avatarRef.current?.setMouthOpen?.(v);
      });
    }

    // 4. Hablar (await bloquea hasta que termina)
    await puterTTS.speak(aiResponse, "es-ES", {
      speed: 1.0,
      volume: 1.0,
      voice: "alloy",
    });

    scrollToChat();
  } catch (error) {
    console.error("Error:", error);
    alert("Error al hablar: " + error.message);
  } finally {
    setIsProcessing(false);
    setIsSpeaking(false);
    stopLipSync();
    avatarRef.current?.setMouthOpen?.(0); // ←
    // ✅ Volver a idle → ticker pondrá boca en 0 automáticamente
    avatarRef.current?.setMode?.("idle");
  }
}, [inputText, isListening, stopListening, scrollToAvatar, scrollToChat, getLocalResponse, stopLipSync]);

  const handleStop = useCallback(() => {
    puterTTS.stop();
    setIsSpeaking(false);
    setIsProcessing(false);

    if (isListening) stopListening();

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
      <h1 className="demo-title">Avatar Conversacional </h1>

      <div className="status-panel">
        <div className="status-item">
          <span className="status-label">Puter.js:</span>
          <span className={`status-value ${ttsStatus.puterLoaded ? "available" : "unavailable"}`}>
            {ttsStatus.puterLoaded ? " Cargado" : " No cargado"}
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
            {sttStatus.sttAvailable ? "Disponible" : " No disponible"}
          </span>
        </div>

        <div className="status-item">
          <span className="status-label">Estado:</span>
          <span className={`status-value ${isListening ? "listening" : isSpeaking ? "speaking" : isProcessing ? "processing" : "idle"}`}>
            {isListening ? " Escuchando..." : isSpeaking ? " Hablando..." : isProcessing ? " Procesando..." : " Listo"}
          </span>
        </div>
      </div>

      <div className="main-content">
        <div className="avatar-section" ref={avatarContainerRef}>
          <div className="avatar-container">
            <Live2DAvatar ref={avatarRef} />
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
                  {isListening ? "⏹️ Detener mic" : " Hablar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="info-panel">
        <p>
          ✅ Este modo es <strong>sin backend</strong>. Si quieres IA real con Ollama, luego conectamos un servidor.
        </p>
      </div>
    </div>
  );
};

export default AvatarDemo;