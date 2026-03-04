// src/services/googleSTT.js
/**
 * Servicio de Speech-to-Text con Google Cloud STT
 * Reemplaza sttService.js manteniendo la misma API pública:
 *   sttService.start({ lang, onResult, onEnd, onError })
 *   sttService.stop()
 *   sttService.getStatus()
 *
 * Estrategia:
 *   1. Captura audio con MediaRecorder (WebM/Opus o OGG)
 *   2. Al detener, envía el blob a Google Cloud Speech-to-Text REST API
 *   3. Emite resultados parciales simulados mientras graba (intervalo)
 *      y el resultado final cuando llega la respuesta de Google.
 *
 * Para resultados parciales REALES puedes usar la API de Streaming (gRPC)
 * pero eso requiere un proxy WebSocket en el backend.
 * Esta implementación es 100% frontend-only.
 */

const PROXY_URL   = import.meta.env.VITE_GOOGLE_STT_PROXY_URL || null;
const DEV_TOKEN   = import.meta.env.VITE_GOOGLE_ACCESS_TOKEN  || null;
const GCP_PROJECT = import.meta.env.VITE_GCP_PROJECT_ID       || "alien-program-489205-m5";

// Tiempo máximo de grabación en ms (seguridad)
const MAX_RECORD_MS = 30_000;

class GoogleSTT {
  constructor() {
    this._mediaRecorder  = null;
    this._audioChunks    = [];
    this._stream         = null;
    this._stopTimer      = null;
    this._partialTimer   = null;
    this._isListening    = false;
    this._callbacks      = {};
  }

  // ── Token ──────────────────────────────────────────────────────────────────
  async _getAccessToken() {
    if (PROXY_URL) {
      const res = await fetch(`${PROXY_URL}/token`);
      if (!res.ok) throw new Error("No se pudo obtener el token del proxy");
      const { access_token } = await res.json();
      return access_token;
    }
    if (DEV_TOKEN) {
      console.warn("⚠️ Usando token de desarrollo. No uses esto en producción.");
      return DEV_TOKEN;
    }
    throw new Error(
      "Define VITE_GOOGLE_STT_PROXY_URL o VITE_GOOGLE_ACCESS_TOKEN en tu .env"
    );
  }

  // ── Transcribir blob de audio ──────────────────────────────────────────────
  async _transcribe(audioBlob, languageCode = "es-ES") {
    const token = await this._getAccessToken();

    // Convertir blob a base64
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload  = () => resolve(reader.result.split(",")[1]);
      reader.onerror = reject;
      reader.readAsDataURL(audioBlob);
    });

    // Detectar encoding según mimeType disponible
    const mimeType = audioBlob.type || "";
    let encoding = "WEBM_OPUS"; // default Chrome/Edge
    if (mimeType.includes("ogg"))  encoding = "OGG_OPUS";
    if (mimeType.includes("mp4"))  encoding = "MP4";
    if (mimeType.includes("wav"))  encoding = "LINEAR16";

    const body = {
      config: {
        encoding,
        sampleRateHertz:        48000,
        languageCode,
        enableAutomaticPunctuation: true,
        model: "latest_long",
        alternativeLanguageCodes: languageCode.startsWith("es") ? ["es-US"] : [],
      },
      audio: { content: base64 },
    };

    const res = await fetch(
      "https://speech.googleapis.com/v1/speech:recognize",
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
      throw new Error(`Google STT error ${res.status}: ${err?.error?.message || res.statusText}`);
    }

    const data = await res.json();

    // Unir todos los fragmentos de la transcripción
    const transcript = (data.results || [])
      .flatMap((r) => r.alternatives || [])
      .sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
      .map((a) => a.transcript)
      .join(" ")
      .trim();

    return transcript;
  }

  // ── API pública ────────────────────────────────────────────────────────────

  /**
   * start({ lang, onResult, onEnd, onError })
   *
   * onResult(text, isFinal) — isFinal=false mientras graba (texto simulado),
   *                            isFinal=true cuando Google responde
   * onEnd()   — llamado al terminar
   * onError() — llamado si hay error
   */
  async start({ lang = "es-ES", onResult, onEnd, onError } = {}) {
    if (this._isListening) {
      console.warn("STT: ya está escuchando, ignorando start()");
      return;
    }

    this._callbacks = { onResult, onEnd, onError };

    try {
      this._stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (err) {
      console.error("❌ No se pudo acceder al micrófono:", err);
      onError?.(err);
      return;
    }

    // Elegir mimeType soportado
    const mimeType = [
      "audio/webm;codecs=opus",
      "audio/webm",
      "audio/ogg;codecs=opus",
      "audio/ogg",
    ].find((t) => MediaRecorder.isTypeSupported(t)) || "";

    this._audioChunks   = [];
    this._isListening   = true;
    this._mediaRecorder = new MediaRecorder(this._stream, mimeType ? { mimeType } : {});

    this._mediaRecorder.ondataavailable = (e) => {
      if (e.data?.size > 0) this._audioChunks.push(e.data);
    };

    this._mediaRecorder.onstop = async () => {
      this._isListening = false;
      clearInterval(this._partialTimer);
      clearTimeout(this._stopTimer);
      this._releaseStream();

      const blob = new Blob(this._audioChunks, { type: mimeType || "audio/webm" });
      this._audioChunks = [];

      console.log("🎤 Enviando audio a Google STT...");
      try {
        const transcript = await this._transcribe(blob, lang);
        console.log("✅ Transcripción:", transcript);
        if (transcript) {
          onResult?.(transcript, true);   // resultado final
        }
      } catch (err) {
        console.error("❌ Error Google STT:", err);
        onError?.(err);
      } finally {
        onEnd?.();
      }
    };

    // Grabar en chunks cada 250ms para tener datos
    this._mediaRecorder.start(250);

    // ── Indicador visual de "escuchando" (texto simulado) ──────────────────
    const ellipsis = [".", "..", "..."];
    let tick = 0;
    this._partialTimer = setInterval(() => {
      if (!this._isListening) return;
      onResult?.(`Escuchando${ellipsis[tick % 3]}`, false);
      tick++;
    }, 600);

    // ── Corte automático por seguridad ─────────────────────────────────────
    this._stopTimer = setTimeout(() => {
      console.warn("⏱ STT: tiempo máximo alcanzado, deteniendo...");
      this.stop();
    }, MAX_RECORD_MS);

    console.log("🎤 Google STT — grabando (lang:", lang, ")");
  }

  /** Detener grabación y enviar a Google */
  stop() {
    clearInterval(this._partialTimer);
    clearTimeout(this._stopTimer);

    if (this._mediaRecorder && this._mediaRecorder.state !== "inactive") {
      try { this._mediaRecorder.stop(); } catch {}
    } else {
      // Si ya estaba inactivo, igual limpiamos
      this._isListening = false;
      this._releaseStream();
      this._callbacks.onEnd?.();
    }
  }

  _releaseStream() {
    if (this._stream) {
      this._stream.getTracks().forEach((t) => t.stop());
      this._stream = null;
    }
  }

  getStatus() {
    return {
      provider:     "google-cloud-stt",
      sttAvailable: !!(navigator.mediaDevices?.getUserMedia),
      isListening:  this._isListening,
    };
  }
}

export const googleSTT = new GoogleSTT();

// Alias para que AvatarDemo no necesite cambios en el import
export const sttService = googleSTT;