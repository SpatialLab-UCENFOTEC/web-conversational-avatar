// src/App.jsx
import AvatarDemo from "./AvatarDemo.jsx";
import PasswordGate from './PasswordGate';  // importar el componente
import './App.css'

function App() {
  return (
    <PasswordGate>   {/* ENVUELVE EL CONTENIDO EN EL COMPONENTE PasswordGate */}
      <div className="app-container">
        <main className="app-main">
          <AvatarDemo />
        </main>
        
        <footer className="app-footer">
          <div className="footer-content">
            <p>
              <strong>Powered by:</strong> Puter.js Text-to-Speech API • 
              <strong> Desarrollado por:</strong> Cenfotec Spatial Lab •
              <strong> Uso:</strong> Presiona Enter para enviar mensajes
            </p>
            <p className="footer-note">
              Este proyecto usa Puter.js, un servicio gratuito de síntesis de voz 
              sin restricciones de uso ni necesidad de API keys.
            </p>
          </div>
        </footer>
      </div>
    </PasswordGate>  
  );
}

export default App;