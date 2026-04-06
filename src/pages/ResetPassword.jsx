// frontend/src/pages/ResetPassword.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader, CheckCircle } from 'lucide-react';
import './Auth.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await axios.post(`/api/auth/reset-password/${token}`, { password });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!token || !email) {
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
                  loop
                  className="logo-video"
                  src="/intro-video.mp4"
                  preload="auto"
                />
              </div>
              <h1>Enlace inválido</h1>
            </div>
            
            <div className="auth-error">
              El enlace de restablecimiento es inválido o ha expirado.
            </div>
            
            <Link to="/forgot-password" className="btn btn-primary btn-block">
              Solicitar nuevo enlace
            </Link>
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
            <h1>Nueva contraseña</h1>
          </div>
          
          {!success ? (
            <form onSubmit={handleSubmit} className="auth-form">
              <p className="auth-subtitle">
                Ingresa tu nueva contraseña para <strong>{email}</strong>
              </p>
              
              {error && <div className="auth-error">{error}</div>}
              
              <div className="form-group">
                <label htmlFor="password">Nueva contraseña</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  autoFocus
                  minLength={6}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirmar contraseña</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite tu contraseña"
                  required
                  minLength={6}
                />
              </div>
              
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? <Loader className="spinner" size={18} /> : 'Cambiar contraseña'}
              </button>
              
              <div className="auth-links">
                <Link to="/login">Volver a iniciar sesión</Link>
              </div>
            </form>
          ) : (
            <div className="auth-success">
              <CheckCircle size={64} className="verify-icon success" />
              <p>Tu contraseña ha sido restablecida correctamente.</p>
              <Link to="/login" className="btn btn-primary btn-block">
                Iniciar sesión
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
