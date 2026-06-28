import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import '../SuperAdmin/SuperAdminProfil.css';

const AdminProfil = () => {
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');

  const [loading, setLoading] = useState(true);
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
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/users/me');
      const data = response.data;
      setNom(data.nom || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setRole(data.role || '');
      setLoading(false);
    } catch (error) {
      console.error("Erreur de récupération du profil:", error);
      setErrorMsg("Impossible de charger les informations de profil.");
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      const updateData = { nom, email, phone };
      if (password.trim() !== '') {
        updateData.password = password;
      }

      const response = await api.put('/users/me', updateData);
      const data = response.data;
      setNom(data.nom || '');
      setEmail(data.email || '');
      setPhone(data.phone || '');
      setPassword(''); // Effacer le mot de passe
      showToast("Profil mis à jour avec succès !");
    } catch (error) {
      setErrorMsg(error.response?.data?.detail || "Une erreur est survenue lors de la mise à jour.");
      showToast("Erreur lors de la mise à jour.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="sa-profil-content" style={{ padding: '2rem' }}>
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

  return (
    <div className="sa-profil-content">
      <div className="profil-card">

        {/* Colonne Gauche : Avatar */}
        <div className="profil-left">
          <div className="profil-avatar-large">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '40px', height: '40px' }}>
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <h3 className="profil-name">{nom || 'Administrateur'}</h3>
          <p className="profil-company" style={{ textTransform: 'capitalize' }}>
            Rôle : {role === 'superadmin' ? 'Super Administrateur' : 'Administrateur'}
          </p>

          <div className="profil-contact-list" style={{ marginTop: '1.5rem' }}>
            <div className="profil-contact-item">
              <span style={{ marginRight: '8px' }}></span>
              <span>{email}</span>
            </div>
            {phone && (
              <div className="profil-contact-item">
                <span style={{ marginRight: '8px' }}></span>
                <span>{phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Colonne Droite : Formulaire */}
        <div className="profil-right">
          <h2 className="profil-section-title">Informations personnelles</h2>
          
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
                  placeholder="votreemail@lematin.ma"
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
              <button type="submit" className="profil-save-btn" disabled={submitting}>
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

export default AdminProfil;
