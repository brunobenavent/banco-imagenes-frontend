// src/components/Navbar.jsx
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, Upload, Users, Grid, User, Settings } from 'lucide-react';
import './Navbar.css';

export default function Navbar() {
  const { user, isAuthenticated, isEditor, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    const userName = user?.nombre || 'usuario';
    // Save goodbye state to sessionStorage before redirecting
    sessionStorage.setItem('goodbye', JSON.stringify({ name: userName }));
    logout();
    navigate('/login');
  };

  // Don't show navbar on auth pages
  const authPages = ['/login', '/register', '/verify', '/forgot-password', '/reset-password'];
  if (authPages.includes(location.pathname)) {
    return null;
  }
  
  // Only show navbar to authenticated users
  if (!isAuthenticated) {
    return null;
  }

  // Helper to get avatar transform
  const getAvatarTransform = () => {
    if (!user?.id) return {};
    try {
      const saved = localStorage.getItem(`avatarTransform_${user.id}`);
      const t = saved ? JSON.parse(saved) : {};
      return t;
    } catch {
      return {};
    }
  };

  const avatarTransform = getAvatarTransform();

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <div className="navbar-left">
            <Link to="/" className="navbar-logo">
              <span className="logo-text">Banco</span>
              <span className="logo-highlight">Imágenes</span>
            </Link>
            
            <div className="navbar-links">
              <Link to="/" className={`navbar-link ${location.pathname === '/' ? 'active' : ''}`}>
                <Grid size={18} />
                Catálogo
              </Link>
              
              {isEditor && (
                <Link to="/upload" className={`navbar-link ${location.pathname === '/upload' ? 'active' : ''}`}>
                  <Upload size={18} />
                  Subir
                </Link>
              )}
              
              {isAdmin && (
                <Link to="/users" className={`navbar-link ${location.pathname === '/users' ? 'active' : ''}`}>
                  <Users size={18} />
                  Usuarios
                </Link>
              )}
              
              <Link to="/profile" className={`navbar-link ${location.pathname === '/profile' ? 'active' : ''}`}>
                <User size={18} />
                Perfil
              </Link>
            </div>
          </div>

          {isAuthenticated && (
            <div className="navbar-user">
              <Link to="/profile" className="navbar-user-info">
                {user?.foto ? (
                  <img src={user.foto} alt={user.nombre} className="navbar-user-avatar" />
                ) : (
                  <User size={16} />
                )}
                <span className="navbar-user-name">{user?.nombre}</span>
                <span className="navbar-user-role">{user?.role}</span>
              </Link>
              <button onClick={() => setShowLogoutConfirm(true)} className="navbar-logout" title="Cerrar sesión">
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="logout-modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
          <div className="logout-modal-content" onClick={e => e.stopPropagation()}>
            <div className="logout-modal-icon">
              <LogOut size={32} />
            </div>
            <h3>¿Cerrar sesión?</h3>
            <p>¿Estás seguro de que quieres salir de la aplicación?</p>
            <div className="logout-modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowLogoutConfirm(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={handleLogout}>Salir</button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom navigation */}
      {isAuthenticated && (
        <nav className="mobile-nav">
          <Link to="/" className={`mobile-nav-item ${location.pathname === '/' ? 'active' : ''}`}>
            <Grid size={22} />
            <span>Catálogo</span>
          </Link>
          
          {isEditor && (
            <Link to="/upload" className={`mobile-nav-item ${location.pathname === '/upload' ? 'active' : ''}`}>
              <Upload size={22} />
              <span>Subir</span>
            </Link>
          )}
          
          {/* Profile dropdown for mobile */}
          <div className="mobile-profile-dropdown">
            <button className="mobile-profile-btn">
              {user?.foto ? (
                <img src={user.foto} alt={user.nombre} className="mobile-profile-avatar" />
              ) : (
                <div className="mobile-profile-avatar mobile-profile-avatar-placeholder">
                  <User size={20} />
                </div>
              )}
            </button>
            <div className="mobile-dropdown-menu">
              <Link to="/profile" className="mobile-dropdown-item">
                <User size={18} />
                <span>Ver perfil</span>
              </Link>
              <button onClick={() => setShowLogoutConfirm(true)} className="mobile-dropdown-item">
                <LogOut size={18} />
                <span>Cerrar sesión</span>
              </button>
            </div>
          </div>
          
          {isAdmin && (
            <Link to="/users" className={`mobile-nav-item ${location.pathname === '/users' ? 'active' : ''}`}>
              <Users size={22} />
              <span>Usuarios</span>
            </Link>
          )}
        </nav>
      )}
    </>
  );
}