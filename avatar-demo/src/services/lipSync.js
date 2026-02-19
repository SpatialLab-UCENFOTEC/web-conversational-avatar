// src/services/lipSync.js
export function startLipSyncFromAudioElement(audioEl, onValue) {
  if (!audioEl) return { stop: () => {} };

  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioContext();

  const source = ctx.createMediaElementSource(audioEl);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 2048;

  source.connect(analyser);
  analyser.connect(ctx.destination);

  const data = new Uint8Array(analyser.fftSize);

  let rafId = null;
  let stopped = false;

  const tick = () => {
    if (stopped) return;

    analyser.getByteTimeDomainData(data);

    // volumen RMS aproximado
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      const v = (data[i] - 128) / 128;
      sum += v * v;
    }
    const rms = Math.sqrt(sum / data.length);

    // normalizar a 0..1 (ajusta el multiplicador si lo ves muy bajo/alto)
    const value01 = Math.min(1, rms * 3);

    onValue(value01);
    rafId = requestAnimationFrame(tick);
  };

  // En algunos navegadores el AudioContext inicia "suspendido"
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

// fallback cuando NO hay audio real (speechSynthesis)
export function startFakeLipSync(durationMs, onValue) {
  let rafId = null;
  let stopped = false;
  const start = performance.now();

  const tick = (t) => {
    if (stopped) return;
    const elapsed = t - start;
    const p = Math.min(1, elapsed / durationMs);

    // animación tipo “hablar”: abre/cierra
    const phase = elapsed / 120;
const raw = Math.sin(phase) * Math.sin(phase * 0.7); // cruza por cero
const value01 = Math.max(0, raw) * 0.85 * (1 - p * 0.1);

    onValue(value01);

    if (p >= 1) {
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