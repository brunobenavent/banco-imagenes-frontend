// src/pages/Users.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { AlertCircle, Loader, Edit, User } from 'lucide-react';
import './Users.css';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user: currentUser, isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  // Role order for sorting
  const roleOrder = { admin: 0, editor: 1, employee: 2 };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/auth/users');
      // Sort users: admins first, then editors, then employees
      const sortedUsers = response.data.users.sort((a, b) => {
        return (roleOrder[a.role] ?? 3) - (roleOrder[b.role] ?? 3);
      });
      setUsers(sortedUsers);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (user) => {
    if (!user.isVerified) {
      return <span className="status-badge pending">Sin verificar</span>;
    }
    if (user.isActive === false) {
      return <span className="status-badge inactive">Inactivo</span>;
    }
    return <span className="status-badge active">Activo</span>;
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="role-badge admin">Admin</span>;
      case 'editor':
        return <span className="role-badge editor">Editor</span>;
      default:
        return <span className="role-badge employee">Empleado</span>;
    }
  };

  if (!isAdmin) {
    return (
      <div className="users-page">
        <div className="users-error">
          <AlertCircle size={24} />
          <h3>Acceso denegado</h3>
          <p>No tienes permisos para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="users-header">
        <h1>Usuarios</h1>
        <p>Gestiona los usuarios y sus permisos</p>
      </div>

      {error && (
        <div className="users-message error">
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {loading ? (
        <div className="users-loading">
          <Loader className="spinner" size={32} />
        </div>
      ) : (
        <div className="users-list">
          {users.map(user => (
            <div key={user._id} className={`user-card ${user.isActive === false ? 'user-inactive' : ''} ${user.role === 'admin' ? 'user-admin' : ''}`}>
              <div className="user-card-main">
                <div className="user-avatar">
                  {user.foto ? (
                    <img src={user.foto} alt={user.nombre} />
                  ) : (
                    <User size={20} />
                  )}
                </div>
                <div className="user-info">
                  <div className="user-name">
                    <span>{user.nombre}</span>
                    {user._id === currentUser?.id && (
                      <span className="you-badge">Tú</span>
                    )}
                  </div>
                  <div className="user-email">{user.email}</div>
                </div>
              </div>
              
              <div className="user-card-status">
                {getStatusBadge(user)}
                {getRoleBadge(user.role)}
              </div>
              
              <div className="user-card-actions">
                {user._id !== currentUser?.id && (
                  <Link
                    to={`/users/${user._id}/edit`}
                    className="btn btn-primary btn-sm"
                    title="Editar usuario"
                  >
                    <Edit size={14} />
                    Editar
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
