// src/Live2DAvatar.jsx
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display";

const MODEL_URL = "/models/avatar/runtime/wanko_touch.model3.json";

const Live2DAvatar = forwardRef(function Live2DAvatar(_, ref) {
  const hostRef = useRef(null);
  const appRef = useRef(null);
  const modelRef = useRef(null);

  useEffect(() => {
    let destroyed = false;

    const positionModel = () => {
      const app = appRef.current;
      const model = modelRef.current;
      if (!app || !model) return;

      model.anchor.set(0.5, 0.5);
      model.x = app.renderer.width / 2;
      model.y = app.renderer.height * 0.85;
      model.scale.set(0.25);
    };

    async function init() {
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

      // opcional: click para probar motion
      model.interactive = true;
      model.on("pointertap", () => {
        try {
          // Wanko suele tener motions touch_01..touch_06
          model.motion("touch_01");
        } catch {
          // si no existe, no pasa nada
        }
      });

      // reposicionar si cambia tamaño
      const onResize = () => positionModel();
      window.addEventListener("resize", onResize);

      // cleanup resize
      appRef.current.__onResize = onResize;
    }

    init();

    return () => {
      destroyed = true;
      const app = appRef.current;

      if (app?.__onResize) {
        window.removeEventListener("resize", app.__onResize);
      }

      if (app) {
        app.destroy(true);
        appRef.current = null;
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    setMode(mode) {
      const model = modelRef.current;
      if (!model) return;

      // ✅ Wanko: motion names típicos
      // idle_01..idle_04 existen en tu captura
      // touch_01..touch_06 existen en tu captura
      try {
        if (mode === "idle") model.motion("idle_01");
        if (mode === "listening") model.motion("idle_02"); // listening = idle alterno
        if (mode === "speaking") model.motion("touch_01"); // speaking = touch para "animarlo"
      } catch {
        // fallback final: no crashear si el motion no existe
      }
    },

    // lip-sync simple por volumen 0..1
    setMouthOpen(value01) {
      const model = modelRef.current;
      if (!model) return;
      try {
        model.internalModel.coreModel.setParameterValueById("ParamMouthOpenY", value01);
      } catch {
        // algunos modelos usan otro param, no crashear
      }
    },

    setExpression(name) {
      const model = modelRef.current;
      if (!model) return;
      try {
        model.expression(name);
      } catch {
        // si no hay expresiones, no pasa nada
      }
    },
  }));

  return <div ref={hostRef} style={{ width: "100%", height: "100%" }} />;
});

export default Live2DAvatar;