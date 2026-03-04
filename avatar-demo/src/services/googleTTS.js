// src/services/googleTTS.js
/**
 * Servicio de Text-to-Speech con Google Cloud TTS
 * Reemplaza puterTTS.js manteniendo la misma API pública
 *
 * SEGURIDAD: El access token se obtiene desde tu backend proxy.
 * Configura VITE_GOOGLE_TTS_PROXY_URL en tu .env apuntando a tu endpoint.
 *
 * Si estás en desarrollo local sin backend, puedes usar VITE_GOOGLE_ACCESS_TOKEN
 * con un token temporal generado con: gcloud auth print-access-token
 */

const PROXY_URL = import.meta.env.VITE_GOOGLE_TTS_PROXY_URL || null;
const DEV_TOKEN = import.meta.env.VITE_GOOGLE_ACCESS_TOKEN || null;
const GCP_PROJECT = import.meta.env.VITE_GCP_PROJECT_ID || "alien-program-489205-m5";

// Voces recomendadas en español (WaveNet = más natural, Standard = más rápida)
const VOICE_PRESETS = {
  es_wavenet_female: { languageCode: "es-ES", name: "es-ES-Wavenet-C", ssmlGender: "FEMALE" },
  es_wavenet_male:   { languageCode: "es-ES", name: "es-ES-Wavenet-B", ssmlGender: "MALE"   },
  es_standard:       { languageCode: "es-ES", name: "es-ES-Standard-A", ssmlGender: "FEMALE" },
  en_wavenet_female: { languageCode: "en-US", name: "en-US-Wavenet-F", ssmlGender: "FEMALE" },
};

class GoogleTTS {
  constructor() {
    this.isSpeaking   = false;
    this.currentAudio = null;
  }

  // ── Obtener token de acceso ────────────────────────────────────────────────
  async _getAccessToken() {
    // 1) Si hay proxy (producción / dev con backend)
    if (PROXY_URL) {
      const res = await fetch(`${PROXY_URL}/token`);
      if (!res.ok) throw new Error("No se pudo obtener el token del proxy");
      const { access_token } = await res.json();
      return access_token;
    }

    // 2) Token de dev hardcodeado en .env (solo local, caduca ~1h)
    if (DEV_TOKEN) {
      console.warn("⚠️ Usando token de desarrollo. No uses esto en producción.");
      return DEV_TOKEN;
    }

    throw new Error(
      "No hay forma de obtener un token Google. " +
      "Define VITE_GOOGLE_TTS_PROXY_URL o VITE_GOOGLE_ACCESS_TOKEN en tu .env"
    );
  }

  // ── Sintetizar audio via Google Cloud TTS REST API ─────────────────────────
  async _synthesize(text, voiceOptions = {}) {
    const token = await this._getAccessToken();

    const voice = voiceOptions.voicePreset
      ? VOICE_PRESETS[voiceOptions.voicePreset] ?? VOICE_PRESETS.es_wavenet_female
      : {
          languageCode: voiceOptions.languageCode || "es-ES",
          name:         voiceOptions.voiceName     || "es-ES-Wavenet-C",
          ssmlGender:   voiceOptions.ssmlGender    || "FEMALE",
        };

    const body = {
      input:       { text },
      voice,
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate:  voiceOptions.speed  ?? 1.0,
        pitch:         voiceOptions.pitch  ?? 0.0,
        volumeGainDb:  voiceOptions.volume ?? 0.0,
      },
    };

    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize`,
      {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${token}`,
          "x-goog-user-project": GCP_PROJECT,
        },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Google TTS error ${res.status}: ${err?.error?.message || res.statusText}`);
    }

    const { audioContent } = await res.json();

    // audioContent viene en base64 → convertir a Blob
    const binary = atob(audioContent);
    const bytes  = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: "audio/mpeg" });
  }

  // ── API pública (igual que puterTTS) ──────────────────────────────────────

  /**
   * speak(text, language?, options?)
   *
   * options: {
   *   speed?       : 0.25–4.0  (default 1.0)
   *   pitch?       : -20–20 semitones (default 0)
   *   volume?      : -96–16 dB (default 0 = sin cambio)
   *   voiceName?   : nombre exacto de voz Google (ej. "es-ES-Wavenet-C")
   *   voicePreset? : clave de VOICE_PRESETS (ej. "es_wavenet_female")
   *   languageCode?: ej. "es-ES" (default)
   * }
   */
  async speak(text, language = "es-ES", options = {}) {
    if (!text?.trim()) throw new Error("El texto no puede estar vacío");

    this.stop();
    this.isSpeaking = true;

    console.log("🔊 Google TTS — sintetizando...");

    try {
      const blob     = await this._synthesize(text, { languageCode: language, ...options });
      const audioUrl = URL.createObjectURL(blob);
      const audio    = new Audio(audioUrl);
      audio.volume   = 1.0; // volumeGainDb ya lo controla Google

      this.currentAudio = audio;

      // Esperar metadata para que el lip-sync pueda leer duración
      await new Promise((resolve) => {
        if (audio.readyState >= 1) return resolve();
        audio.onloadedmetadata = resolve;
        audio.onerror          = resolve;
      });

      return new Promise((resolve, reject) => {
        audio.onended = () => {
          this.isSpeaking    = false;
          this.currentAudio  = null;
          URL.revokeObjectURL(audioUrl);
          resolve();
        };
        audio.onerror = (e) => {
          this.isSpeaking    = false;
          this.currentAudio  = null;
          URL.revokeObjectURL(audioUrl);
          reject(e);
        };
        audio.play().catch((e) => {
          this.isSpeaking    = false;
          this.currentAudio  = null;
          URL.revokeObjectURL(audioUrl);
          reject(e);
        });
      });

    } catch (error) {
      console.error("❌ Google TTS falló, usando Web Speech API:", error.message);
      this.isSpeaking = false;
      return this._speakWithWebSpeech(text, language, options);
    }
  }

  /** Fallback: Web Speech API del navegador */
  async _speakWithWebSpeech(text, language, options = {}) {
    if (!("speechSynthesis" in window)) throw new Error("Tu navegador no soporta TTS");

    window.speechSynthesis.cancel();
    this.isSpeaking = true;

    return new Promise((resolve, reject) => {
      const utterance  = new SpeechSynthesisUtterance(text);
      utterance.lang   = language;
      utterance.rate   = options.speed  ?? 1.0;
      utterance.pitch  = 1.0;
      utterance.volume = 1.0;

      utterance.onend   = () => { this.isSpeaking = false; resolve(); };
      utterance.onerror = (e) => { this.isSpeaking = false; reject(new Error(e.error)); };

      const go = () => window.speechSynthesis.speak(utterance);
      window.speechSynthesis.getVoices().length === 0
        ? (window.speechSynthesis.onvoiceschanged = go)
        : go();
    });
  }

  /** Detener reproducción actual */
  stop() {
    if (this.currentAudio) {
      try { this.currentAudio.pause(); this.currentAudio.currentTime = 0; } catch {}
      this.currentAudio = null;
    }
    window.speechSynthesis?.cancel();
    if (this.isSpeaking) { this.isSpeaking = false; console.log("⏹️ Google TTS detenido"); }
  }

  /** Para lip-sync real (igual que puterTTS) */
  getCurrentAudio() { return this.currentAudio; }

  /** Estado del servicio */
  getStatus() {
    return {
      provider:            "google-cloud-tts",
      speechApiAvailable:  "speechSynthesis" in window,
      isSpeaking:          this.isSpeaking,
      proxyConfigured:     !!PROXY_URL,
      devTokenConfigured:  !!DEV_TOKEN,
    };
  }
}

export const googleTTS = new GoogleTTS();

// Alias para que AvatarDemo no necesite cambios en el import
export const puterTTS = googleTTS;