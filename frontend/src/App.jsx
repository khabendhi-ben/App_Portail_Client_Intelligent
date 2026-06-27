import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from "./pages/login/Login";
import ForgotPassword from "./pages/login/ForgotPassword";
import ResetPassword from "./pages/login/ResetPassword";
import ChangePasswordRequired from "./pages/login/ChangePasswordRequired";

import './App.css';

import DashboardLayout from './components/layout/DashboardLayout';
import SuperAdminDashboard from './pages/SuperAdmin/SuperAdminDashboard';
import SuperAdminProfil from './pages/SuperAdmin/SuperAdminProfil';
import SuperAdminGestionAdmins from './pages/SuperAdmin/SuperAdminGestionAdmins';
import SuperAdminGestionClients from './pages/SuperAdmin/SuperAdminGestionClients';

import AdminDashboard from './pages/Admin/AdminDashboard';
import AdminGestionClients from './pages/Admin/AdminGestionClients';
import AdminProfil from './pages/Admin/AdminProfil';

import ProtectedRoute from "./components/ProtectedRoute";

import AdminMonitoringIA from "./pages/Admin/AdminMonitoringIA";
import Statistiques from "./pages/SuperAdmin/Statistiques";

import ClientDashboard from './pages/Client/ClientDashboard';
import ClientAnnouncements from './pages/Client/ClientAnnouncements';
import ClientProfil from './pages/Client/ClientProfil';
import ClientReclamations from './pages/Client/ClientReclamations';
import AdminReclamations from './pages/Admin/AdminReclamations';
import ClientAssistant from './pages/Client/ClientAssistant';

function App() {
  const [showWarnModal, setShowWarnModal] = useState(false);
  const [countdown, setCountdown] = useState(60);

  const warnTimeoutRef = useRef(null);
  const logoutTimeoutRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const logoutUser = () => {
    clearTimeout(warnTimeoutRef.current);
    clearTimeout(logoutTimeoutRef.current);
    clearInterval(countdownIntervalRef.current);
    
    localStorage.setItem('session_expired', 'true');
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('must_change_password');
    
    setShowWarnModal(false);
    window.location.href = '/';
  };

  const handleKeepAlive = () => {
    setShowWarnModal(false);
    resetTimer();
  };

  const resetTimer = () => {
    clearTimeout(warnTimeoutRef.current);
    clearTimeout(logoutTimeoutRef.current);
    clearInterval(countdownIntervalRef.current);

    if (!localStorage.getItem('token')) return;

    // Temps d'expiration : 30 minutes (1800000ms). Avertissement à 29 minutes (1740000ms).
    const totalTime = 30 * 60 * 1000;
    const warnTime = 29 * 60 * 1000;

    warnTimeoutRef.current = setTimeout(() => {
      setShowWarnModal(true);
      setCountdown(60);
      
      let currentCountdown = 60;
      countdownIntervalRef.current = setInterval(() => {
        currentCountdown -= 1;
        setCountdown(currentCountdown);
        if (currentCountdown <= 0) {
          clearInterval(countdownIntervalRef.current);
          logoutUser();
        }
      }, 1000);
    }, warnTime);

    logoutTimeoutRef.current = setTimeout(() => {
      logoutUser();
    }, totalTime);
  };

  useEffect(() => {
    const handleActivity = () => {
      if (showWarnModal) return;
      resetTimer();
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('click', handleActivity);

    resetTimer();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('click', handleActivity);
      clearTimeout(warnTimeoutRef.current);
      clearTimeout(logoutTimeoutRef.current);
      clearInterval(countdownIntervalRef.current);
    };
  }, [showWarnModal]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/change-password-required" element={<ChangePasswordRequired />} />

        {/* ═══ Espace SuperAdmin ═══ */}
        <Route path="/superadmin" element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="profil" element={<SuperAdminProfil />} />
          <Route path="gestion-admins" element={<SuperAdminGestionAdmins />} />
          <Route path="gestion-clients" element={<SuperAdminGestionClients />} />
          <Route path="statistiques" element={<Statistiques />} />
        </Route>

        {/* ═══ Espace Admin ═══ */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="gestion-clients" element={<AdminGestionClients />} />
          <Route path="reclamations" element={<AdminReclamations />} />
          <Route path="monitoring-ia" element={<AdminMonitoringIA />} />
          <Route path="profil" element={<AdminProfil />} />
        </Route>

{/* ═══ Espace Client ═══ */}
<Route path="/client" element={
  <ProtectedRoute allowedRoles={['client']}>
    <DashboardLayout />
  </ProtectedRoute>
}>
  <Route index element={<Navigate to="dashboard" replace />} />
  <Route path="dashboard" element={<ClientDashboard />} />
  <Route path="announcements" element={<ClientAnnouncements />} />
  <Route path="reclamations" element={<ClientReclamations />} />
  <Route path="profil" element={<ClientProfil />} />
  <Route path="assistant" element={<ClientAssistant />} /> {/* AJOUTER CETTE LIGNE */}
</Route>

        {/* Redirection fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {showWarnModal && (
        <div className="session-timeout-overlay">
          <div className="session-timeout-modal">
            <div className="session-timeout-header">
              <h3>Session bientôt expirée</h3>
            </div>
            <div className="session-timeout-body">
              <p>
                Vous êtes inactif depuis un moment. Vous serez déconnecté automatiquement dans :
              </p>
              <div className="session-timeout-countdown">
                <span>{countdown}</span> secondes
              </div>
            </div>
            <div className="session-timeout-footer">
              <button className="session-btn-logout" onClick={logoutUser}>
                Se déconnecter
              </button>
              <button className="session-btn-keep" onClick={handleKeepAlive}>
                Rester connecté
              </button>
            </div>
          </div>
        </div>
      )}
    </Router>
  );
}

export default App;
