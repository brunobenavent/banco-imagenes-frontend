import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hand } from 'lucide-react';
import './Goodbye.css';

export default function Goodbye() {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Check for goodbye state in sessionStorage (set by Navbar before redirect)
    const goodbyeData = sessionStorage.getItem('goodbye');
    if (goodbyeData) {
      try {
        const { name: userName } = JSON.parse(goodbyeData);
        setName(userName || 'usuario');
        setVisible(true);
        sessionStorage.removeItem('goodbye');
        
        // Redirect after animation
        setTimeout(() => {
          setVisible(false);
          // Only navigate if not already on login
          if (window.location.pathname !== '/login') {
            navigate('/login', { replace: true });
          }
        }, 2500);
      } catch (e) {
        console.error('Error parsing goodbye data:', e);
      }
    }
  }, [navigate]);

  if (!visible) return null;

  return (
    <div className="goodbye-modal-overlay">
      <div className="goodbye-modal-content">
        <div className="goodbye-modal-icon">
          <Hand size={48} />
        </div>
        <h2 className="goodbye-title">¡Hasta pronto!</h2>
        <p className="goodbye-message">Gracias por usar Banco de Imágenes, {name}</p>
      </div>
    </div>
  );
}
