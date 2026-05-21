// src/App.jsx
import AvatarDemo from "./AvatarDemo.jsx";
import PasswordGate from './PasswordGate';
import './App.css'

function App() {
  return (
    <PasswordGate>
      <div className="app-container">
        <main className="app-main">
          <AvatarDemo />
        </main>
        
        <footer className="app-footer">
          <div className="footer-content">
            <p>
              <strong>Powered by:</strong> Google Cloud Text-to-Speech • 
              <strong> Desarrollado por:</strong> Cenfotec Spatial Lab •
              <strong> Uso:</strong> Presiona Enter para enviar mensajes
            </p>
            <p className="footer-note">
              Este proyecto usa Google Cloud TTS y STT para síntesis y reconocimiento de voz.
            </p>
          </div>
        </footer>
      </div>
    </PasswordGate>  
  );
}

export default App;