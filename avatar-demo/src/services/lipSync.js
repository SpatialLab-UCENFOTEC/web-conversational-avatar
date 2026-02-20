// src/services/lipSync.js

const clamp01 = (v) => Math.max(0, Math.min(1, v));

export function startLipSyncFromAudioElement(audioEl, onValue, options = {}) {
  if (!audioEl) return { stop: () => {} };

  const {
    gain = 4.0,
    smooth = 0.25,
    minOpen = 0.0,
  } = options;

  const AudioContextCtor = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextCtor) return { stop: () => onValue?.(0) };

  const ctx = new AudioContextCtor();

  let source = null;
  let analyser = null;
  let rafId = null;
  let stopped = false;
  let prev = 0;

  const stopInternal = () => {
    if (stopped) return;
    stopped = true;

    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;

    try { onValue?.(0); } catch {}

    try { audioEl.removeEventListener("ended", stopInternal); } catch {}
    try { audioEl.removeEventListener("error", stopInternal); } catch {}

    try { source?.disconnect(); } catch {}
    try { analyser?.disconnect(); } catch {}

    try {
      if (ctx && ctx.state !== "closed") ctx.close();
    } catch {}
  };

  try {
    source = ctx.createMediaElementSource(audioEl);
    analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;

    source.connect(analyser);
    analyser.connect(ctx.destination);

    const data = new Uint8Array(analyser.fftSize);

    audioEl.addEventListener("ended", stopInternal);
    audioEl.addEventListener("error", stopInternal);

    const tick = () => {
      if (stopped) return;

      analyser.getByteTimeDomainData(data);

      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length);

      let value01 = clamp01(rms * gain);
      value01 = Math.max(minOpen, value01);

      value01 = prev + (value01 - prev) * clamp01(smooth);
      prev = value01;

      try { onValue(value01); } catch {}

      rafId = requestAnimationFrame(tick);
    };

    (async () => {
      try {
        if (ctx.state === "suspended") await ctx.resume();
      } catch {}
      tick();
    })();

  } catch (e) {
    console.warn("LipSync real no pudo iniciar:", e?.message || e);
    stopInternal();
    return { stop: () => {} };
  }

  return { stop: stopInternal };
}

// Fake (indefinido) -> se detiene SOLO cuando tú llamas stop()
export function startFakeLipSync(onValue, options = {}) {
  const {
    speedHz = 8,
    minOpen = 0.08,
    maxOpen = 1.0,
    pauses = true,
    pauseChance = 0.12,
  } = options;

  let rafId = null;
  let stopped = false;
  let t0 = performance.now();

  let inPause = false;
  let pauseUntil = 0;

  const tick = (now) => {
    if (stopped) return;

    const elapsed = (now - t0) / 1000;

    if (pauses) {
      if (!inPause && Math.random() < pauseChance) {
        inPause = true;
        pauseUntil = now + 80 + Math.random() * 120;
      }
      if (inPause) {
        if (now < pauseUntil) {
          onValue(0);
          rafId = requestAnimationFrame(tick);
          return;
        } else {
          inPause = false;
        }
      }
    }

    const raw01 = Math.pow(Math.sin(elapsed * Math.PI * speedHz), 2);
    const value01 = Math.max(0, Math.min(1, minOpen + raw01 * (maxOpen - minOpen)));

    onValue(value01);
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