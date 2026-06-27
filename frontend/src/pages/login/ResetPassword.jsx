import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './Login.css'; // On réutilise les styles premium du Login

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Le lien de réinitialisation est invalide ou manquant.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!token) {
      setError("Token manquant.");
      return;
    }

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
      const response = await api.post('/auth/reset-password-confirm', {
        token: token,
        new_password: password
      });
      setMessage(response.data.message);
      setPassword('');
      setConfirmPassword('');
      // Rediriger vers la connexion après 3 secondes
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.detail || "Une erreur est survenue lors de la réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.png" alt="Logo Le Matin" className="logo-image" />
          <h2>Nouveau Mot de Passe</h2>
          <p>Saisissez votre nouveau mot de passe pour mettre à jour votre compte.</p>
        </div>

        {error && !token ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#ef4444', marginBottom: '15px' }}>{error}</p>
            <a href="/" className="login-btn" style={{ display: 'inline-block', textDecoration: 'none', lineHeight: '45px', height: '45px', padding: '0 20px' }}>
              Retour à la connexion
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Nouveau Mot de Passe</label>
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
                disabled={loading || !!message}
              />
            </div>

            <div className="input-group">
              <label>Confirmer le Mot de Passe</label>
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="••••••••" 
                required 
                disabled={loading || !!message}
              />
            </div>

            {message && <p style={{ color: '#269d98', textAlign: 'center', marginBottom: '15px', fontWeight: 600 }}>{message} Redirection...</p>}
            {error && <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}

            {!message && (
              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Mise à jour..." : "Enregistrer le mot de passe"}
              </button>
            )}
          </form>
        )}

        <div className="login-footer" style={{ textAlign: 'center', marginTop: '20px' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
            &larr; Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
