import React, { useState, useEffect, useRef } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../services/api';
import '../SuperAdmin/SuperAdminProfil.css';

const ClientProfil = () => {
  const { stats, reloadStats } = useOutletContext();

  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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
    }
  }, [stats]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const updateData = { nom, email, phone };
      if (password.trim() !== '') {
        updateData.password = password;
      }

      await api.put('/users/me', updateData);
      setPassword(''); // Effacer le mot de passe après succès
      
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
      <div className="sa-profil-content" style={{ padding: '2rem', color: '#64748b' }}>
        Chargement de vos informations...
      </div>
    );
  }

  return (
    <div className="sa-profil-content" style={{ padding: '2rem' }}>
      <div className="profil-card">

        {/* Colonne Gauche : Avatar & Détails Profil Client */}
        <div className="profil-left">
          <div className="profil-avatar-large">
            {nom ? nom.charAt(0).toUpperCase() : email.charAt(0).toUpperCase()}
          </div>
          <h3 className="profil-name">{nom || 'Client'}</h3>
          <p className="profil-company" style={{ fontWeight: '600', color: '#2e6b6b' }}>
            {stats.company_name || 'Partenaire'}
          </p>
          <p className="profil-company" style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '4px' }}>
            Abonnement {stats.subscription_type || 'Standard'}
          </p>

          <div className="profil-contact-list" style={{ marginTop: '2rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem', width: '100%' }}>
            <div className="profil-contact-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '0.85rem', marginBottom: '8px' }}>
              <span>📧</span>
              <span>{email}</span>
            </div>
            {phone && (
              <div className="profil-contact-item" style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#475569', fontSize: '0.85rem' }}>
                <span>📞</span>
                <span>{phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Colonne Droite : Formulaire */}
        <div className="profil-right">
          <h2 className="profil-section-title">Informations de contact</h2>
          
          {errorMsg && <div className="sa-error-msg" style={{ marginBottom: '1rem', color: '#ef4444', fontSize: '0.85rem' }}>{errorMsg}</div>}
          
          <form onSubmit={handleSubmit}>

            <div className="profil-row">
              <div className="profil-field full">
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

            <div className="profil-row">
              <div className="profil-field">
                <label>Adresse Email</label>
                <input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required
                  placeholder="votreemail@domaine.com"
                />
              </div>
              <div className="profil-field">
                <label>Téléphone</label>
                <input 
                  type="text" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  placeholder="Ex: +212 6 00 00 00 00"
                />
              </div>
            </div>

            <div className="profil-row">
              <div className="profil-field full">
                <label>Modifier le mot de passe (Laisser vide pour ne pas changer)</label>
                <input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  placeholder="Saisissez un nouveau mot de passe"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="profil-actions" style={{ marginTop: '2rem' }}>
              <button type="submit" className="profil-save-btn" style={{ background: '#2e6b6b' }} disabled={submitting}>
                {submitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </button>
            </div>

          </form>
        </div>

      </div>

      {toast.show && (
        <div className={`sa-toast ${toast.type}`}>
          <span className="sa-toast-icon">
            {toast.type === 'success' ? '✓' : 'ℹ'}
          </span>
          <span className="sa-toast-message">{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default ClientProfil;
