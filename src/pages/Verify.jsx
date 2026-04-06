// frontend/src/pages/Verify.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import './Auth.css';

export default function Verify() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email'); // Email passed from verification link
  
  const [status, setStatus] = useState('loading'); // loading, success, error
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificación no proporcionado.');
      return;
    }
    
    const verifyEmail = async () => {
      try {
        // Pass email as query param to check if already verified
        const url = email 
          ? `/api/auth/verify/${token}?email=${encodeURIComponent(email)}`
          : `/api/auth/verify/${token}`;
        const response = await axios.get(url);
        setStatus('success');
        setMessage(response.data.message);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.message || 'Error al verificar el correo.');
      }
    };
    
    verifyEmail();
  }, [token, email]);
  
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
            <h1>Verificación de correo</h1>
          </div>
          
          <div className="verify-content">
            {status === 'loading' && (
              <div className="verify-loading">
                <Loader className="spinner" size={40} />
                <p>Verificando tu correo electrónico...</p>
              </div>
            )}
            
            {status === 'success' && (
              <div className="verify-success">
                <CheckCircle size={64} className="verify-icon success" />
                <p className="verify-message">{message}</p>
                <Link to="/login" className="btn btn-primary">
                  Iniciar sesión
                </Link>
              </div>
            )}
            
            {status === 'error' && (
              <div className="verify-error">
                <XCircle size={64} className="verify-icon error" />
                <p className="verify-message">{message}</p>
                <p className="verify-help">
                  Por favor, contacta al administrador si el problema persiste.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
