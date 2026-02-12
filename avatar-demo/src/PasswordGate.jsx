// src/PasswordGate.jsx
import { useState } from 'react';
import './PasswordGate.css';

const PasswordGate = ({ children }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  // Leer contraseña desde variable de entorno o usar valor por defecto
  const CORRECT_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || 'cenfotec2025';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setIsAuthenticated(true);
      setError('');
    } else {
      setError('Contraseña incorrecta');
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <div className="password-gate">
      <div className="password-card">
        <h1>Acceso restringido</h1>
        <p>Este demo es privado. Ingresa la contraseña para continuar.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
          <button type="submit">Entrar</button>
          {error && <p className="error">{error}</p>}
        </form>
        <p className="hint">
          * Contraseña por defecto: <strong>cenfotec2025</strong>
          <br />
          <small>(se puede cambiar en variables de entorno)</small>
        </p>
      </div>
    </div>
  );
};

export default PasswordGate;