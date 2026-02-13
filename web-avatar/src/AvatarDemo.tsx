import { useState, useEffect, useRef } from "react";
import * as PIXI from "pixi.js";
import { Live2DModel } from "pixi-live2d-display";
import "pixi-live2d-display/cubism4";


const AvatarDemo = () => {
  const [userInput, setUserInput] = useState("");
  const [isSpeaking, setIsSpeaking] = useState(false);

  const modelRef = useRef<any>(null);
  const appRef = useRef<PIXI.Application | null>(null);

  const getMockResponse = (input: string) => {
    const text = input.toLowerCase();
    if (text.includes("hola"))
      return "Hola, estás hablando con el avatar del Cenfotec AI Lab.";
    if (text.includes("cómo estás"))
      return "Estoy muy bien, gracias por preguntar. ¿En qué puedo ayudarte?";
    if (text.includes("quién eres"))
      return "Soy un agente de inteligencia artificial del Cenfotec AI Lab.";
    return "Interesante. Cuéntame un poco más.";
  };

  const speakText = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  };

  const handleSubmit = () => {
    const response = getMockResponse(userInput);
    speakText(response);
  };

  useEffect(() => {
    const init = async () => {
      try {
        const app = new PIXI.Application({
          width: 400,
          height: 600,
          backgroundAlpha: 0,
        });

        appRef.current = app;

        const container = document.getElementById("live2d-container");
        container?.appendChild(app.view as HTMLCanvasElement);

       const model = (await Live2DModel.from(
          "/models/Hiyori.model3.json"
        )) as any;

        model.scale.set(0.3);
        model.x = 200;
        model.y = 500;

        app.stage.addChild(model);

        modelRef.current = model;
      } catch (error) {
        console.error("Error cargando modelo:", error);
      }
    };

    init();

    return () => {
      appRef.current?.destroy(true, true);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (modelRef.current?.internalModel?.coreModel) {
        modelRef.current.internalModel.coreModel.setParameterValueById(
          "ParamMouthOpenY",
          isSpeaking ? Math.random() : 0
        );
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <div style={{ textAlign: "center" }}>
      <div id="live2d-container"></div>

      <h2>Demo del Avatar</h2>

      <input
        type="text"
        value={userInput}
        onChange={(e) => setUserInput(e.target.value)}
        placeholder="Escribe algo..."
      />

      <button onClick={handleSubmit}>Enviar</button>
    </div>
  );
};

export default AvatarDemo;
