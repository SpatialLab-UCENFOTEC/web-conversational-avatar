// src/services/sttService.js
class STTService {
  constructor() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    this.available = !!SR;
    this.recognition = this.available ? new SR() : null;

    this.isListening = false;
    this._onResult = null;
    this._onEnd = null;
    this._onError = null;

    if (this.recognition) {
      this.recognition.lang = "es-ES";
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;

      this.recognition.onresult = (event) => {
        let transcript = "";
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          transcript += res[0].transcript;
          if (res.isFinal) isFinal = true;
        }

        if (this._onResult) this._onResult(transcript.trim(), isFinal);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (this._onEnd) this._onEnd();
      };

      this.recognition.onerror = (e) => {
        this.isListening = false;
        if (this._onError) this._onError(e);
      };
    }
  }

  getStatus() {
    return { sttAvailable: this.available, isListening: this.isListening };
  }

  start({ lang = "es-ES", onResult, onEnd, onError } = {}) {
    if (!this.available) throw new Error("STT no disponible en este navegador");

    this.recognition.lang = lang;
    this._onResult = onResult || null;
    this._onEnd = onEnd || null;
    this._onError = onError || null;

    this.isListening = true;
    this.recognition.start();
  }

  stop() {
    if (!this.available || !this.recognition) return;
    try {
      this.recognition.stop();
    } catch (_) {}
  }
}

// ✅ ESTO ES CLAVE:
export const sttService = new STTService();