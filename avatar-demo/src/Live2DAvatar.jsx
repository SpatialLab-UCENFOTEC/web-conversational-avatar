// src/Live2DAvatar.jsx
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display/cubism4";

const MODEL_URL = "/models/avatar/runtime/wanko_touch.model3.json";

// Parámetros típicos de boca (según modelos)
const MOUTH_PARAM_IDS = ["ParamMouthOpenY", "ParamMouthOpen", "MouthOpenY"];

const Live2DAvatar = forwardRef(function Live2DAvatar(_, ref) {
  const hostRef = useRef(null);
  const appRef = useRef(null);
  const modelRef = useRef(null);

  // ✅ Estado actual y control de boca
  const modeRef = useRef("idle");

  // true = bloquear boca (no abrir) en NO speaking
  const mouthLockRef = useRef(true);

  // qué tan fuerte abrir al hablar
  const mouthBoostRef = useRef(2.2);

  // qué tan cerrada la boca en idle/listening/processing
  // 0.00 = totalmente cerrada, 0.03 = natural, 0.06 = un poquito abierta
  const mouthClampIdleRef = useRef(0.02);

  // (opcional) para suavizar el cambio y que no se vea “cortado”
  const mouthSmoothValueRef = useRef(0);

  useEffect(() => {
    let destroyed = false;

    // ✅ pixi-live2d-display a veces necesita PIXI global
    window.PIXI = PIXI;

    const positionModel = () => {
      const app = appRef.current;
      const model = modelRef.current;
      if (!app || !model) return;

      model.anchor.set(0.5, 0.5);
      model.x = app.renderer.width / 2;
      model.y = app.renderer.height * 0.85;

      // Si tu modelo se ve pequeño/grande, ajusta aquí
      model.scale.set(0.25);
    };

    const setMouthParams = (core, v) => {
      for (const id of MOUTH_PARAM_IDS) {
        try {
          core.setParameterValueById(id, v);
          // no hacemos break a propósito: algunos modelos tienen más de uno activo
        } catch {}
      }
    };

    const forceMouthClosed = () => {
      const model = modelRef.current;
      if (!model) return;

      const core = model.internalModel?.coreModel;
      if (!core) return;

      // ✅ Si no está speaking, mantener boca cerrada (aunque la animación quiera abrir)
      if (mouthLockRef.current) {
        const target = mouthClampIdleRef.current;

        // Suavizado opcional (evita “snap”)
        const current = mouthSmoothValueRef.current;
        const next = current + (target - current) * 0.35; // 0.2–0.5 recomendado
        mouthSmoothValueRef.current = next;

        setMouthParams(core, next);
      }
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

        // ✅ Cada frame: forzar boca cerrada si no speaking
        app.ticker.add(forceMouthClosed);

        // Interacción opcional
        model.interactive = true;
        model.on("pointertap", () => {
          try {
            model.motion("touch_01");
          } catch {}
        });

        const onResize = () => positionModel();
        window.addEventListener("resize", onResize);
        app.__onResize = onResize;

        // Inicia en idle
        try {
          model.motion("idle_01");
        } catch {}
      } catch (err) {
        console.error("❌ Live2D init error:", err);
      }
    };

    init();

    return () => {
      destroyed = true;

      const app = appRef.current;
      if (app?.__onResize) {
        window.removeEventListener("resize", app.__onResize);
      }

      if (app) {
        app.destroy(true, { children: true, texture: true, baseTexture: true });
        appRef.current = null;
      }

      modelRef.current = null;
    };
  }, []);

  useImperativeHandle(ref, () => ({
    setMode(mode) {
      modeRef.current = mode;

      // ✅ Bloquear boca en todo EXCEPTO speaking
      mouthLockRef.current = mode !== "speaking";

      // Cuando cambias de estado, reinicia suavizado
      // (para que no quede en una posición rara)
      if (mouthLockRef.current) {
        mouthSmoothValueRef.current = mouthClampIdleRef.current;
      }

      const model = modelRef.current;
      if (!model) return;

      // motions típicos (ajusta si tus nombres son otros)
      try {
        if (mode === "idle") model.motion("idle_01");
        if (mode === "listening") model.motion("idle_02");
        if (mode === "processing") model.motion("shake_01");
        if (mode === "speaking") model.motion("touch_01"); // si no hay "speak", esto al menos anima
      } catch {}
    },

    // value01 esperado 0..1
    setMouthOpen(value01) {
      const model = modelRef.current;
      if (!model) return;

      const core = model.internalModel?.coreModel;
      if (!core) return;

      // ✅ Si NO está speaking, no permitimos apertura (lo dejamos casi cerrado)
      if (mouthLockRef.current) {
        const v = mouthClampIdleRef.current;
        for (const id of MOUTH_PARAM_IDS) {
          try {
            core.setParameterValueById(id, v);
          } catch {}
        }
        return;
      }

      // ✅ Speaking: amplificar para que se note más
      let v = Math.min(1, Math.max(0, value01 * mouthBoostRef.current));

      for (const id of MOUTH_PARAM_IDS) {
        try {
          core.setParameterValueById(id, v);
        } catch {}
      }
    },

    setExpression(name) {
      const model = modelRef.current;
      if (!model) return;
      try {
        model.expression(name);
      } catch {}
    },

    // ✅ (opcional) por si quieres ajustar valores desde AvatarDemo sin tocar este archivo
    setMouthTuning({ idleClamp, boost } = {}) {
      if (typeof idleClamp === "number") mouthClampIdleRef.current = idleClamp;
      if (typeof boost === "number") mouthBoostRef.current = boost;
    },
  }));

  return <div ref={hostRef} style={{ width: "100%", height: "100%" }} />;
});

export default Live2DAvatar;