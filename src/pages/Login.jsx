// src/pages/Login.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, Loader2 } from 'lucide-react';
import './Auth.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  const { login, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="auth-page">
        <div className="auth-container">
          <div className="auth-card">
            <div className="auth-loading">
              <Loader2 className="spin" size={40} />
              <p>Verificando sesión...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setStatusMessage('Conectando con el servidor...');

    try {
      setStatusMessage('Verificando credenciales...');
      await login(email, password);
      setStatusMessage('¡Bienvenido! Redirigiendo...');
      navigate('/');
    } catch (err) {
      const message = err.response?.data?.message || 'Error al iniciar sesión';
      // Show the actual error message from backend
      setError(message);
      setStatusMessage('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <video 
                autoPlay 
                muted 
                playsInline 
                className="logo-video"
                src="/intro-video.mp4"
                preload="auto"
                width="150"
                height="150"
              />
            </div>
            <h1>Bienvenido de nuevo</h1>
            <p>Inicia sesión para acceder al catálogo de imágenes</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && <div className="auth-error">{error}</div>}
            
            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                type="email"
                id="email"
                className="input"
                placeholder="tu@correo.viverosguzman.es"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                  className="input"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="spin" size={18} />
                  {statusMessage || 'Iniciando...'}
                </>
              ) : (
                <>
                  Iniciar sesión
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            
            {statusMessage && !error && (
              <div className="auth-status">{statusMessage}</div>
            )}
            
            <div className="auth-links">
              <Link to="/forgot-password" className="auth-link-forgot">
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
          </form>

          <div className="auth-footer">
            <p>¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
