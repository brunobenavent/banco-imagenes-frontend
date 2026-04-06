// src/pages/Profile.jsx
import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import { User, Camera, Save, Lock, Loader, X, ZoomIn, ZoomOut, RotateCcw, Move, Trash2 } from 'lucide-react';
import './Profile.css';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  // Image cropper state
  const [imageModal, setImageModal] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isDragging = useRef(false);
  const lastPosition = useRef({ x: 0, y: 0 });

  // Pre-fill from user context while loading
  const [formData, setFormData] = useState({
    nombre: user?.nombre || '',
    foto: user?.foto || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [previewImage, setPreviewImage] = useState(user?.foto || null);
  const [previewTransform, setPreviewTransform] = useState(() => {
    // Load saved transform from localStorage (user-specific key)
    const currentUserId = user?.id;
    const saved = currentUserId ? localStorage.getItem(`avatarTransform_${currentUserId}`) : null;
    return saved ? JSON.parse(saved) : { zoom: 1, x: 0, y: 0 };
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  // Save transform to localStorage only after user explicitly saves (user-specific key)
  const saveTransformToStorage = (transform) => {
    const currentUserId = user?.id;
    if (currentUserId) {
      localStorage.setItem(`avatarTransform_${currentUserId}`, JSON.stringify(transform));
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/auth/profile');
      const userData = response.data.user;
      console.log('Profile loaded:', userData);
      setFormData({
        nombre: userData.nombre || '',
        foto: userData.foto || ''
      });
      setPreviewImage(userData.foto || null);
    } catch (error) {
      console.error('Error fetching profile:', error.response?.status, error.response?.data || error.message);
      addToast('Error al cargar el perfil: ' + (error.response?.data?.message || error.message), 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      addToast('Por favor selecciona una imagen', 'error');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      addToast('La imagen debe ser menor a 2MB', 'error');
      return;
    }

    // Create preview and open modal for adjustment
    const reader = new FileReader();
    reader.onloadend = () => {
      setImageModal(reader.result);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsNewImage(true); // Track that this is a new image
    };
    reader.readAsDataURL(file);
    
    // Reset input
    e.target.value = '';
  };

  // Open modal with existing image for editing
  const handleEditImage = () => {
    if (previewImage) {
      setImageModal(previewImage);
      setZoom(1);
      setPosition({ x: 0, y: 0 });
      setIsNewImage(false); // Track that this is an existing image
    }
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleZoomReset = () => { setZoom(1); setPosition({ x: 0, y: 0 }); };

  const handleMouseDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
    lastPosition.current = { x: e.clientX, y: e.clientY };
    // Set cursor explicitly during drag
    e.currentTarget.style.cursor = 'grabbing';
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    
    const deltaX = e.clientX - lastPosition.current.x;
    const deltaY = e.clientY - lastPosition.current.y;
    
    setPosition(prev => ({
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }));
    
    lastPosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = (e) => {
    isDragging.current = false;
    // Reset cursor after drag
    if (e.currentTarget) {
      e.currentTarget.style.cursor = 'grab';
    }
  };

  // Track if modal was opened from change (new image) or edit (existing)
  const [isNewImage, setIsNewImage] = useState(false);

  // Save just the original image and the transform settings
  const handleImageApply = async () => {
    const newTransform = { zoom, x: position.x, y: position.y };
    setPreviewImage(imageModal);
    setPreviewTransform(newTransform);
    setFormData(prev => ({ ...prev, foto: imageModal }));
    // Save with user-specific key
    if (user?.id) {
      localStorage.setItem(`avatarTransform_${user.id}`, JSON.stringify(newTransform));
    }
    setImageModal(null);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setIsNewImage(false);
  };

  const handleImageCancel = () => {
    // If user cancelled after selecting a new image, keep the old one
    setImageModal(null);
    setZoom(1);
    setPosition({ x: 0, y: 0 });
    setIsNewImage(false);
  };

  // Handle wheel zoom on modal image
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await axios.put('/api/auth/profile', {
        nombre: formData.nombre,
        foto: formData.foto,
        fotoTransform: previewTransform
      });

      addToast('Perfil actualizado correctamente', 'success');
      
      // Clear transform from localStorage if image was deleted
      if (window.__clearAvatarTransform && user?.id) {
        localStorage.removeItem(`avatarTransform_${user.id}`);
        window.__clearAvatarTransform = false;
      }
      
      // Update auth context
      if (updateUser) {
        updateUser({ nombre: formData.nombre, foto: formData.foto });
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Error al guardar el perfil';
      addToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      addToast('Las contraseñas no coinciden', 'error');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      addToast('La contraseña debe tener al menos 6 caracteres', 'error');
      return;
    }

    setSavingPassword(true);

    try {
      await axios.put('/api/auth/profile/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });

      addToast('Contraseña actualizada correctamente', 'success');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      const message = error.response?.data?.message || 'Error al cambiar la contraseña';
      addToast(message, 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <Loader className="spinner" size={32} />
        <p>Cargando perfil...</p>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Mi Perfil</h1>
        <p>Actualiza tu información personal</p>
      </div>

      <div className="profile-content">
        {/* Left column: Profile Form */}
        <div className="profile-section profile-info">
          <div className="section-header">
            <User size={20} />
            <h2>Información Personal</h2>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="avatar-section">
              <div className="avatar-preview">
                {previewImage ? (
                  <img 
                    src={previewImage} 
                    alt="Foto de perfil" 
                    style={{
                      transform: `scale(${previewTransform.zoom}) translate(${previewTransform.x}px, ${previewTransform.y}px)`
                    }}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    <User size={48} />
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                id="avatar-input"
                accept="image/*"
                onChange={handleImageSelect}
                hidden
              />
              <div className="avatar-actions">
                {previewImage ? (
                  <>
                    <button 
                      type="button" 
                      className="avatar-action-btn" 
                      onClick={() => fileInputRef.current?.click()}
                      title="Cambiar imagen"
                    >
                      <Camera size={18} />
                      <span>Cambiar</span>
                    </button>
                    <button 
                      type="button" 
                      className="avatar-action-btn" 
                      onClick={handleEditImage}
                      title="Ajustar imagen"
                    >
                      <Move size={18} />
                      <span>Ajustar</span>
                    </button>
                    <button 
                      type="button" 
                      className="avatar-action-btn delete" 
                      onClick={() => {
                        setPreviewImage(null);
                        setPreviewTransform({ zoom: 1, x: 0, y: 0 });
                        setFormData(prev => ({ ...prev, foto: '' }));
                        // Mark to clear localStorage on save
                        window.__clearAvatarTransform = true;
                      }}
                      title="Eliminar imagen"
                    >
                      <Trash2 size={18} />
                      <span>Eliminar</span>
                    </button>
                  </>
                ) : (
                  <button 
                    type="button" 
                    className="avatar-action-btn primary" 
                    onClick={() => fileInputRef.current?.click()}
                    title="Subir imagen"
                  >
                    <Camera size={18} />
                    <span>Subir foto</span>
                  </button>
                )}
              </div>
              <p className="avatar-hint">
                {previewImage ? '' : 'Selecciona una imagen para tu perfil'}
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="nombre">Nombre</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                placeholder="Tu nombre"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="input-disabled"
              />
              <span className="input-hint">El email no se puede modificar</span>
            </div>

            <div className="form-group">
              <label>Rol</label>
              <input
                type="text"
                value={user?.role === 'admin' ? 'Administrador' : user?.role === 'editor' ? 'Editor' : 'Empleado'}
                disabled
                className="input-disabled"
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? (
                <>
                  <Loader className="spinner" size={18} />
                  Guardando...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Guardar cambios
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right column: Password Form */}
        <div className="profile-section profile-password">
          <div className="section-header">
            <Lock size={20} />
            <h2>Cambiar Contraseña</h2>
          </div>

          <form onSubmit={handlePasswordSubmit} className="password-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Contraseña actual</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Ingresa tu contraseña actual"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">Nueva contraseña</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Mínimo 6 caracteres"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar contraseña</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Repite la nueva contraseña"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" disabled={savingPassword}>
              {savingPassword ? (
                <>
                  <Loader className="spinner" size={18} />
                  Cambiando...
                </>
              ) : (
                <>
                  <Lock size={18} />
                  Cambiar contraseña
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Image Crop/Zoom Modal */}
      {imageModal && (
        <div className="image-modal-overlay" onClick={handleImageCancel}>
          <div className="image-modal-content" onClick={e => e.stopPropagation()}>
            <div className="image-modal-header">
              <h3>Ajustar imagen</h3>
              <button className="image-modal-close" onClick={handleImageCancel}>
                <X size={24} />
              </button>
            </div>
            
            <div className="image-modal-body">
              <div 
                className="image-modal-mask"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <div className="image-modal-viewport">
                  <img 
                    src={imageModal} 
                    alt="Preview" 
                    style={{ 
                      transform: `scale(${zoom}) translate(${position.x}px, ${position.y}px)` 
                    }}
                    className="image-modal-preview"
                    draggable={false}
                  />
                </div>
                <div className="image-modal-circle-hint"></div>
              </div>
              <p className="image-modal-hint">
                <Move size={14} /> Arrastra para posicionar • Rueda para zoom
              </p>
            </div>
            
            <div className="image-modal-controls">
              <button className="zoom-btn" onClick={handleZoomOut} title="Zoom out">
                <ZoomOut size={20} />
              </button>
              <span className="zoom-level">{Math.round(zoom * 100)}%</span>
              <button className="zoom-btn" onClick={handleZoomIn} title="Zoom in">
                <ZoomIn size={20} />
              </button>
              <button className="zoom-btn" onClick={handleZoomReset} title="Reset">
                <RotateCcw size={20} />
              </button>
            </div>
            
            <div className="image-modal-actions">
              <button className="btn btn-ghost" onClick={handleImageCancel}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={handleImageApply}>
                Aplicar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}