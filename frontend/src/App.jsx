import React from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TenderFormPage from './pages/TenderFormPage';
import TenderDetailsPage from './pages/TenderDetailsPage';
import BidderDashboard from './pages/BidderDashboard';
import ChangePasswordPage from './pages/ChangePasswordPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import { useAuth } from './context/AuthContext';

const App = () => {
  const { user } = useAuth();
  const location = useLocation();

  const homeRedirect =
    user?.role === 'admin' ? <Navigate to="/admin" replace /> : user ? (
      <Navigate to="/bidder" replace />
    ) : (
      <Navigate to="/login" replace />
    );

  return (
    <Layout>
      <Routes>
        <Route path="/" element={homeRedirect} />
        <Route path="/login" element={<LoginWithRedirect />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tenders/new"
          element={
            <ProtectedRoute role="admin">
              <TenderFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/tenders/:id/edit"
          element={
            <ProtectedRoute role="admin">
              <TenderFormPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/bidder"
          element={
            <ProtectedRoute role="bidder">
              <BidderDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tenders/:id"
          element={
            <ProtectedRoute>
              <TenderDetailsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" state={{ from: location.pathname }} replace />} />
      </Routes>
    </Layout>
  );
};

const LoginWithRedirect = () => {
  const location = useLocation();
  const redirectFrom = location.state?.from || location.state?.fromTender || null;
  return <LoginPage redirectTo={redirectFrom} />;
};

export default App;


