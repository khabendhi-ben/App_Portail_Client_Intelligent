import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import './SuperAdminTable.css';

const SuperAdminGestionAdmins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtre d'état des admins (pilules), recherche et dropdown actif
  const [statusFilter, setStatusFilter] = useState('active'); // 'all', 'active', 'inactive'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Onglet actif
  const [activeTab, setActiveTab] = useState('list'); // 'list' ou 'requests'
  const [resetRequests, setResetRequests] = useState([]);

  // Fermer le menu dropdown lors du clic à l'extérieur
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.sa-actions-dropdown-container')) {
        setActiveDropdownId(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
    };
  }, []);
  const [requestsLoading, setRequestsLoading] = useState(false);

  // Modal d'affichage du mot de passe généré automatiquement
  const [isGeneratedModalOpen, setIsGeneratedModalOpen] = useState(false);
  const [generatedInfo, setGeneratedInfo] = useState({ email: '', password: '' });

  // États pour la modale principale (créer / modifier)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Champs du formulaire principal
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('admin');

  // États pour la modale de réinitialisation du mot de passe
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetAdmin, setResetAdmin] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetErrorMsg, setResetErrorMsg] = useState('');

  // États pour la modale de réinitialisation personnalisée (demandes)
  const [isCustomResetModalOpen, setIsCustomResetModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [customNewPassword, setCustomNewPassword] = useState('');
  const [showCustomNewPassword, setShowCustomNewPassword] = useState(false);
  const [customResetSubmitting, setCustomResetSubmitting] = useState(false);
  const [customResetError, setCustomResetError] = useState('');

  // Modale de confirmation personnalisée
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState({ title: '', message: '', onConfirm: null });

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

  const triggerConfirm = (title, message, onConfirmCallback) => {
    setConfirmModalData({
      title,
      message,
      onConfirm: () => {
        onConfirmCallback();
        setIsConfirmModalOpen(false);
      }
    });
    setIsConfirmModalOpen(true);
  };

  // Gestion soumission formulaire principal
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchAdmins();
    fetchResetRequests();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await api.get('/users/');
      setAdmins(response.data.filter(u => u.role === 'admin' || u.role === 'superadmin'));
      setLoading(false);
    } catch (error) {
      console.error("Erreur de récupération:", error);
      setLoading(false);
    }
  };

  const fetchResetRequests = async () => {
    setRequestsLoading(true);
    try {
      const response = await api.get('/auth/admin/reset-requests');
      setResetRequests(response.data);
    } catch (error) {
      console.error("Erreur de récupération des demandes:", error);
    } finally {
      setRequestsLoading(false);
    }
  };

  const handleOpenCustomResetModal = (req) => {
    setSelectedRequest(req);
    setCustomNewPassword('');
    setShowCustomNewPassword(false);
    setCustomResetError('');
    setIsCustomResetModalOpen(true);
  };

  const handleGenerateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let autoPassword = "";
    for (let i = 0; i < 10; i++) {
      autoPassword += chars.charAt(Math.floor(chars.length * Math.random()));
    }
    setCustomNewPassword(autoPassword);
  };

  const handleGenerateRandomMainPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let autoPassword = "";
    for (let i = 0; i < 10; i++) {
      autoPassword += chars.charAt(Math.floor(chars.length * Math.random()));
    }
    setPassword(autoPassword);
  };

  const handleCustomResetSubmit = async (e) => {
    e.preventDefault();
    if (customNewPassword.trim() === '') {
      setCustomResetError("Veuillez saisir un mot de passe.");
      return;
    }
    setCustomResetSubmitting(true);
    setCustomResetError('');
    try {
      await api.post('/auth/admin/reset-password', {
        request_id: selectedRequest.id,
        new_password: customNewPassword
      });
      // Filtrer de la liste locale
      setResetRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      setIsCustomResetModalOpen(false);

      // Afficher les identifiants
      setGeneratedInfo({
        email: selectedRequest.email,
        password: customNewPassword
      });
      setIsGeneratedModalOpen(true);
    } catch (error) {
      setCustomResetError(error.response?.data?.detail || "Erreur lors de la réinitialisation.");
    } finally {
      setCustomResetSubmitting(false);
    }
  };

  // ─── MODALE PRINCIPALE ───────────────────────────────────────
  const handleOpenCreateModal = () => {
    setModalType('create');
    setSelectedAdmin(null);
    setNom('');
    setEmail('');
    setPhone('');
    setPassword('');
    setShowPassword(false);
    setRole('admin');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (admin) => {
    setModalType('edit');
    setSelectedAdmin(admin);
    setNom(admin.nom || '');
    setEmail(admin.email);
    setPhone(admin.phone || '');
    setPassword('');
    setShowPassword(false);
    setRole(admin.role);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      if (modalType === 'create') {
        const response = await api.post('/users/', { nom, email, phone, password, role });
        setAdmins(prev => [...prev, response.data]);
        showToast("Administrateur créé avec succès !");
      } else {
        const updateData = { nom, email, phone, role };
        if (password.trim() !== '') updateData.password = password;
        const response = await api.put(`/users/${selectedAdmin.id}`, updateData);
        setAdmins(prev => prev.map(a => a.id === selectedAdmin.id ? response.data : a));
        showToast("Profil de l'administrateur mis à jour !");
      }
      setIsModalOpen(false);
    } catch (error) {
      setErrorMsg(error.response?.data?.detail || "Une erreur s'est produite.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── MODALE RÉINITIALISATION MOT DE PASSE ────────────────────
  const handleOpenResetModal = (admin) => {
    setResetAdmin(admin);
    setNewPassword('');
    setShowNewPassword(false);
    setResetErrorMsg('');
    setIsResetModalOpen(true);
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (newPassword.trim() === '') {
      setResetErrorMsg("Le mot de passe ne peut pas être vide.");
      return;
    }
    setResetSubmitting(true);
    setResetErrorMsg('');
    try {
      await api.put(`/users/${resetAdmin.id}`, {
        email: resetAdmin.email,
        role: resetAdmin.role,
        password: newPassword
      });
      setIsResetModalOpen(false);
      showToast(`Mot de passe de ${resetAdmin.email} réinitialisé avec succès !`);
    } catch (error) {
      setResetErrorMsg(error.response?.data?.detail || "Erreur lors de la réinitialisation.");
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleToggleStatus = (admin) => {
    const action = admin.is_active ? 'désactiver' : 'réactiver';
    triggerConfirm(
      "Confirmation de statut",
      `Voulez-vous vraiment ${action} cet utilisateur (${admin.email}) ?`,
      async () => {
        try {
          if (admin.is_active) {
            await api.put(`/users/${admin.id}/deactivate`);
          } else {
            await api.put(`/users/${admin.id}`, { email: admin.email, role: admin.role, is_active: true });
          }
          setAdmins(prev => prev.map(a => a.id === admin.id ? { ...a, is_active: !a.is_active } : a));
          showToast(`Administrateur ${admin.is_active ? 'désactivé' : 'réactivé'} avec succès !`);
        } catch (error) {
          showToast(`Erreur lors de la tentative de ${action} l'utilisateur.`, 'error');
        }
      }
    );
  };

  const handleDeleteAdmin = (admin) => {
    triggerConfirm(
      "Confirmation de suppression",
      `Voulez-vous vraiment supprimer définitivement cet utilisateur (${admin.email}) ? Cette action est irréversible et supprimera toutes les données associées.`,
      async () => {
        try {
          await api.delete(`/users/${admin.id}`);
          setAdmins(prev => prev.filter(a => a.id !== admin.id));
          showToast(`Administrateur ${admin.email} supprimé définitivement avec succès !`);
        } catch (error) {
          showToast(error.response?.data?.detail || "Erreur lors de la suppression de l'utilisateur.", 'error');
        }
      }
    );
  };

  // ─── BADGE RÔLE ───────────────────────────────────────────────
  const getRoleBadge = (userRole) => {
    if (userRole === 'superadmin') {
      return <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 }}>Super Admin</span>;
    }
    return <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600 }}>Admin</span>;
  };

  // (PasswordInput et icônes déplacés à l'extérieur du composant parent pour éviter les pertes de focus)

  const filteredAdmins = admins.filter(admin => {
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && admin.is_active) || 
      (statusFilter === 'inactive' && !admin.is_active);

    const matchesSearch = 
      (admin.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (admin.email || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="sa-page-content">
      <div className="sa-page-header">
        <h2>Gestion des Administrateurs</h2>
        {activeTab === 'list' && (
          <button className="sa-btn-primary" onClick={handleOpenCreateModal}>+ Nouvel Admin</button>
        )}
      </div>

      {/* Onglets */}
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #cbd5e1', paddingBottom: '0px', marginBottom: '1.5rem' }}>
        <button
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 15px',
            fontSize: '0.9rem',
            fontWeight: activeTab === 'list' ? '700' : '500',
            color: activeTab === 'list' ? '#2e6b6b' : '#64748b',
            borderBottom: activeTab === 'list' ? '3px solid #2e6b6b' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => setActiveTab('list')}
        >
          Liste des Admins
        </button>
        <button
          style={{
            background: 'none',
            border: 'none',
            padding: '10px 15px',
            fontSize: '0.9rem',
            fontWeight: activeTab === 'requests' ? '700' : '500',
            color: activeTab === 'requests' ? '#2e6b6b' : '#64748b',
            borderBottom: activeTab === 'requests' ? '3px solid #2e6b6b' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onClick={() => {
            setActiveTab('requests');
            fetchResetRequests();
          }}
        >
          Demandes de Réinitialisation {resetRequests.length > 0 && <span style={{ background: '#be123c', color: 'white', padding: '2px 6px', borderRadius: '50%', fontSize: '0.7rem', marginLeft: '5px' }}>{resetRequests.length}</span>}
        </button>
      </div>

      {/* Barre de recherche & Pilules de filtrage pour les administrateurs */}
      {activeTab === 'list' && (
        <div className="sa-toolbar">
          <div className="sa-filters-container" style={{ marginBottom: 0 }}>
            <button 
              className={`sa-filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
              onClick={() => setStatusFilter('all')}
            >
              Tous ({admins.length})
            </button>
            <button 
              className={`sa-filter-pill ${statusFilter === 'active' ? 'active' : ''}`}
              onClick={() => setStatusFilter('active')}
            >
              Actifs ({admins.filter(a => a.is_active).length})
            </button>
            <button 
              className={`sa-filter-pill ${statusFilter === 'inactive' ? 'active' : ''}`}
              onClick={() => setStatusFilter('inactive')}
            >
              Désactivés ({admins.filter(a => !a.is_active).length})
            </button>
          </div>
          <div className="sa-search-wrapper">
            <svg className="sa-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input 
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      )}

      <div className="sa-card">
        {activeTab === 'list' ? (
          loading ? (
            <p style={{ color: '#94a3b8', padding: '1rem' }}>Chargement...</p>
          ) : (
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>NOM</th>
                    <th>EMAIL</th>
                    <th>TÉLÉPHONE</th>
                    <th>RÔLE</th>
                    <th>STATUT</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAdmins.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                        Aucun administrateur trouvé
                      </td>
                    </tr>
                  ) : (
                    filteredAdmins.map((admin) => (
                      <tr key={admin.id}>
                        <td><strong>{admin.nom || '—'}</strong></td>
                        <td>{admin.email}</td>
                        <td>{admin.phone || '—'}</td>
                        <td>{getRoleBadge(admin.role)}</td>
                        <td>
                          <span className={`sa-badge ${admin.is_active ? 'active' : 'inactive'}`}>
                            {admin.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td>
                          <div className="sa-actions-dropdown-container">
                            <button 
                              className="sa-settings-btn"
                              title="Actions"
                              onClick={() => setActiveDropdownId(activeDropdownId === admin.id ? null : admin.id)}
                            >
                              ⋮
                            </button>
                            {activeDropdownId === admin.id && (
                              <div className="sa-dropdown-menu">
                                <button 
                                  className="sa-dropdown-item" 
                                  onClick={() => { handleOpenEditModal(admin); setActiveDropdownId(null); }}
                                >
                                  Modifier
                                </button>
                                <button 
                                  className="sa-dropdown-item" 
                                  onClick={() => { handleOpenResetModal(admin); setActiveDropdownId(null); }}
                                >
                                  Réinitialiser MDP
                                </button>
                                <button 
                                  className="sa-dropdown-item" 
                                  onClick={() => { handleToggleStatus(admin); setActiveDropdownId(null); }}
                                >
                                  {admin.is_active ? 'Désactiver' : 'Réactiver'}
                                </button>
                                <button 
                                  className="sa-dropdown-item delete" 
                                  onClick={() => { handleDeleteAdmin(admin); setActiveDropdownId(null); }}
                                >
                                  Supprimer
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )
        ) : (
          requestsLoading ? (
            <p style={{ color: '#94a3b8', padding: '1rem' }}>Chargement des demandes...</p>
          ) : (
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>EMAIL DE L'ADMIN</th>
                    <th>DATE DE LA DEMANDE</th>
                    <th>STATUT</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {resetRequests.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                        Aucune demande de réinitialisation en attente
                      </td>
                    </tr>
                  ) : (
                    resetRequests.map((req) => (
                      <tr key={req.id}>
                        <td><strong>{req.email}</strong></td>
                        <td>{new Date(req.created_at).toLocaleString('fr-FR')}</td>
                        <td>
                          <span className="sa-badge inactive">En attente</span>
                        </td>
                        <td>
                          <div className="sa-actions-dropdown-container">
                            <button 
                              className="sa-settings-btn"
                              title="Actions"
                              onClick={() => setActiveDropdownId(activeDropdownId === `req-${req.id}` ? null : `req-${req.id}`)}
                            >
                              ⋮
                            </button>
                            {activeDropdownId === `req-${req.id}` && (
                              <div className="sa-dropdown-menu">
                                <button 
                                  className="sa-dropdown-item" 
                                  onClick={() => { handleOpenCustomResetModal(req); setActiveDropdownId(null); }}
                                >
                                  Valider et réinitialiser
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* ═══ MODALE CRÉER / MODIFIER ═══ */}
      {isModalOpen && (
        <div className="sa-modal-overlay">
          <div className="sa-modal">
            <div className="sa-modal-header">
              <h3>{modalType === 'create' ? '+ Nouvel Administrateur' : "Modifier l'administrateur"}</h3>
              <button className="sa-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="sa-modal-body">
                {errorMsg && <div className="sa-error-msg">{errorMsg}</div>}

                <div className="sa-form-group">
                  <label>Nom complet</label>
                  <input
                    type="text"
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    required
                    placeholder="Nom et prénom"
                  />
                </div>

                <div className="sa-form-group">
                  <label>Adresse Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="nom@lematin.ma"
                    autoComplete="new-email"
                  />
                </div>

                <div className="sa-form-group">
                  <label>Téléphone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="06 00 00 00 00"
                  />
                </div>

                <div className="sa-form-group">
                  <label>Rôle</label>
                  <select value={role} onChange={(e) => setRole(e.target.value)}>
                    <option value="admin">Admin</option>
                    <option value="superadmin">Super Admin</option>
                  </select>
                </div>

                <div className="sa-form-group">
                  <label>
                    {modalType === 'create' ? 'Mot de passe temporaire' : 'Nouveau mot de passe (laisser vide pour ne pas changer)'}
                  </label>
                  <PasswordInput
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={modalType === 'create'}
                    placeholder="••••••••"
                    show={showPassword}
                    onToggle={() => setShowPassword(!showPassword)}
                  />
                  <div style={{ textAlign: 'right', marginTop: '8px' }}>
                    <button 
                      type="button" 
                      className="sa-action-btn edit-btn" 
                      onClick={handleGenerateRandomMainPassword}
                      style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                    >
                      Générer aléatoirement
                    </button>
                  </div>
                </div>
              </div>
              <div className="sa-modal-footer">
                <button type="button" className="sa-btn-secondary" onClick={() => setIsModalOpen(false)}>Annuler</button>
                <button type="submit" className="sa-btn-primary" disabled={submitting}>
                  {submitting ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ═══ MODALE RÉINITIALISATION PERSONNALISÉE (DEMANDE ADMIN) ═══ */}
      {isCustomResetModalOpen && selectedRequest && (
        <div className="sa-modal-overlay">
          <div className="sa-modal">
            <div className="sa-modal-header">
              <h3>Réinitialiser le mot de passe</h3>
              <button className="sa-modal-close" onClick={() => setIsCustomResetModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleCustomResetSubmit}>
              <div className="sa-modal-body">
                {customResetError && <div className="sa-error-msg">{customResetError}</div>}

                <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1.25rem', background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  Compte Admin : <strong>{selectedRequest.email}</strong>
                </p>

                <div className="sa-form-group">
                  <label>Nouveau mot de passe</label>
                  <PasswordInput
                    value={customNewPassword}
                    onChange={(e) => setCustomNewPassword(e.target.value)}
                    required={true}
                    placeholder="Saisir le nouveau mot de passe"
                    show={showCustomNewPassword}
                    onToggle={() => setShowCustomNewPassword(!showCustomNewPassword)}
                  />
                </div>
                
                <div style={{ textAlign: 'right', marginTop: '10px' }}>
                  <button 
                    type="button" 
                    className="sa-action-btn edit-btn" 
                    onClick={handleGenerateRandomPassword}
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    Générer aléatoirement
                  </button>
                </div>
              </div>
              <div className="sa-modal-footer">
                <button type="button" className="sa-btn-secondary" onClick={() => setIsCustomResetModalOpen(false)}>Annuler</button>
                <button type="submit" className="sa-btn-primary" disabled={customResetSubmitting}>
                  {customResetSubmitting ? 'Enregistrement...' : 'Confirmer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODALE MOT DE PASSE GÉNÉRÉ AUTOMATIQUEMENT ═══ */}
      {isGeneratedModalOpen && (
        <div className="sa-modal-overlay">
          <div className="sa-modal">
            <div className="sa-modal-header">
              <h3>Mot de passe généré</h3>
              <button className="sa-modal-close" onClick={() => setIsGeneratedModalOpen(false)}>×</button>
            </div>
            <div className="sa-modal-body">
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem' }}>
                Le mot de passe de l'administrateur a été réinitialisé avec succès. Veuillez lui communiquer les informations ci-dessous de manière sécurisée.
              </p>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem' }}>
                  <strong>Email :</strong> {generatedInfo.email}
                </p>
                <p style={{ margin: '0', fontSize: '0.85rem' }}>
                  <strong>Nouveau mot de passe :</strong>{' '}
                  <code style={{ background: '#dcfce7', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '1rem' }}>
                    {generatedInfo.password}
                  </code>
                </p>
              </div>
            </div>
            <div className="sa-modal-footer">
              <button className="sa-btn-primary" onClick={() => setIsGeneratedModalOpen(false)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ MODALE DE CONFIRMATION ESTHÉTIQUE ═══ */}
      {isConfirmModalOpen && (
        <div className="sa-modal-overlay">
          <div className="sa-modal" style={{ maxWidth: '400px' }}>
            <div className="sa-modal-header" style={{ borderBottom: 'none', paddingBottom: '0.5rem' }}>
              <h3 style={{ color: '#be123c', fontSize: '1.05rem' }}>{confirmModalData.title}</h3>
              <button className="sa-modal-close" onClick={() => setIsConfirmModalOpen(false)}>×</button>
            </div>
            <div className="sa-modal-body" style={{ paddingTop: '0.5rem', paddingBottom: '1.5rem' }}>
              <p style={{ fontSize: '0.9rem', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                {confirmModalData.message}
              </p>
            </div>
            <div className="sa-modal-footer" style={{ background: '#fff', borderTop: 'none', padding: '1rem 1.5rem' }}>
              <button type="button" className="sa-btn-secondary" onClick={() => setIsConfirmModalOpen(false)}>
                Annuler
              </button>
              <button 
                type="button" 
                className="sa-btn-primary" 
                style={{ background: '#be123c' }} 
                onClick={confirmModalData.onConfirm}
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

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

// ─── COMPOSANT CHAMP MOT DE PASSE ─────────────────────────────
const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);

const EyeOffIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const PasswordInput = ({ value, onChange, required, placeholder, show, onToggle }) => (
  <div style={{ position: 'relative' }}>
    <input
      type={show ? 'text' : 'password'}
      value={value}
      onChange={onChange}
      required={required}
      placeholder={placeholder}
      autoComplete="new-password"
      style={{ paddingRight: '42px', width: '100%', boxSizing: 'border-box' }}
    />
    <button
      type="button"
      onClick={onToggle}
      style={{
        position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
        background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8',
        display: 'flex', alignItems: 'center', padding: '0'
      }}
      title={show ? 'Masquer' : 'Afficher'}
    >
      {show ? <EyeOffIcon /> : <EyeIcon />}
    </button>
  </div>
);

export default SuperAdminGestionAdmins;
