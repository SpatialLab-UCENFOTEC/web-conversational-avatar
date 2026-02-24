// src/Live2DAvatar.jsx
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display/cubism4";

const MODEL_URL = "/models/avatar/runtime/wanko_touch.model3.json";
const MOUTH_PARAM = "PARAM_MOUTH_OPEN_Y";

const Live2DAvatar = forwardRef(function Live2DAvatar(_, ref) {
  const hostRef = useRef(null);
  const appRef = useRef(null);
  const modelRef = useRef(null);
  const isSpeakingRef = useRef(false);
  const mouthValueRef = useRef(0);
  const mouthIndexRef = useRef(-1); // índice del parámetro en el array WASM

  useEffect(() => {
    let destroyed = false;
    window.PIXI = PIXI;

    const positionModel = () => {
      const app = appRef.current;
      const model = modelRef.current;
      if (!app || !model) return;
      model.anchor.set(0.5, 0.5);
      model.x = app.renderer.width / 2;
      model.y = app.renderer.height / 2;
      model.scale.set(0.5);
    };

    const init = async () => {
      try {
        if (!hostRef.current) return;

        const app = new PIXI.Application({
          resizeTo: hostRef.current,
          backgroundAlpha: 0,
          antialias: true,
        });
        appRef.current = app;
        hostRef.current.appendChild(app.view);

        const model = await Live2DModel.from(MODEL_URL);
        if (destroyed) return;

        modelRef.current = model;
        app.stage.addChild(model);
        positionModel();

        // ── Encontrar el índice del parámetro de boca ─────────────────────────
        // Necesitamos el índice para escribir directamente en el Float32Array del WASM
        try {
          const core = model.internalModel?.coreModel;
          const paramCount = core?.getParameterCount?.();
          for (let i = 0; i < (paramCount || 0); i++) {
            if (core.getParameterId(i) === MOUTH_PARAM) {
              mouthIndexRef.current = i;
              console.log(`✅ PARAM_MOUTH_OPEN_Y encontrado en índice ${i}`);
              break;
            }
          }
        } catch (e) {
          console.warn("No se pudo encontrar índice de boca:", e);
        }

        // ── Parchear el pipeline de pixi-live2d-display ───────────────────────
        // InternalModel.updateParameters() es el método que aplica los valores
        // de las motions al coreModel. Lo envolvemos para interceptar al final.
        try {
          const internal = model.internalModel;

          // Encontrar el método que aplica parámetros - varía por versión
          const methodsToTry = ['updateParameters', 'update', 'motionUpdate'];
          for (const methodName of methodsToTry) {
            if (typeof internal[methodName] === 'function') {
              const original = internal[methodName].bind(internal);
              internal[methodName] = function(...args) {
                const result = original(...args);
                applyMouthControl();
                return result;
              };
              console.log(`✅ Parchado: internalModel.${methodName}`);
            }
          }
        } catch (e) {
          console.warn("Patch falló:", e);
        }

        // ── Función central que controla la boca ──────────────────────────────
        const applyMouthControl = () => {
          const core = modelRef.current?.internalModel?.coreModel;
          if (!core) return;
          const value = isSpeakingRef.current ? mouthValueRef.current : 0;

          // Intento 1: API pública Cubism4
          try { core.setParameterValueById(MOUTH_PARAM, value); } catch {}

          // Intento 2: por índice directo (más rápido y más confiable)
          const idx = mouthIndexRef.current;
          if (idx >= 0) {
            try { core.setParameterValueByIndex(idx, value); } catch {}
          }

          // Intento 3: acceso directo al Float32Array del WASM
          try {
            // pixi-live2d-display expone esto en algunas versiones
            const wasmModel = core._model || core.model;
            if (wasmModel?.parameters) {
              const vals = wasmModel.parameters.values;
              if (idx >= 0 && vals) {
                // Float32Array del heap de WASM
                vals.set(idx, value);
              }
            }
          } catch {}
        };

        // ── Ticker como red de seguridad adicional ────────────────────────────
        app.ticker.add(applyMouthControl, null, PIXI.UPDATE_PRIORITY.LOW);

        model.interactive = true;
        model.on("pointertap", () => {
          try { model.motion("Idle"); } catch {}
        });

        const onResize = () => positionModel();
        window.addEventListener("resize", onResize);
        app.__onResize = onResize;

        try { model.motion("Idle"); } catch {}

      } catch (err) {
        console.error("❌ Live2D init error:", err);
      }
    };

    init();

    return () => {
      destroyed = true;
      const app = appRef.current;
      if (app?.__onResize) window.removeEventListener("resize", app.__onResize);
      if (app) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        appRef.current = null;
      }
      modelRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    setMode(mode) {
      if (mode === "speaking") {
        isSpeakingRef.current = true;
      } else {
        isSpeakingRef.current = false;
        mouthValueRef.current = 0;
      }
      try { modelRef.current?.motion("Idle"); } catch {}
    },
    setMouthOpen(value01) {
      mouthValueRef.current = Math.max(0, Math.min(1, value01));
    },
    setExpression(name) {
      try { modelRef.current?.expression(name); } catch {}
    },
  }));

  return <div ref={hostRef} style={{ width: "100%", height: "100%" }} />;
});

export default Live2DAvatar;