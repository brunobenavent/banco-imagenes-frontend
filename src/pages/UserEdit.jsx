// frontend/src/pages/UserEdit.jsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Save, Loader, AlertCircle, Shield, User, Trash2, Camera } from 'lucide-react';
import './UserEdit.css';

export default function UserEdit() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [user, setUser] = useState(null);
  const [isEditingSelf, setIsEditingSelf] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  
  const [formData, setFormData] = useState({
    nombre: '',
    role: 'employee',
    isActive: true,
    foto: ''
  });

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/users');
      const foundUser = response.data.users.find(u => u._id === userId);
      if (foundUser) {
        setUser(foundUser);
        setIsEditingSelf(currentUser?.id === userId);
        setFormData({
          nombre: foundUser.nombre,
          role: foundUser.role,
          isActive: foundUser.isActive !== false,
          foto: foundUser.foto || ''
        });
      } else {
        setError('Usuario no encontrado');
      }
    } catch (err) {
      setError('Error al cargar usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      // Prevent editing yourself
      if (isEditingSelf) {
        setError('No puedes modificar tu propia cuenta');
        setSaving(false);
        return;
      }

      // Save role separately if changed
      if (user.role !== formData.role) {
        await axios.put(`/api/auth/users/${userId}/role`, { role: formData.role });
      }

      // Save other fields
      await axios.put(`/api/auth/users/${userId}`, {
        nombre: formData.nombre,
        isActive: formData.isActive
      });
      
      setSuccess('Cambios guardados correctamente');
      
      // Redirect to users page after short delay
      setTimeout(() => {
        navigate('/users');
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const handleRoleChange = async (newRole) => {
    // Prevent users from changing their own role
    if (isEditingSelf) {
      setError('No puedes cambiar tu propio rol');
      return;
    }
    
    try {
      const response = await axios.put(`/api/auth/users/${userId}/role`, { role: newRole });
      setUser(response.data.user);
      setFormData({ ...formData, role: newRole });
      setSuccess('Rol actualizado correctamente');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cambiar rol');
    }
  };

  const handleDelete = async () => {
    if (!deletePassword) {
      setError('Debes introducir tu contraseña');
      return;
    }
    
    setDeleting(true);
    setError(null);

    try {
      // Verify admin password first
      await axios.post('/api/auth/verify-password', { password: deletePassword });
      
      // If password verified, delete user
      await axios.delete(`/api/auth/users/${userId}`);
      navigate('/users');
    } catch (err) {
      setError(err.response?.data?.message || 'Error al eliminar usuario. Contraseña incorrecta.');
    } finally {
      setDeleting(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen');
      return;
    }

    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no puede superar 2MB');
      return;
    }

    setSaving(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (event) => {
        const base64 = event.target.result;
        
        // Save to user
        await axios.put(`/api/auth/users/${userId}`, { foto: base64 });
        setFormData({ ...formData, foto: base64 });
        setSuccess('Foto actualizada correctamente');
        setSaving(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setError('Error al subir la foto');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="user-edit-page">
        <div className="user-edit-loading">
          <Loader className="spinner" size={32} />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="user-edit-page">
        <div className="user-edit-error">
          <AlertCircle size={32} />
          <h3>Usuario no encontrado</h3>
          <Link to="/users" className="btn btn-primary">Volver a usuarios</Link>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (!user.isVerified) {
      return <span className="status-badge pending">Sin verificar</span>;
    }
    if (user.isActive === false) {
      return <span className="status-badge inactive">Inactivo</span>;
    }
    return <span className="status-badge active">Activo</span>;
  };

  // If editing yourself, only show photo and read-only info - no role change allowed
  if (isEditingSelf) {
    return (
      <div className="user-edit-page">
        <div className="user-edit-container">
          <Link to="/users" className="back-link">
            <ArrowLeft size={18} />
            Volver a usuarios
          </Link>

          <div className="user-edit-card">
            <div className="user-edit-header">
              <div className="user-avatar-large">
                {formData.foto ? (
                  <img src={formData.foto} alt={user.nombre} />
                ) : (
                  <User size={40} />
                )}
                <label className="avatar-upload">
                  <Camera size={18} />
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handlePhotoChange}
                    disabled={saving}
                  />
                </label>
              </div>
              <div>
                <h1>{user.nombre}</h1>
                <p className="user-email">{user.email}</p>
              </div>
            </div>

            {error && (
              <div className="user-edit-message error">
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            {success && (
              <div className="user-edit-message success">
                {success}
              </div>
            )}

            <form onSubmit={handleSubmit} className="user-edit-form">
              <div className="form-section">
                <h3>Información</h3>
                
                <div className="info-row">
                  <span className="info-label">Nombre</span>
                  <span className="info-value">{user.nombre}</span>
                </div>
                
                <div className="info-row">
                  <span className="info-label">Email</span>
                  <span className="info-value">{user.email}</span>
                </div>
                
                <div className="info-row">
                  <span className="info-label">Rol</span>
                  <span className={`info-value role-badge ${user.role}`}>
                    {user.role === 'admin' ? 'Administrador' : user.role === 'editor' ? 'Editor' : 'Empleado'}
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-edit-page">
      <div className="user-edit-container">
        <Link to="/users" className="back-link">
          <ArrowLeft size={18} />
          Volver a usuarios
        </Link>

        <div className="user-edit-card">
          <div className="user-edit-header">
            <div className="user-avatar-large">
              {formData.foto ? (
                <img src={formData.foto} alt={user.nombre} />
              ) : (
                <User size={40} />
              )}
            </div>
            <div>
              <h1>{user.nombre}</h1>
              <p className="user-email">{user.email}</p>
            </div>
          </div>

          {error && (
            <div className="user-edit-message error">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

          {success && (
            <div className="user-edit-message success">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="user-edit-form">
            <div className="form-section">
              <h3>Información básica</h3>
              
              <div className="form-group">
                <label>Nombre</label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label>Estado</label>
                <div className="status-display">
                  {getStatusBadge()}
                </div>
              </div>

              {!isEditingSelf && (
                <div className="form-group">
                  <label>Estado de cuenta</label>
                  <div className="toggle-group">
                    <button
                      type="button"
                      className={`toggle-btn ${formData.isActive ? 'active' : ''}`}
                      onClick={() => setFormData({ ...formData, isActive: true })}
                    >
                      <Shield size={16} />
                      Activo
                    </button>
                    <button
                      type="button"
                      className={`toggle-btn ${!formData.isActive ? 'inactive' : ''}`}
                      onClick={() => setFormData({ ...formData, isActive: false })}
                    >
                      <Shield size={16} />
                      Inactivo
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="form-section">
              <h3>Rol</h3>
              <p className="section-description">El rol determina los permisos del usuario en la aplicación.</p>
              
              <div className="role-options">
                <label className={`role-option ${formData.role === 'employee' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="employee"
                    checked={formData.role === 'employee'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                  <div className="role-content">
                    <span className="role-name">Empleado</span>
                    <span className="role-desc">Puede ver el catálogo de imágenes</span>
                  </div>
                </label>

                <label className={`role-option ${formData.role === 'editor' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="editor"
                    checked={formData.role === 'editor'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                  <div className="role-content">
                    <span className="role-name">Editor</span>
                    <span className="role-desc">Puede subir y eliminar imágenes</span>
                  </div>
                </label>

                <label className={`role-option ${formData.role === 'admin' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="admin"
                    checked={formData.role === 'admin'}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  />
                  <div className="role-content">
                    <span className="role-name">Administrador</span>
                    <span className="role-desc">Acceso completo a la gestión</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? <Loader className="spinner" size={18} /> : <Save size={18} />}
                Guardar cambios
              </button>
              
              {user.role !== 'admin' && (
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => setShowDeleteModal(true)}
                >
                  <Trash2 size={18} />
                  Eliminar usuario
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="delete-modal-overlay" onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setError(null); }}>
            <div className="delete-modal-content" onClick={e => e.stopPropagation()}>
              <div className="delete-modal-icon">
                <Trash2 size={32} />
              </div>
              <h3>¿Eliminar usuario?</h3>
              <p>¿Estás seguro de que quieres eliminar al usuario <strong>{user.nombre}</strong>?</p>
              
              <div className="delete-modal-password">
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Introduce tu contraseña"
                  autoComplete="off"
                />
              </div>
              
              {error && (
                <p className="delete-modal-error" style={{ color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{error}</p>
              )}
              
              <div className="delete-modal-actions">
                <button className="btn btn-ghost" onClick={() => { setShowDeleteModal(false); setDeletePassword(''); setError(null); }}>Cancelar</button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={deleting}>Eliminar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
