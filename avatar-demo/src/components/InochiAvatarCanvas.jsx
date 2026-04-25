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
const REST_MOUTH = 0.02;


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
 const stateRef = useRef({
  mouthOpen: 0,
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
  if (!viewer || !mouthParamRef.current) return;

  try {
    const mouth = clamp(stateRef.current.mouthOpen, 0, 1);
    viewer.set_param(mouthParamRef.current, mouth, 0);
  } catch (e) {
    console.warn("param:", e);
  }
};

  useImperativeHandle(ref, () => ({
    setMode(mode) {
      stateRef.current.mode = mode || "idle";
    },

    setMouthOpen(value) {
      const v = Number(value);

      stateRef.current.mouthOpen = Number.isFinite(v)
  ? clamp(v, 0, 1)
  : 0;},

    closeMouth() {
      stateRef.current.mouthOpen = 0;
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

        resizeCanvas();
        applyCam();

        // Fuerza la boca en reposo al cargar
       stateRef.current.mouthOpen = 0;
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