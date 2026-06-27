import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Login.css';

const ChangePasswordRequired = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  useEffect(() => {
    // Si l'utilisateur n'est pas connecté ou n'a pas besoin de changer son MDP
    if (!token) {
      navigate('/');
    }
    const mustChange = localStorage.getItem('must_change_password');
    if (mustChange !== 'true') {
      redirectDashboard();
    }
  }, [token]);

  const redirectDashboard = () => {
    if (role === 'superadmin') {
      window.location.href = '/superadmin/dashboard';
    } else if (role === 'admin') {
      window.location.href = '/admin/dashboard';
    } else {
      window.location.href = '/client/dashboard';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/auth/change-password-required', {
        new_password: password
      });
      
      setSuccess(response.data.message || "Mot de passe mis à jour !");
      
      // Mettre à jour localStorage
      localStorage.removeItem('must_change_password');
      
      // Rediriger après 2 secondes
      setTimeout(() => {
        redirectDashboard();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.detail || "Une erreur est survenue lors de la mise à jour.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.png" alt="Logo Le Matin" className="logo-image" />
          
          <p style={{ color: '#ef4444', fontWeight: '600' }}>
            Pour des raisons de sécurité, vous devez modifier votre mot de passe temporaire pour continuer.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Nouveau mot de passe</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
              disabled={loading || !!success}
            />
          </div>

          <div className="input-group">
            <label>Confirmer le nouveau mot de passe</label>
            <input 
              type="password" 
              value={confirmPassword} 
              onChange={(e) => setConfirmPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
              disabled={loading || !!success}
            />
          </div>

          {success && <p style={{ color: '#269d98', textAlign: 'center', marginBottom: '15px', fontWeight: 600 }}>{success} Connexion...</p>}
          {error && <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}

          {!success && (
            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? "Enregistrement..." : "Mettre à jour & Continuer"}
            </button>
          )}
        </form>

        <div className="login-footer" style={{ textAlign: 'center', marginTop: '20px' }}>
          <button 
            onClick={handleLogout} 
            style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '0.9rem', textDecoration: 'underline' }}
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangePasswordRequired;
