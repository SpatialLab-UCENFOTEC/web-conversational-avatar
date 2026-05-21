import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import initInochi, { InochiViewer } from "../pkg/inochi_viewer";

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

let instanceCounter = 0;

// Ajusta este valor si quieres la boca más/menos cerrada en reposo
const REST_MOUTH = 0.8;


const InochiAvatarCanvas = forwardRef(function InochiAvatarCanvas(
  { avatarUrl, className = "", style = {} },
  ref
) {
  const canvasIdRef = useRef(`inochi-canvas-${++instanceCounter}`);
  const canvasId = canvasIdRef.current;

  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const resizeObserverRef = useRef(null);

  const [status, setStatus] = useState("Inicializando avatar...");

  const mouthParamRef = useRef(null);
  const headParamRef = useRef(null);
  const targetHeadRef = useRef({ x: 0, y: 0 });
  const currentHeadRef = useRef({ x: 0, y: 0 });
  const blinkParamRef = useRef(null);
const breathParamRef = useRef(null);

const blinkRef = useRef({
  value: 0,
  nextBlinkAt: performance.now() + 1500,
});

const idleTimeRef = useRef(0);

 const stateRef = useRef({
    mouthOpen: REST_MOUTH,
  mode: "idle",
  });

  // Tus valores actuales de cámara
  const camRef = useRef({
    x: 0,
    y: 1500,
    zoom: 0.18,
    rot: 0,
  });

  const resizeCanvas = () => {
    const container = containerRef.current;
    const canvas = document.getElementById(canvasId);
    const viewer = viewerRef.current;

    if (!container || !canvas) return;

    const w = Math.max(320, container.clientWidth);
    const h = Math.max(420, container.clientHeight);

    canvas.width = w;
    canvas.height = h;
    canvas.style.width = "100%";
    canvas.style.height = "100%";

    if (viewer) {
      try {
        viewer.resize(w, h);
      } catch (e) {
        console.warn("resize:", e);
      }
    }
  };

  const applyCam = () => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const { x, y, zoom, rot } = camRef.current;

    try {
      viewer.set_camera(x, y, zoom, rot);
    } catch (e) {
      console.warn("cam:", e);
    }
  };
const applyParams = () => {
  const viewer = viewerRef.current;
  if (!viewer) return;

  try {
    if (mouthParamRef.current) {
      const mouth = clamp(stateRef.current.mouthOpen, 0, 1);
      viewer.set_param(mouthParamRef.current, mouth, 0);
    }

    if (headParamRef.current) {
  let targetX = targetHeadRef.current.x;
  let targetY = targetHeadRef.current.y;
  // Parpadeo automático
if (blinkParamRef.current) {
  const now = performance.now();

  if (now >= blinkRef.current.nextBlinkAt) {
    blinkRef.current.value = 1;
    blinkRef.current.nextBlinkAt = now + 2200 + Math.random() * 1800;
  }

  blinkRef.current.value += (0 - blinkRef.current.value) * 0.22;

  viewer.set_param(
    blinkParamRef.current,
    clamp(blinkRef.current.value, 0, 1),
    0
  );
}

// Respiración suave / idle
idleTimeRef.current += 0.016;

const idleBreath = 0.5 + Math.sin(idleTimeRef.current * 1.4) * 0.08;

if (breathParamRef.current) {
  viewer.set_param(breathParamRef.current, idleBreath, 0);
}

  // Micro movimiento cuando escucha
  if (stateRef.current.mode === "listening") {
    const t = performance.now() / 1000;
    targetX += Math.sin(t * 1.6) * 0.04;
    targetY += Math.sin(t * 1.2) * 0.02;
  }

  // Suavizado (solo UNA vez)
  currentHeadRef.current.x +=
    (targetX - currentHeadRef.current.x) * 0.1;

  currentHeadRef.current.y +=
    (targetY - currentHeadRef.current.y) * 0.1;

  viewer.set_param(
    headParamRef.current,
    currentHeadRef.current.x,
    currentHeadRef.current.y
  );
}
  } catch (e) {
    console.warn("param:", e);
  }
};

  useImperativeHandle(ref, () => ({
    setMode(mode) {
    stateRef.current.mode = mode || "idle";

    if (mode === "listening") {
  targetHeadRef.current = { x: -0.27, y: 0.06};
  stateRef.current.mouthOpen = 0.65; // abre un poco la boca en modo listening
} else if (mode === "speaking") {
  targetHeadRef.current = { x: 0.08, y: 0.02 };
} else {
  targetHeadRef.current = { x: 0, y: 0 };
  stateRef.current.mouthOpen = REST_MOUTH;
}
  },

    setMouthOpen(value) {
      const v = Number(value);

      stateRef.current.mouthOpen = Number.isFinite(v)
  ? clamp(v, 0, 1)
  : 0;},

    closeMouth() {
      stateRef.current.mouthOpen = REST_MOUTH; 
    },

    setZoom(zoom) {
      camRef.current.zoom = Number(zoom) || 0.18;
      applyCam();
    },

    setCameraY(y) {
      camRef.current.y = Number(y) || 0;
      applyCam();
    },

    resetCamera() {
      camRef.current = {
        x: 0,
        y: 1500,
        zoom: 0.18,
        rot: 0,
      };
      applyCam();
    },
  }));

  useEffect(() => {
    let disposed = false;
    let localAnimFrame = null;

    const loop = (ts) => {
      if (disposed) return;

      const viewer = viewerRef.current;

      if (viewer) {
        applyParams();

        try {
          viewer.render(ts);
        } catch (e) {
          console.warn("render:", e);
        }
      }

      localAnimFrame = requestAnimationFrame(loop);
    };

    const initAvatar = async () => {
      try {
        setStatus("Cargando WASM...");
        await initInochi();

        if (disposed) return;

        const canvas = document.getElementById(canvasId);
        if (!canvas) {
          throw new Error(`Canvas "${canvasId}" no encontrado en el DOM`);
        }

        setStatus(`Cargando modelo: ${avatarUrl}`);

        const response = await fetch(avatarUrl, { cache: "no-store" });

        if (!response.ok) {
          throw new Error(
            `No se pudo cargar el modelo: ${response.status} ${response.statusText}`
          );
        }

        const bytes = new Uint8Array(await response.arrayBuffer());

        if (disposed) return;

        const viewer = new InochiViewer(canvasId, bytes);
        viewerRef.current = viewer;

        let params = [];

        try {
          params = JSON.parse(viewer.get_params_json() || "[]");
          console.log("Parámetros del modelo:", params.map((p) => p.name));
        } catch (e) {
          console.warn("No se pudieron leer parámetros:", e);
        }

        mouthParamRef.current =
          params.find(
            (p) =>
              p.name === "Face::Mouth-Opened" ||
              p.name?.toLowerCase().includes("mouth") ||
              p.name?.toLowerCase().includes("boca")
          )?.name || null;

        console.log("Parámetro de boca detectado:", mouthParamRef.current);


        headParamRef.current =
        params.find((p) => p.name === "Head::Yaw-Pitch")?.name || null;

        console.log("Parámetro de cabeza detectado:", headParamRef.current);
        blinkParamRef.current =
        params.find((p) => p.name === "Eyes::Blink")?.name || null;

        breathParamRef.current =
          params.find((p) =>
            p.name?.toLowerCase().includes("breath") ||
            p.name?.toLowerCase().includes("respira")
          )?.name || null;

        console.log("Parámetro de parpadeo detectado:", blinkParamRef.current);
        console.log("Parámetro de respiración detectado:", breathParamRef.current);

        resizeCanvas();
        applyCam();

        // Fuerza la boca en reposo al cargar
       stateRef.current.mouthOpen = REST_MOUTH; 
applyParams();

        if (containerRef.current) {
          resizeObserverRef.current = new ResizeObserver(() => {
            resizeCanvas();
            applyCam();
          });

          resizeObserverRef.current.observe(containerRef.current);
        }

        localAnimFrame = requestAnimationFrame(loop);
        setStatus("Avatar listo ✅");
      } catch (error) {
        console.error("Error al iniciar Inochi:", error);
        setStatus(`Error: ${error.message}`);
      }
    };

    initAvatar();

    return () => {
      disposed = true;

      if (localAnimFrame) {
        cancelAnimationFrame(localAnimFrame);
        localAnimFrame = null;
      }

      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

      if (viewerRef.current) {
        try {
          viewerRef.current.free?.();
        } catch {}
        viewerRef.current = null;
      }
    };
  }, [avatarUrl, canvasId]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        width: "100%",
        maxWidth: "700px",
        height: "560px",
        minHeight: "560px",
        margin: "0 auto",
        position: "relative",
        overflow: "hidden",
        background: "#0d0d1a",
        borderRadius: "16px",
        ...style,
      }}
    >
      <canvas
        id={canvasId}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 12,
          bottom: 12,
          fontSize: 12,
          color: "#fff",
          background: "rgba(0,0,0,0.45)",
          padding: "6px 10px",
          borderRadius: 8,
        }}
      >
        {status}
      </div>
    </div>
  );
});

export default InochiAvatarCanvas;
export const AVATAR_REST_MOUTH = 0.8; // mismo valor que REST_MOUTH