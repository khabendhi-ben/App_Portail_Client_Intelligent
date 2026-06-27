import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import './SuperAdminTable.css';

const SuperAdminGestionClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtre d'état des clients (pilules), recherche et dropdown actif
  const [statusFilter, setStatusFilter] = useState('active'); // 'all', 'active', 'inactive'
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDropdownId, setActiveDropdownId] = useState(null);

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

  // États pour la modale principale (créer / modifier)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('create');
  const [selectedClient, setSelectedClient] = useState(null);

  // Champs du formulaire
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [subscriptionType, setSubscriptionType] = useState('Standard');

  // Modale affichage MDP généré après création / réinitialisation
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [generatedInfo, setGeneratedInfo] = useState({ email: '', password: '', title: '' });

  // Soumission
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients/');
      setClients(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Erreur de récupération des clients:", error);
      setLoading(false);
    }
  };

  // ─── CRÉER / MODIFIER ─────────────────────────────────────────
  const handleOpenCreateModal = () => {
    setModalType('create');
    setSelectedClient(null);
    setNom('');
    setEmail('');
    setPhone('');
    setCompanyName('');
    setSubscriptionType('Standard');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (client) => {
    setModalType('edit');
    setSelectedClient(client);
    setNom(client.nom || '');
    setEmail(client.email);
    setPhone(client.phone || '');
    setCompanyName(client.company_name || '');
    setSubscriptionType(client.subscription_type || 'Standard');
    setErrorMsg('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      if (modalType === 'create') {
        const response = await api.post('/clients/', {
          nom, email, phone, company_name: companyName, subscription_type: subscriptionType
        });
        // Afficher le MDP généré
        setGeneratedInfo({
          email: response.data.email,
          password: response.data.generated_password,
          title: "Client créé avec succès"
        });
        setIsModalOpen(false);
        setIsPasswordModalOpen(true);
        fetchClients(); // Recharger la liste
        showToast("Client créé avec succès !");
      } else {
        await api.put(`/clients/${selectedClient.id}`, {
          nom, email, phone, company_name: companyName, subscription_type: subscriptionType
        });
        fetchClients();
        setIsModalOpen(false);
        showToast("Profil du client mis à jour !");
      }
    } catch (error) {
      setErrorMsg(error.response?.data?.detail || "Une erreur s'est produite.");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── RÉINITIALISER LE MOT DE PASSE (DIRECT) ─────────────────────
  const handleResetPassword = (client) => {
    triggerConfirm(
      "Réinitialiser le mot de passe",
      `Voulez-vous vraiment réinitialiser le mot de passe de ${client.email} ? Un email de notification lui sera envoyé automatiquement avec son nouveau mot de passe.`,
      async () => {
        try {
          const response = await api.put(`/clients/${client.id}/reset-password`);
          setGeneratedInfo({
            email: client.email,
            password: response.data.new_password,
            title: "Mot de passe réinitialisé"
          });
          setIsPasswordModalOpen(true);
          showToast(`Mot de passe de ${client.email} réinitialisé avec succès !`);
        } catch (error) {
          showToast("Erreur lors de la réinitialisation.", "error");
        }
      }
    );
  };

  // ─── DÉSACTIVER / RÉACTIVER ────────────────────────────────────
  const handleToggleStatus = (client) => {
    const action = client.is_active ? 'désactiver' : 'réactiver';
    triggerConfirm(
      "Confirmation de statut",
      `Voulez-vous vraiment ${action} ce client (${client.email}) ?`,
      async () => {
        try {
          if (client.is_active) {
            await api.put(`/clients/${client.id}/deactivate`);
          } else {
            await api.put(`/clients/${client.id}/activate`);
          }
          setClients(prev => prev.map(c => c.id === client.id ? { ...c, is_active: !c.is_active } : c));
          showToast(`Client ${client.is_active ? 'désactivé' : 'réactivé'} avec succès !`);
        } catch (error) {
          showToast(`Erreur lors de la tentative de ${action}.`, "error");
        }
      }
    );
  };

  // ─── SUPPRIMER ─────────────────────────────────────────────────

  const filteredClients = clients.filter(client => {
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' && client.is_active) || 
      (statusFilter === 'inactive' && !client.is_active);

    const matchesSearch = 
      (client.nom || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (client.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client.company_name || '').toLowerCase().includes(searchTerm.toLowerCase());

    return matchesStatus && matchesSearch;
  });

  const handleDelete = (client) => {
    triggerConfirm(
      "Suppression définitive",
      `Supprimer définitivement le client "${client.email}" ? Cette action est irréversible.`,
      async () => {
        try {
          await api.delete(`/clients/${client.id}`);
          setClients(prev => prev.filter(c => c.id !== client.id));
          showToast("Client supprimé avec succès !");
        } catch (error) {
          showToast("Erreur lors de la suppression.", "error");
        }
      }
    );
  };

  return (
    <div className="sa-page-content">
      <div className="sa-page-header">
        <h2>Gestion des Clients</h2>
        <button className="sa-btn-primary" onClick={handleOpenCreateModal}>+ Nouveau Client</button>
      </div>

      {/* Barre de recherche & Pilules de filtrage pour les clients */}
      <div className="sa-toolbar">
        <div className="sa-filters-container" style={{ marginBottom: 0 }}>
          <button 
            className={`sa-filter-pill ${statusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setStatusFilter('all')}
          >
            Tous ({clients.length})
          </button>
          <button 
            className={`sa-filter-pill ${statusFilter === 'active' ? 'active' : ''}`}
            onClick={() => setStatusFilter('active')}
          >
            Actifs ({clients.filter(c => c.is_active).length})
          </button>
          <button 
            className={`sa-filter-pill ${statusFilter === 'inactive' ? 'active' : ''}`}
            onClick={() => setStatusFilter('inactive')}
          >
            Désactivés ({clients.filter(c => !c.is_active).length})
          </button>
        </div>
        <div className="sa-search-wrapper">
          <svg className="sa-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input 
            type="text"
            placeholder="Rechercher par nom, email ou entreprise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="sa-card">
        {loading ? (
          <p style={{ color: '#94a3b8', padding: '1rem' }}>Chargement...</p>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>NOM</th>
                  <th>ENTREPRISE</th>
                  <th>EMAIL</th>
                  <th>TÉLÉPHONE</th>
                  <th>ABONNEMENT</th>
                  <th>STATUT</th>
                  <th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                      Aucun client trouvé
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr key={client.id}>
                      <td><strong>{client.nom || '—'}</strong></td>
                      <td>{client.company_name || '—'}</td>
                      <td>{client.email}</td>
                      <td>{client.phone || '—'}</td>
                      <td>
                        <span style={{
                          background: client.subscription_type === 'Premium' ? '#fef3c7' : '#f0fdf4',
                          color: client.subscription_type === 'Premium' ? '#b45309' : '#15803d',
                          padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 600
                        }}>
                          {client.subscription_type || 'Standard'}
                        </span>
                      </td>
                      <td>
                        <span className={`sa-badge ${client.is_active ? 'active' : 'inactive'}`}>
                          {client.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>
                        <div className="sa-actions-dropdown-container">
                          <button 
                            className="sa-settings-btn"
                            title="Actions"
                            onClick={() => setActiveDropdownId(activeDropdownId === client.id ? null : client.id)}
                          >
                            ⋮
                          </button>
                          {activeDropdownId === client.id && (
                            <div className="sa-dropdown-menu">
                              <button 
                                className="sa-dropdown-item" 
                                onClick={() => { handleOpenEditModal(client); setActiveDropdownId(null); }}
                              >
                                Modifier
                              </button>
                              <button 
                                className="sa-dropdown-item" 
                                onClick={() => { handleResetPassword(client); setActiveDropdownId(null); }}
                              >
                                Réinitialiser MDP
                              </button>
                              <button 
                                className="sa-dropdown-item" 
                                onClick={() => { handleToggleStatus(client); setActiveDropdownId(null); }}
                              >
                                {client.is_active ? 'Désactiver' : 'Réactiver'}
                              </button>
                              <button 
                                className="sa-dropdown-item delete" 
                                onClick={() => { handleDelete(client); setActiveDropdownId(null); }}
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
        )}
      </div>

      {/* ═══ MODALE CRÉER / MODIFIER ═══ */}
      {isModalOpen && (
        <div className="sa-modal-overlay">
          <div className="sa-modal">
            <div className="sa-modal-header">
              <h3>{modalType === 'create' ? '+ Nouveau Client' : 'Modifier le client'}</h3>
              <button className="sa-modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="sa-modal-body">
                {errorMsg && <div className="sa-error-msg">{errorMsg}</div>}

                <div className="sa-form-group">
                  <label>Nom complet</label>
                  <input type="text" value={nom} onChange={(e) => setNom(e.target.value)} required placeholder="Nom et prénom" />
                </div>

                <div className="sa-form-group">
                  <label>Nom de l'entreprise</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required placeholder="Ex: Société ABC" />
                </div>

                <div className="sa-form-group">
                  <label>Adresse Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="client@entreprise.ma" autoComplete="new-email" />
                </div>

                <div className="sa-form-group">
                  <label>Téléphone</label>
                  <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="06 00 00 00 00" />
                </div>

                <div className="sa-form-group">
                  <label>Type d'abonnement</label>
                  <select value={subscriptionType} onChange={(e) => setSubscriptionType(e.target.value)}>
                    <option value="Standard">Standard</option>
                    <option value="Premium">Premium</option>
                  </select>
                </div>

                {modalType === 'create' && (
                  <p style={{ fontSize: '0.8rem', color: '#64748b', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    Le mot de passe sera généré automatiquement et affiché après la création.
                  </p>
                )}
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

      {/* ═══ MODALE MDP GÉNÉRÉ ═══ */}
      {isPasswordModalOpen && (
        <div className="sa-modal-overlay">
          <div className="sa-modal">
            <div className="sa-modal-header">
              <h3>{generatedInfo.title || 'Informations de connexion'}</h3>
              <button className="sa-modal-close" onClick={() => setIsPasswordModalOpen(false)}>×</button>
            </div>
            <div className="sa-modal-body">
              <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '1rem' }}>
                Voici les informations d'accès du client. Communiquez-les au client de manière sécurisée.
              </p>
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '16px' }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem' }}>
                  <strong>Email :</strong> {generatedInfo.email}
                </p>
                <p style={{ margin: '0', fontSize: '0.85rem' }}>
                  <strong>Mot de passe :</strong>{' '}
                  <code style={{ background: '#dcfce7', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '1rem' }}>
                    {generatedInfo.password}
                  </code>
                </p>
              </div>
            </div>
            <div className="sa-modal-footer">
              <button className="sa-btn-primary" onClick={() => setIsPasswordModalOpen(false)}>
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

export default SuperAdminGestionClients;
