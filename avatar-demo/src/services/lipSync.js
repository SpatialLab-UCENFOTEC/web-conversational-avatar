// src/services/lipSync.js

/**
 * Lip sync real usando AudioContext + AnalyserNode.
 * Úsalo cuando tengas un elemento <audio> real (caso Puter TTS).
 */
export function startLipSyncFromAudioElement(audioEl, onValue) {
  if (!audioEl) return { stop: () => {} };

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContext();

  const source = ctx.createMediaElementSource(audioEl);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;

  source.connect(analyser);
  analyser.connect(ctx.destination);

  const data = new Uint8Array(analyser.fftSize);
  let rafId = null;
  let stopped = false;

  const tick = () => {
    if (stopped) return;
    analyser.getByteTimeDomainData(data);

    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);
    const value01 = Math.min(1, rms * 4); // ajusta el multiplicador si necesitas

    onValue(value01);
    rafId = requestAnimationFrame(tick);
  };

  ctx.resume().then(() => tick()).catch(() => tick());

  return {
    stop() {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
      try {
        onValue(0);
        source.disconnect();
        analyser.disconnect();
        ctx.close();
      } catch {}
    },
  };
}

/**
 * Lip sync FALSO para Web Speech API (no da acceso al audio real).
 * Oscila entre 0 y 1 de forma natural, con pausas reales entre sílabas.
 */
export function startFakeLipSync(durationMs, onValue) {
  let rafId = null;
  let stopped = false;
  const start = performance.now();

  const tick = (now) => {
    if (stopped) return;

    const elapsed = now - start;
    const progress = Math.min(1, elapsed / durationMs);

    // ✅ Oscila entre 0 y 1 cruzando cero (simula sílabas)
    // sin²(t) va de 0 a 1 y vuelve a 0 → forma natural de boca
    const syllableSpeed = 8; // Hz aprox
    const raw = Math.pow(Math.sin((elapsed / 1000) * Math.PI * syllableSpeed), 2);

    // Fade out suave al final
    const fadeOut = 1 - Math.pow(progress, 3);
    const value01 = raw * fadeOut;

    onValue(value01);

    if (progress >= 1) {
      onValue(0);
      return;
    }

    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);

  return {
    stop() {
      stopped = true;
      if (rafId) cancelAnimationFrame(rafId);
      onValue(0);
    },
  };
}