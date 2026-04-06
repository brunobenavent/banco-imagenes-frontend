// src/pages/Register.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, ArrowRight, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import './Auth.css';

export default function Register() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);
  
  const { register, isAuthenticated, loading: authLoading } = useAuth();
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

    try {
      await register(email, password, nombre);
      // After registration, show message instead of redirecting
      setRegistered(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  if (registered) {
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
                />
              </div>
              <h1>Registro completado</h1>
              <p>Revisa tu correo para verificar tu cuenta</p>
            </div>
            
            <div className="register-success">
              <CheckCircle size={64} className="success-icon" />
              <p>Hemos enviado un correo de verificación a <strong>{email}</strong></p>
              <p className="help-text">
                Haz clic en el enlace del correo para verificar tu cuenta. 
                El enlace expirará en 24 horas.
              </p>
              <div className="auth-footer">
                <p>¿Ya verificaste tu cuenta? <Link to="/login">Inicia sesión</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              />
            </div>
            <h1>Crear cuenta</h1>
            <p>Regístrate con tu correo de Viveros Guzmán</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="auth-error">
                <AlertCircle size={16} />
                {error}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="nombre">Nombre completo</label>
              <div className="input-wrapper">
                <User className="input-icon" size={18} />
                <input
                  type="text"
                  id="nombre"
                  className="input"
                  placeholder="Juan García"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={18} />
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
              <span className="input-hint">Solo se permiten correos @viverosguzman.es</span>
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
                minLength={6}
              />
            </div>

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? 'Creando cuenta...' : 'Crear cuenta'}
              <ArrowRight size={18} />
            </button>
          </form>

          <div className="auth-footer">
            <p>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}
