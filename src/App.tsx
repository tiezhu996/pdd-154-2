import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import { Library } from './pages/Library';
import { AssetDetail } from './pages/AssetDetail';
import { Workspace } from './pages/Workspace';
import { Admin } from './pages/Admin';
import { ShareView } from './pages/ShareView';
import { useAuthStore } from './store/useAuthStore';

const App: React.FC = () => {
  const { loadUser, token, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (token && !isAuthenticated) {
      loadUser();
    }
  }, [token, isAuthenticated, loadUser]);

  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/workspace" replace /> : <Login />
          } />
          <Route path="/register" element={
            isAuthenticated ? <Navigate to="/workspace" replace /> : <Register />
          } />
          <Route path="/share/:token" element={<ShareView />} />
          
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/workspace" replace />} />
            <Route path="workspace" element={<Workspace />} />
            <Route path="library" element={<Library />} />
            <Route path="asset/:id" element={<AssetDetail />} />
            <Route path="admin" element={
              <ProtectedRoute requireAdmin>
                <Admin />
              </ProtectedRoute>
            } />
          </Route>

          <Route path="*" element={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
                <p className="text-xl text-gray-600 mb-2">页面不存在</p>
                <p className="text-gray-500 mb-6">您访问的页面不存在或已被移除</p>
                <button
                  onClick={() => window.location.href = '/'}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  返回首页
                </button>
              </div>
            </div>
          } />
        </Routes>
      </Router>
    </ToastProvider>
  );
};

export default App;
