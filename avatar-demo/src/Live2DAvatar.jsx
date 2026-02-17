// src/Live2DAvatar.jsx
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display/cubism4";

const MODEL_URL = "/models/avatar/runtime/wanko_touch.model3.json";

const Live2DAvatar = forwardRef(function Live2DAvatar(_, ref) {
  const hostRef = useRef(null);
  const appRef = useRef(null);
  const modelRef = useRef(null);

  useEffect(() => {
    let destroyed = false;

    // ✅ Bug 3: pixi-live2d-display a veces necesita PIXI global
    window.PIXI = PIXI;

    const positionModel = () => {
      const app = appRef.current;
      const model = modelRef.current;
      if (!app || !model) return;

      model.anchor.set(0.5, 0.5);
      model.x = app.renderer.width / 2;
      model.y = app.renderer.height * 0.85;
      model.scale.set(0.25);
    };

    const init = async () => {
      try {
        if (!hostRef.current) return;

        // 1) Crear app Pixi
        const app = new PIXI.Application({
          resizeTo: hostRef.current,
          backgroundAlpha: 0,
          antialias: true,
        });

        appRef.current = app;
        hostRef.current.appendChild(app.view);

        // ✅ Bug 1 + 2: NO await top-level, y MODEL_URL definido
        const model = await Live2DModel.from(MODEL_URL);

        if (destroyed) return;

        modelRef.current = model;
        app.stage.addChild(model);

        positionModel();

        // Interacción opcional
        model.interactive = true;
        model.on("pointertap", () => {
          try {
            model.motion("touch_01");
          } catch {
            // no-op
          }
        });

        // Reposicionar al cambiar tamaño
        const onResize = () => positionModel();
        window.addEventListener("resize", onResize);
        app.__onResize = onResize;

        // Inicia en idle
        try {
          model.motion("idle_01");
        } catch {
          // no-op
        }
      } catch (err) {
        console.error("❌ Live2D init error:", err);
      }
    };

    init();

    return () => {
      destroyed = true;

      // limpiar listener resize
      const app = appRef.current;
      if (app?.__onResize) {
        window.removeEventListener("resize", app.__onResize);
      }

      // destruir pixi app
      if (app) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        appRef.current = null;
      }

      modelRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    setMode(mode) {
      const model = modelRef.current;
      if (!model) return;

      // Wanko típico: idle_01..idle_04, touch_01..touch_06
      try {
        if (mode === "idle") model.motion("idle_01");
        if (mode === "listening") model.motion("idle_02");
        if (mode === "speaking") model.motion("touch_01");
        if (mode === "processing") model.motion("shake_01"); // si existe
      } catch {
        // fallback silencioso
      }
    },

    setMouthOpen(value01) {
      const model = modelRef.current;
      if (!model) return;

      try {
        model.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", value01);
      } catch {
        // si el modelo no tiene ese param, no crashear
      }
    },

    setExpression(name) {
      const model = modelRef.current;
      if (!model) return;

      try {
        model.expression(name);
      } catch {
        // no-op
      }
    },
  }));

  return <div ref={hostRef} style={{ width: "100%", height: "100%" }} />;
});

export default Live2DAvatar;