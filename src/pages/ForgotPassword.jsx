// frontend/src/pages/ForgotPassword.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { Loader, ArrowLeft, Loader2 } from 'lucide-react';
import './Auth.css';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  
  const { isAuthenticated, loading: authLoading } = useAuth();
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
      await axios.post('/api/auth/forgot-password', { email });
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al enviar el correo');
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
              />
            </div>
            <h1>Olvidé mi contraseña</h1>
          </div>
          
          {!submitted ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <p className="auth-subtitle">
                Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              
              {error && <div className="auth-error">{error}</div>}
              
              <div className="form-group">
                <label htmlFor="email">Correo electrónico</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@email.com"
                  required
                  autoFocus
                />
              </div>
              
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? <Loader className="spinner" size={18} /> : 'Enviar enlace'}
              </button>
              
              <div className="auth-links">
                <Link to="/login" className="auth-link">
                  <ArrowLeft size={16} /> Volver a iniciar sesión
                </Link>
              </div>
            </form>
          ) : (
            <div className="auth-success">
              <p>Si el correo existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña.</p>
              <p>Por favor, revisa tu bandeja de entrada (y spam).</p>
              <Link to="/login" className="btn btn-primary btn-block">
                Volver a iniciar sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
