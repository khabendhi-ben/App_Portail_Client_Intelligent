import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './Login';
import ForgotPassword from './ForgotPassword';
import './App.css';

const Dashboard = ({ title }) => (
  <div style={{ padding: '20px' }}>
    <h1>{title}</h1>
    <p>Bienvenue dans votre espace sécurisé.</p>
    <button onClick={() => { localStorage.clear(); window.location.href = '/'; }}>Déconnexion</button>
  </div>
);

function App() {
  
  // LOGIQUE DE DÉCONNEXION AUTOMATIQUE (US-006)
  useEffect(() => {
    let timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      // 30 minutes = 30 * 60 * 1000 millisecondes
      timeout = setTimeout(() => {
        if (localStorage.getItem('token')) {
          alert("Votre session a expiré pour cause d'inactivité.");
          localStorage.clear();
          window.location.href = '/';
        }
      }, 30 * 60 * 1000); 
    };

    // Écouter les événements utilisateur
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keypress', resetTimer);
    window.addEventListener('click', resetTimer);

    resetTimer(); // Initialiser le timer au chargement

    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keypress', resetTimer);
      window.removeEventListener('click', resetTimer);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/superadmin/dashboard" element={<Dashboard title="Espace SuperAdmin" />} />
          <Route path="/admin/dashboard" element={<Dashboard title="Espace Administrateur" />} />
          <Route path="/client/dashboard" element={<Dashboard title="Espace Client" />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
