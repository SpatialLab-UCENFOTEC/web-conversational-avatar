// src/PasswordGate.jsx
import { useState } from 'react';
import './PasswordGate.css';

const PasswordGate = ({ children }) => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState('');

  // La contraseña se lee SOLO desde la variable de entorno VITE_DEMO_PASSWORD.
  // No hay valor por defecto hardcodeado: si no está configurada, el gate no deja pasar.
  const CORRECT_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || '';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!CORRECT_PASSWORD) {
      setError('El demo no está configurado: falta VITE_DEMO_PASSWORD.');
      return;
    }
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
        
      </div>
    </div>
  );
};

export default PasswordGate;