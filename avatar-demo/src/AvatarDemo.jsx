import { useState } from 'react';
import Avatar from './Avatar';

const AvatarDemo = () => {
  const [userInput, setUserInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);

  const getMockResponse = (input) => {
  const text = input.toLowerCase();

  if (text.includes('hola')) {
    return 'Hola, estás hablando con el avatar del Cenfotec AI Lab.';
  }

  if (text.includes('cómo estás')) {
    return 'Estoy muy bien, gracias por preguntar. ¿En qué puedo ayudarte?';
  }

  if (text.includes('quién eres')) {
    return 'Soy un agente de inteligencia artificial del Cenfotec AI Lab.';
  }

  return 'Interesante. Cuéntame un poco más.';
};


  const speakText = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);

    speechSynthesis.speak(utterance);
  };

  const handleSubmit = () => {
    const response = getMockResponse(userInput);
    speakText(response);
  };

  return (
    <div>
      <Avatar isSpeaking={isSpeaking} />

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
