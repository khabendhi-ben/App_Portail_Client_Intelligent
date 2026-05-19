import React, { useState } from 'react';
import axios from 'axios';
import './Login.css'; // On réutilise les styles premium du Login

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await axios.post('http://localhost:8000/forgot-password', {
        email: email,
        password: "dummy_password" // On envoie un dummy car le schéma attend un password
      });
      setMessage(response.data.message);
    } catch (err) {
      setError("Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/logo.png" alt="Logo Le Matin" className="logo-image" />
          <h2>Réinitialisation</h2>
          <p>Entrez votre email pour faire une demande au SuperAdmin</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Votre Email</label>
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="votre@email.com" 
              required 
            />
          </div>

          {message && <p style={{ color: '#269d98', textAlign: 'center', marginBottom: '15px' }}>{message}</p>}
          {error && <p style={{ color: '#ef4444', textAlign: 'center', marginBottom: '15px' }}>{error}</p>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Envoi en cours..." : "Envoyer la demande"}
          </button>
        </form>

        <div className="login-footer" style={{ textAlign: 'center', marginTop: '20px' }}>
          <a href="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: '0.9rem' }}>
            &larr; Retour à la connexion
          </a>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
