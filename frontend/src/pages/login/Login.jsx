import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionExpiredMsg, setSessionExpiredMsg] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('session_expired') === 'true') {
      setSessionExpiredMsg(true);
      localStorage.removeItem('session_expired');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // On utilise 'api' au lieu de 'axios', l'URL de base est déjà configurée !
      // Attention : on a changé la route backend en /auth/login
      const response = await api.post('/auth/login', {
        email: email,
        password: password
      });

      const token = response.data.access_token;
      const role = response.data.role; // On récupère le rôle
      const mustChange = response.data.must_change_password;
      
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      
      console.log(`Connexion réussie ! Rôle: ${role}`);
      
      if (mustChange) {
        localStorage.setItem('must_change_password', 'true');
        window.location.href = '/change-password-required';
      } else {
        localStorage.removeItem('must_change_password');
        // Redirection selon le rôle (US-004)
        if (role === 'superadmin') {
          window.location.href = '/superadmin/dashboard';
        } else if (role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else {
          window.location.href = '/client/dashboard';
        }
      }

    } catch (err) {
      if (err.response) {
        setError(err.response.data.detail || "Email ou mot de passe incorrect");
      } else {
        setError("Impossible de contacter le serveur.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card-wrapper">
        <div className="login-card">
          <div className="login-header">
          {/* Logo du Groupe Le Matin */}
          <img 
            src="/logo.png" 
            alt="Logo Le Matin" 
            className="logo-image" 
          />
          <h2>Portail Client</h2>
          <p></p>
        </div>

        {sessionExpiredMsg && (
          <div style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '0.85rem',
            marginBottom: '16px',
            textAlign: 'center',
            lineHeight: 1.4
          }}>
            Votre session a expiré en raison de votre inactivité. Veuillez vous reconnecter.
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Email </label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="votre@email.com" 
              required 
            />
          </div>

          <div className="input-group">
            <label>Mot de passe</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
              required 
            />
          </div>

          <a href="/forgot-password" title="Réinitialiser mon mot de passe" className="forgot-password">
            Mot de passe oublié ?
          </a>

          {error && <p style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '15px', textAlign: 'center' }}>{error}</p>}

          <button type="submit" className={`login-btn ${loading ? 'loading' : ''}`} disabled={loading}>
            {loading ? "Connexion en cours..." : "Se connecter au portail"}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.8rem', color: '#64748b' }}>
          
        </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
