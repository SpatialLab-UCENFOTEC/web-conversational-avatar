
// src/App.jsx
import AvatarDemo from "./AvatarDemo.jsx";
import './App.css'

function App() {
  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">
          🤖 Avatar Conversacional del Cenfotec AI Lab
        </h1>
        <p className="app-subtitle">
         Somos lo que sabemos
        </p>
        <div className="app-badge">
          <span className="badge free">100% GRATIS</span>
          <span className="badge unlimited">SIN LÍMITES</span>
          <span className="badge no-api">NO API KEYS</span>
        </div>
      </header>
      
      <main className="app-main">
        <AvatarDemo />
      </main>
      
      <footer className="app-footer">
        <div className="footer-content">
          <p>
            <strong>Powered by:</strong> Puter.js Text-to-Speech API • 
            <strong> Desarrollado por:</strong> Cenfotec AI Lab •
            <strong> Uso:</strong> Presiona Enter para enviar mensajes
          </p>
          <p className="footer-note">
            Este proyecto usa Puter.js, un servicio gratuito de síntesis de voz 
            sin restricciones de uso ni necesidad de API keys.
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App