import React, {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import initInochi, { InochiViewer } from "../pkg/inochi_viewer";

const InochiAvatarCanvas = forwardRef(function InochiAvatarCanvas(
  { avatarUrl, className = "", style = {} },
  ref
) {
  const rawId = useId();
  const canvasId = `inochi-canvas-${rawId.replace(/:/g, "_")}`;

  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const animFrameRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const initializedRef = useRef(false);

  const [status, setStatus] = useState("Inicializando avatar...");
  const [cam, setCam] = useState({
    x: 0,
    y: 0,
    zoom: 1.0,
    rot: 0,
  });
  const [paramsLoaded, setParamsLoaded] = useState([]);

  const paramStateRef = useRef({});
  const paramDefaultsRef = useRef({});

  const resizeCanvas = () => {
    const container = containerRef.current;
    const canvas = document.getElementById(canvasId);
    const viewer = viewerRef.current;

    if (!container || !canvas) return;

    const w = container.clientWidth;
    const h = container.clientHeight;

    if (w <= 0 || h <= 0) return;

    canvas.width = w;
    canvas.height = h;

    if (viewer) {
      try {
        viewer.resize(w, h);
      } catch (error) {
        console.warn("No se pudo redimensionar el viewer:", error);
      }
    }
  };

  const applyCam = (nextCam = cam) => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    try {
      viewer.set_camera(
        Number(nextCam.x),
        Number(nextCam.y),
        Number(nextCam.zoom),
        (Number(nextCam.rot) * Math.PI) / 180
      );
    } catch (error) {
      console.warn("No se pudo aplicar la cámara:", error);
    }
  };

  const loop = (ts) => {
    const viewer = viewerRef.current;

    if (viewer) {
      try {
        for (const [name, val] of Object.entries(paramStateRef.current)) {
          viewer.set_param(name, val.x, val.y);
        }
        viewer.render(ts);
      } catch (error) {
        console.warn("Error en render:", error);
      }
    }

    animFrameRef.current = requestAnimationFrame(loop);
  };

  const resetParams = () => {
    for (const [name, def] of Object.entries(paramDefaultsRef.current)) {
      paramStateRef.current[name] = { x: def.x, y: def.y };
    }
    setParamsLoaded([...paramsLoaded]);
  };

  useImperativeHandle(ref, () => ({
    setMode(mode) {
      const head = paramStateRef.current["Head::Yaw-Pitch"];
      const blink = paramStateRef.current["Eyes::Blink"];

      if (head) {
        if (mode === "listening") {
          head.x = 0;
          head.y = 0.08;
        } else if (mode === "speaking") {
          head.x = 0.04;
          head.y = 0.02;
        } else {
          head.x = 0;
          head.y = 0;
        }
      }

      if (blink && mode === "idle") {
        blink.x = 0;
      }
    },

    setMouthOpen(value) {
      const mouth = paramStateRef.current["Face::Mouth-Opened"];
      if (mouth) {
        mouth.x = Math.max(0, Math.min(1, Number(value) || 0));
      }
    },

    setZoom(zoom) {
      const nextCam = { ...cam, zoom: Number(zoom) || 1 };
      setCam(nextCam);
      applyCam(nextCam);
    },

    resetCamera() {
      const nextCam = { x: 0, y: 0, zoom: 1.0, rot: 0 };
      setCam(nextCam);
      applyCam(nextCam);
    },
  }));

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    let disposed = false;

    const initAvatar = async () => {
      try {
        setStatus("Cargando WASM...");
        await initInochi();

        setStatus(`Cargando modelo: ${avatarUrl}`);
        const response = await fetch(avatarUrl, { cache: "no-store" });

        if (!response.ok) {
          throw new Error(
            `No se pudo cargar el modelo: ${response.status} ${response.statusText}`
          );
        }

        const bytes = new Uint8Array(await response.arrayBuffer());

        if (disposed) return;

        if (animFrameRef.current) {
          cancelAnimationFrame(animFrameRef.current);
          animFrameRef.current = null;
        }

        const viewer = new InochiViewer(canvasId, bytes);
        viewerRef.current = viewer;

        let params = [];
        try {
          params = JSON.parse(viewer.get_params_json() || "[]");
        } catch (error) {
          console.warn("No se pudieron leer parámetros:", error);
        }

        for (const key of Object.keys(paramStateRef.current)) {
          delete paramStateRef.current[key];
        }
        for (const key of Object.keys(paramDefaultsRef.current)) {
          delete paramDefaultsRef.current[key];
        }

        for (const param of params) {
          const { name, def_x, def_y } = param;
          paramDefaultsRef.current[name] = { x: def_x, y: def_y };
          paramStateRef.current[name] = { x: def_x, y: def_y };
        }

        setParamsLoaded(params);

        applyCam({ x: 0, y: 0, zoom: 1.0, rot: 0 });
        resizeCanvas();

        if (containerRef.current) {
          resizeObserverRef.current = new ResizeObserver(() => {
            resizeCanvas();
          });
          resizeObserverRef.current.observe(containerRef.current);
        }

        animFrameRef.current = requestAnimationFrame(loop);
        setStatus("Avatar listo");
      } catch (error) {
        console.error("Error al iniciar Inochi:", error);
        setStatus(`Error: ${error.message}`);
      }
    };

    initAvatar();

    return () => {
      disposed = true;

      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }

      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }

      if (viewerRef.current) {
        try {
          viewerRef.current.free?.();
        } catch (error) {
          console.warn("No se pudo liberar el viewer:", error);
        }
        viewerRef.current = null;
      }
    };
  }, [avatarUrl, canvasId]);

  const updateCam = (field, value) => {
    const nextCam = { ...cam, [field]: Number(value) };
    setCam(nextCam);
    applyCam(nextCam);
  };

  const updateParam = (name, axis, value) => {
    if (!paramStateRef.current[name]) return;
    paramStateRef.current[name][axis] = Number(value);
    setParamsLoaded([...paramsLoaded]);
  };

  return (
    <div
      className={className}
      style={{
        display: "flex",
        gap: "16px",
        width: "100%",
        alignItems: "flex-start",
        ...style,
      }}
    >
      <div
        ref={containerRef}
        style={{
          flex: "1 1 auto",
          minWidth: 0,
          height: "560px",
          position: "relative",
          overflow: "hidden",
          background: "#0d0d1a",
          borderRadius: "16px",
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

      <div
        style={{
          width: "260px",
          minWidth: "260px",
          background: "#1b1b1b",
          borderRadius: "16px",
          padding: "14px",
          color: "#fff",
        }}
      >
        <h3 style={{ marginTop: 0 }}>Cámara</h3>

        <label style={{ display: "block", marginBottom: 10 }}>
          X: {cam.x}
          <input
            type="range"
            min="-2000"
            max="2000"
            step="1"
            value={cam.x}
            onChange={(e) => updateCam("x", e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 10 }}>
          Y: {cam.y}
          <input
            type="range"
            min="-2000"
            max="2000"
            step="1"
            value={cam.y}
            onChange={(e) => updateCam("y", e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 10 }}>
          Zoom: {cam.zoom.toFixed(2)}
          <input
            type="range"
            min="0.05"
            max="8"
            step="0.01"
            value={cam.zoom}
            onChange={(e) => updateCam("zoom", e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <label style={{ display: "block", marginBottom: 10 }}>
          Rot: {cam.rot}°
          <input
            type="range"
            min="-180"
            max="180"
            step="1"
            value={cam.rot}
            onChange={(e) => updateCam("rot", e.target.value)}
            style={{ width: "100%" }}
          />
        </label>

        <button onClick={() => {
          const nextCam = { x: 0, y: 0, zoom: 1.0, rot: 0 };
          setCam(nextCam);
          applyCam(nextCam);
        }}>
          Resetear cámara
        </button>

        <h3 style={{ marginTop: 18 }}>Parámetros</h3>

        <button onClick={resetParams} style={{ marginBottom: 12 }}>
          Resetear parámetros
        </button>

        <div style={{ maxHeight: 260, overflow: "auto" }}>
          {paramsLoaded.map((param) => (
            <div key={param.name} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 13, marginBottom: 4 }}>{param.name}</div>

              <label style={{ display: "block" }}>
                X: {Number(paramStateRef.current[param.name]?.x ?? param.def_x).toFixed(2)}
                <input
                  type="range"
                  min={param.min_x}
                  max={param.max_x}
                  step={(param.max_x - param.min_x) / 200 || 0.01}
                  value={paramStateRef.current[param.name]?.x ?? param.def_x}
                  onChange={(e) => updateParam(param.name, "x", e.target.value)}
                  style={{ width: "100%" }}
                />
              </label>

              {param.is_vec2 && (
                <label style={{ display: "block" }}>
                  Y: {Number(paramStateRef.current[param.name]?.y ?? param.def_y).toFixed(2)}
                  <input
                    type="range"
                    min={param.min_y}
                    max={param.max_y}
                    step={(param.max_y - param.min_y) / 200 || 0.01}
                    value={paramStateRef.current[param.name]?.y ?? param.def_y}
                    onChange={(e) => updateParam(param.name, "y", e.target.value)}
                    style={{ width: "100%" }}
                  />
                </label>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default InochiAvatarCanvas;