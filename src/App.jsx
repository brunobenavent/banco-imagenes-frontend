import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Users from './pages/Users';
import UserEdit from './pages/UserEdit';
import Profile from './pages/Profile';
import Navbar from './components/Navbar';
import Goodbye from './components/Goodbye';

function ProtectedRoute({ children, requireEditor = false }) {
  const { isAuthenticated, isEditor, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireEditor && !isEditor) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  const location = useLocation();
  const authRoutes = ['/login', '/register', '/verify', '/forgot-password', '/reset-password'];
  const isAuthPage = authRoutes.includes(location.pathname);
  
  return (
    <>
      <Goodbye />
      {!isAuthPage && <Navbar />}
      <div className={isAuthPage ? '' : 'main-content'}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/upload" element={
            <ProtectedRoute requireEditor>
              <Upload />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="/users/:userId/edit" element={
            <ProtectedRoute>
              <UserEdit />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
