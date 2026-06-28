import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import './ClientProfil.css';

const ClientProfil = () => {
  const { stats, reloadStats } = useOutletContext();

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [password, setPassword] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Notifications success/error
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const toastTimeoutRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  useEffect(() => {
    if (stats) {
      setNom(stats.nom || '');
      setEmail(stats.email || '');
      setPhone(stats.phone || '');
      setAddress(stats.address || '');
    }
  }, [stats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    if (password.trim() !== '' && oldPassword.trim() === '') {
      setErrorMsg("Veuillez saisir votre ancien mot de passe pour confirmer le changement.");
      setSubmitting(false);
      return;
    }

    try {
      const updateData = { nom, email, phone, address };
      if (password.trim() !== '') {
        updateData.password = password;
        updateData.old_password = oldPassword;
      }

      await api.put('/users/me', updateData);
      setPassword(''); // Effacer après succès
      setOldPassword('');
      
      // Recharger les stats pour mettre à jour l'en-tête de la page
      if (reloadStats) {
        await reloadStats();
      }

      showToast("Profil mis à jour avec succès !");
    } catch (error) {
      console.error(error);
      setErrorMsg(error.response?.data?.detail || "Une erreur est survenue lors de la mise à jour.");
      showToast("Erreur lors de la mise à jour.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!stats) {
    return (
      <div className="client-profil-container" style={{ color: '#64748b', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="skeleton skeleton-avatar" style={{ width: '80px', height: '80px' }}></div>
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text" style={{ width: '40%', height: '24px' }}></div>
            <div className="skeleton skeleton-text-short"></div>
          </div>
        </div>
        <div className="skeleton skeleton-row"></div>
        <div className="skeleton skeleton-row"></div>
        <div className="skeleton skeleton-row"></div>
      </div>
    );
  }

  const isPremium = stats.subscription_type?.toLowerCase() === 'premium';

  return (
    <div className="client-profil-container">
      <div className="client-profil-grid">

        {/* Colonne Gauche : Carte Utilisateur */}
        <div className="client-profile-card">
          <div className="client-profile-avatar">
            {nom ? nom.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
          </div>
          <h3 className="client-profile-name">{nom || 'Client'}</h3>
          <p className="client-profile-company">
            {stats.company_name || 'Partenaire Le Matin'}
          </p>
          
          <div className={`client-profile-badge ${isPremium ? 'premium' : 'standard'}`}>
            {isPremium ? (
              <>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style={{ marginRight: '4px' }}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                Abonnement Premium
              </>
            ) : (
              'Abonnement Standard'
            )}
          </div>

          <div className="client-profile-divider"></div>

          <div className="client-profile-info-list">
            <div className="client-profile-info-item">
              <div className="client-profile-info-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div className="client-profile-info-text">
                <span className="client-profile-info-label">E-mail</span>
                <span className="client-profile-info-value">{email}</span>
              </div>
            </div>

            {phone && (
              <div className="client-profile-info-item">
                <div className="client-profile-info-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                  </svg>
                </div>
                <div className="client-profile-info-text">
                  <span className="client-profile-info-label">Téléphone</span>
                  <span className="client-profile-info-value">{phone}</span>
                </div>
              </div>
            )}

            {address && (
              <div className="client-profile-info-item">
                <div className="client-profile-info-icon">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <div className="client-profile-info-text">
                  <span className="client-profile-info-label">Adresse</span>
                  <span className="client-profile-info-value">{address}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Colonne Droite : Formulaire de modifications */}
        <div className="client-profile-form-card">
          <h2 className="client-profile-title">Informations de contact</h2>
          
          {errorMsg && (
            <div style={{ 
              marginBottom: '1.5rem', 
              color: '#ef4444', 
              fontSize: '0.85rem',
              backgroundColor: '#fef2f2',
              padding: '10px 14px',
              borderRadius: '6px',
              border: '1px solid #fee2e2'
            }}>
              {errorMsg}
            </div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className="client-profile-form-section">
              <div className="client-profile-row full">
                <div className="client-profile-field">
                  <label>Nom complet</label>
                  <input 
                    type="text"
                    value={nom} 
                    onChange={(e) => setNom(e.target.value)} 
                    required
                    placeholder="Votre nom complet"
                  />
                </div>
              </div>

              <div className="client-profile-row">
                <div className="client-profile-field">
                  <label>Adresse Email</label>
                  <input 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    required
                    placeholder="votreemail@domaine.com"
                  />
                </div>
                <div className="client-profile-field">
                  <label>Téléphone</label>
                  <input 
                    type="text" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="Ex: +212 6 00 00 00 00"
                  />
                </div>
              </div>

              <div className="client-profile-row full">
                <div className="client-profile-field">
                  <label>Adresse</label>
                  <input 
                    type="text" 
                    value={address} 
                    onChange={(e) => setAddress(e.target.value)} 
                    placeholder="Ex: 17, Rue Othmane Ben Affane, Casablanca"
                  />
                </div>
              </div>
            </div>

            <h2 className="client-profile-title">Sécurité</h2>
            <div className="client-profile-form-section">
              <div className="client-profile-row">
                <div className="client-profile-field">
                  <label>Ancien mot de passe</label>
                  <input 
                    type="password" 
                    value={oldPassword} 
                    onChange={(e) => setOldPassword(e.target.value)} 
                    placeholder="Saisissez votre mot de passe actuel"
                    autoComplete="current-password"
                    required={password.trim() !== ''}
                  />
                </div>
                <div className="client-profile-field">
                  <label>Nouveau mot de passe</label>
                  <input 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Saisissez un nouveau mot de passe"
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            <div className="client-profile-submit-box">
              <button 
                type="submit" 
                className="client-profile-submit-btn" 
                disabled={submitting}
              >
                {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>
          </form>
        </div>

      </div>

      {toast.show && (
        <div className={`client-toast-message ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default ClientProfil;
