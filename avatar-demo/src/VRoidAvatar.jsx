// src/VRoidAvatar.jsx
import React, { useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";

// ⬇️ Cambia este path al nombre de tu archivo .vrm
const VRM_URL = "/models/avatar/AvatarMujer.vrm";

const VRoidAvatar = forwardRef(function VRoidAvatar(_, ref) {
  const mountRef = useRef(null);
  const rendererRef = useRef(null);
  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const vrmRef = useRef(null);
  const clockRef = useRef(new THREE.Clock());
  const isSpeakingRef = useRef(false);
  const mouthValueRef = useRef(0);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    // ── Escena ────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // ── Cámara ────────────────────────────────────────────────────────────────
    const camera = new THREE.PerspectiveCamera(
      30,
      mount.clientWidth / mount.clientHeight,
      0.1,
      20
    );
    camera.position.set(0, 1.4, 2.5); // apunta al torso/cara
    cameraRef.current = camera;

    // ── Renderer ──────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mount.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // ── Luces ─────────────────────────────────────────────────────────────────
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(1, 2, 2);
    scene.add(dirLight);
    scene.add(new THREE.AmbientLight(0xffffff, 0.6));

    // ── Cargar VRM ────────────────────────────────────────────────────────────
    const loader = new GLTFLoader();
    loader.register((parser) => new VRMLoaderPlugin(parser));

    loader.load(
      VRM_URL,
      (gltf) => {
        const vrm = gltf.userData.vrm;
        VRMUtils.removeUnnecessaryVertices(gltf.scene);
        VRMUtils.combineSkeletons(gltf.scene);

        vrm.scene.rotation.y = 0;
        scene.add(vrm.scene);
        vrmRef.current = vrm;
        console.log("✅ VRM cargado correctamente");
      },
      (progress) => {
        console.log(`Cargando VRM: ${((progress.loaded / progress.total) * 100).toFixed(1)}%`);
      },
      (error) => {
        console.error("❌ Error cargando VRM:", error);
      }
    );

    // ── Loop de animación ─────────────────────────────────────────────────────
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);
      const delta = clockRef.current.getDelta();
      const vrm = vrmRef.current;

      if (vrm) {
        // Control de boca
        const mouthValue = isSpeakingRef.current ? mouthValueRef.current : 0;
        try {
          // VRM 1.0 usa expressionManager
          vrm.expressionManager?.setValue("aa", mouthValue);
        } catch {}
        try {
          // VRM 0.x usa blendShapeProxy
          vrm.blendShapeProxy?.setValue("A", mouthValue);
        } catch {}

        vrm.update(delta);
      }

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      if (!mount) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", onResize);

    // ── Cleanup ───────────────────────────────────────────────────────────────
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      if (mount.contains(renderer.domElement)) {
        mount.removeChild(renderer.domElement);
      }
      vrmRef.current = null;
    };
  }, []);

  // ── API pública (misma interfaz que Live2DAvatar) ─────────────────────────
  useImperativeHandle(ref, () => ({
    setMode(mode) {
      isSpeakingRef.current = mode === "speaking";
      if (mode !== "speaking") {
        mouthValueRef.current = 0;
      }
    },
    setMouthOpen(value01) {
      mouthValueRef.current = Math.max(0, Math.min(1, value01));
    },
    setExpression(name) {
      const vrm = vrmRef.current;
      if (!vrm) return;
      try {
        vrm.expressionManager?.setValue(name, 1); // VRM 1.0
      } catch {}
      try {
        vrm.blendShapeProxy?.setValue(name, 1); // VRM 0.x
      } catch {}
    },
  }));

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height: "100%", background: "transparent" }}
    />
  );
});

export default VRoidAvatar;
