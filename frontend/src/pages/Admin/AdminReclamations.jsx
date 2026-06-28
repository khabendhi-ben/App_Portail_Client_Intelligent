import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import '../SuperAdmin/SuperAdminTable.css';
import '../Client/ClientDashboard.css';

const AdminReclamations = () => {
  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtres de saisie (temporaires)
  const [inputSearch, setInputSearch] = useState('');
  const [inputStatus, setInputStatus] = useState('all');
  const [inputPriority, setInputPriority] = useState('all');

  // Filtres appliqués
  const [appliedSearch, setAppliedSearch] = useState('');
  const [appliedStatus, setAppliedStatus] = useState('all');
  const [appliedPriority, setAppliedPriority] = useState('all');

  // Modale de traitement
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedReclamation, setSelectedReclamation] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [nextStatus, setNextStatus] = useState('resolved');
  const [submitting, setSubmitting] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const toastTimeoutRef = useRef(null);
  const [activeDropdownId, setActiveDropdownId] = useState(null);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.sa-actions-dropdown-container')) {
        setActiveDropdownId(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const showToast = (message, type = 'success') => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast({ show: true, message, type });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  useEffect(() => {
    fetchReclamations();
  }, []);

  const fetchReclamations = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reclamations/');
      setReclamations(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Erreur lors du chargement des réclamations:", err);
      showToast("Impossible de charger la liste des réclamations.", "error");
      setLoading(false);
    }
  };

  const handleOpenModal = (rec) => {
    setSelectedReclamation(rec);
    setReplyText(rec.admin_response || '');
    setNextStatus(rec.status === 'open' ? 'pending' : rec.status);
    setIsModalOpen(true);
  };

  const handleSubmitResponse = async (e) => {
    e.preventDefault();
    if (replyText.trim() === '') {
      showToast("Veuillez saisir une réponse.", "error");
      return;
    }

    try {
      setSubmitting(true);
      const responsePayload = {
        admin_response: replyText,
        status: nextStatus
      };
      
      const res = await api.put(`/reclamations/${selectedReclamation.id}/respond`, responsePayload);
      
      // Mettre à jour l'état local
      setReclamations(prev => prev.map(r => r.id === selectedReclamation.id ? res.data : r));
      setIsModalOpen(false);
      showToast("Réponse enregistrée avec succès !");
    } catch (err) {
      console.error("Erreur de soumission de la réponse:", err);
      showToast(err.response?.data?.detail || "Une erreur est survenue lors de l'enregistrement.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setAppliedSearch(inputSearch);
    setAppliedStatus(inputStatus);
    setAppliedPriority(inputPriority);
  };

  // Filtrage local
  const filteredReclamations = reclamations.filter(rec => {
    if (appliedStatus !== 'all' && rec.status !== appliedStatus) return false;
    if (appliedPriority !== 'all' && rec.priority !== appliedPriority) return false;
    
    if (appliedSearch.trim() !== '') {
      const term = appliedSearch.toLowerCase();
      const refStr = (rec.reference || `REC-${rec.id.toString().padStart(5, '0')}`).toLowerCase();
      const subjectStr = (rec.subject || '').toLowerCase();
      const descStr = (rec.description || '').toLowerCase();
      const clientNameStr = (rec.client_name || '').toLowerCase();
      const clientCompanyStr = (rec.client_company || '').toLowerCase();
      
      return refStr.includes(term) ||
             subjectStr.includes(term) ||
             descStr.includes(term) ||
             clientNameStr.includes(term) ||
             clientCompanyStr.includes(term);
    }
    return true;
  });

  // Statistiques globales
  const totalCount = reclamations.length;
  const openCount = reclamations.filter(r => r.status === 'open').length;
  const pendingCount = reclamations.filter(r => r.status === 'pending').length;
  const resolvedCount = reclamations.filter(r => r.status === 'resolved').length;

  const getStatusBadgeInfo = (status) => {
    switch (status) {
      case 'resolved':
        return { label: 'Résolue', style: { background: '#e6f4ea', color: '#137333' } };
      case 'pending':
        return { label: 'En cours', style: { background: '#fef7e0', color: '#b06000' } };
      case 'open':
      default:
        return { label: 'Ouverte', style: { background: '#e8f0fe', color: '#1a73e8' } };
    }
  };

  const getPriorityBadgeInfo = (priority) => {
    switch (priority) {
      case 'urgent':
        return { label: 'Urgente', className: 'rejected' };
      case 'high':
        return { label: 'Haute', className: 'high' };
      case 'normal':
      default:
        return { label: 'Normale', className: 'archived' };
    }
  };

  return (
    <div className="sa-page-content">
      
      {/* SECTION KPIS */}
      <div className="client-kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem' }}>
        
        <div className="client-kpi-card" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Total Demandes</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{totalCount}</span>
          </div>
        </div>

        <div className="client-kpi-card" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #1a73e8' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#e8f0fe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a73e8' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Ouvertes</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{openCount}</span>
          </div>
        </div>

        <div className="client-kpi-card" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #b06000' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#fef7e0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#b06000' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>En cours</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{pendingCount}</span>
          </div>
        </div>

        <div className="client-kpi-card" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '1.2rem', display: 'flex', alignItems: 'center', gap: '1rem', borderLeft: '4px solid #137333' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#e6f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#137333' }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Résolues</span>
            <span style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0f172a' }}>{resolvedCount}</span>
          </div>
        </div>

      </div>

      {/* Barre de filtres horizontale unifiée (Style Client) */}
      <form onSubmit={handleFilterSubmit} className="orders-filter-bar" style={{ marginTop: '1.5rem', marginBottom: '1.5rem' }}>
        <input 
          type="text"
          placeholder="Rechercher (réf, client, entreprise...)"
          value={inputSearch}
          onChange={(e) => setInputSearch(e.target.value)}
          className="orders-filter-input"
          style={{ minWidth: '260px' }}
        />
        
        <select 
          value={inputStatus} 
          onChange={(e) => setInputStatus(e.target.value)}
          className="orders-filter-select"
        >
          <option value="all">Statut</option>
          <option value="open">Ouvertes</option>
          <option value="pending">En cours</option>
          <option value="resolved">Résolues</option>
        </select>

        <select 
          value={inputPriority} 
          onChange={(e) => setInputPriority(e.target.value)}
          className="orders-filter-select"
        >
          <option value="all">Priorité : Toutes</option>
          <option value="normal">Normale</option>
          <option value="high">Haute</option>
          <option value="urgent">Urgente</option>
        </select>

        <button type="submit" className="orders-filter-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          Filtrer
        </button>
      </form>

      {/* TABLEAU DES RÉCLAMATIONS */}
      <div className="sa-card">
        {loading ? (
          <div className="client-table-loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '3rem', gap: '10px' }}>
            <div className="client-spinner mini" style={{
              width: '20px',
              height: '20px',
              border: '2px solid #e2e8f0',
              borderTop: '2px solid #2e6b6b',
              borderRadius: '50%',
              animation: 'client-spin 1s linear infinite'
            }}></div>
            <div style={{ padding: '1.5rem', width: '100%' }}>
              <div className="skeleton skeleton-row"></div>
              <div className="skeleton skeleton-row"></div>
              <div className="skeleton skeleton-row"></div>
            </div>
          </div>
        ) : filteredReclamations.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Aucune réclamation ne correspond à vos critères.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Référence</th>
                  <th>Client / Entreprise</th>
                  <th>Annonce liée</th>
                  <th>Sujet</th>
                  <th>Date de dépôt</th>
                  <th>Priorité</th>
                  <th>Statut</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReclamations.map((rec) => {
                  const badgeInfo = getStatusBadgeInfo(rec.status);
                  const pBadge = getPriorityBadgeInfo(rec.priority);
                  return (
                    <tr key={rec.id}>
                      <td><strong>{rec.reference || `REC-${rec.id.toString().padStart(5, '0')}`}</strong></td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#1e293b' }}>{rec.client_name || 'Client Inconnu'}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{rec.client_company || 'Sans entreprise'}</div>
                      </td>
                      <td>
                        {rec.announcement_ref ? (
                          <span style={{ fontWeight: '600', color: '#2e6b6b' }}>
                            {rec.announcement_ref}
                          </span>
                        ) : (
                          <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>
                            Générale
                          </span>
                        )}
                      </td>
                      <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <strong>{rec.subject}</strong>
                      </td>
                      <td>{new Date(rec.created_at).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}</td>
                      <td>
                        <span className={`client-status-badge ${pBadge.className}`} style={{ fontWeight: '600' }}>
                          {pBadge.label}
                        </span>
                      </td>
                      <td>
                        <span 
                          className="client-status-badge" 
                          style={{ fontWeight: '600', ...badgeInfo.style }}
                        >
                          {badgeInfo.label}
                        </span>
                      </td>
                      <td>
                        <div className="sa-actions-dropdown-container">
                          <button 
                            className="sa-settings-btn"
                            title="Actions"
                            onClick={() => setActiveDropdownId(activeDropdownId === rec.id ? null : rec.id)}
                          >
                            ⋮
                          </button>
                          {activeDropdownId === rec.id && (
                            <div className="sa-dropdown-menu">
                              <button 
                                className="sa-dropdown-item" 
                                onClick={() => { handleOpenModal(rec); setActiveDropdownId(null); }}
                              >
                                Traiter
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODALE DE TRAITEMENT */}
      {isModalOpen && selectedReclamation && (
        <div className="client-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="client-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            
            <div className="client-modal-header">
              <h3>Traitement de la réclamation</h3>
              <button className="client-modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleSubmitResponse}>
              <div className="client-modal-body" style={{ gap: '1.2rem' }}>
                
                {/* Métadonnées */}
                <div className="client-modal-meta-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', background: '#f8fafc', padding: '1rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div className="client-modal-meta-item">
                    <span className="client-modal-meta-label" style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Référence</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>{selectedReclamation.reference || `REC-${selectedReclamation.id.toString().padStart(5, '0')}`}</span>
                  </div>
                  <div className="client-modal-meta-item">
                    <span className="client-modal-meta-label" style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Client</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: '700', color: '#0f172a' }}>
                      {selectedReclamation.client_name} ({selectedReclamation.client_company})
                    </span>
                  </div>
                  <div className="client-modal-meta-item">
                    <span className="client-modal-meta-label" style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Date de dépôt</span>
                    <span style={{ fontSize: '0.85rem', color: '#334155' }}>
                      {new Date(selectedReclamation.created_at).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                    </span>
                  </div>
                  <div className="client-modal-meta-item" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    {(() => {
                      const p = getPriorityBadgeInfo(selectedReclamation.priority);
                      return (
                        <span className={`client-status-badge ${p.className}`} style={{ fontWeight: '600', alignSelf: 'center' }}>
                          {p.label}
                        </span>
                      );
                    })()}
                    <span 
                      className="client-status-badge" 
                      style={{ fontWeight: '600', alignSelf: 'center', ...getStatusBadgeInfo(selectedReclamation.status).style }}
                    >
                      {getStatusBadgeInfo(selectedReclamation.status).label}
                    </span>
                  </div>
                </div>

                {/* Détails de l'annonce liée si présente */}
                {selectedReclamation.announcement_ref && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', background: '#ecfdf5', padding: '10px 14px', borderRadius: '8px', border: '1px solid #a7f3d0' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#047857', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Annonce liée
                    </span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', marginTop: '4px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: '#065f46', display: 'block' }}>Référence</span>
                        <strong style={{ fontSize: '0.9rem', color: '#064e3b' }}>{selectedReclamation.announcement_ref}</strong>
                      </div>
                      {selectedReclamation.announcement_title && (
                        <div>
                          <span style={{ fontSize: '0.75rem', color: '#065f46', display: 'block' }}>Titre</span>
                          <strong style={{ fontSize: '0.9rem', color: '#064e3b' }}>{selectedReclamation.announcement_title}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contenu */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Objet</span>
                  <span style={{ fontSize: '0.95rem', fontWeight: '700', color: '#0f172a' }}>{selectedReclamation.subject}</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase' }}>Description du client</span>
                  <div className="client-modal-description-box" style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '10px', borderRadius: '8px', fontSize: '0.9rem', color: '#334155', maxHeight: '120px', overflowY: 'auto' }}>
                    {selectedReclamation.description}
                  </div>
                </div>

                {/* Formulaire de réponse */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid #e2e8f0', paddingTop: '1rem' }}>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>Rédiger une réponse *</label>
                    <textarea
                      required
                      placeholder="Ex: Le remboursement a été effectué..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      rows="4"
                      style={{
                        padding: '10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        fontFamily: 'inherit',
                        resize: 'vertical'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569' }}>Définir le statut *</label>
                    <select
                      value={nextStatus}
                      onChange={(e) => setNextStatus(e.target.value)}
                      style={{
                        padding: '10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '0.9rem',
                        background: '#ffffff',
                        cursor: 'pointer'
                      }}
                    >
                      <option value="resolved">Résolue (Fermer le ticket)</option>
                      <option value="pending">En cours (Laisser en traitement)</option>
                    </select>
                  </div>

                </div>

              </div>

              <div className="client-modal-footer" style={{ gap: '10px' }}>
                <button 
                  type="button" 
                  className="client-btn-pagination" 
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  style={{ border: '1px solid #cbd5e1', padding: '8px 16px' }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="client-btn-modal-close" 
                  disabled={submitting}
                  style={{ background: '#2e6b6b' }}
                >
                  {submitting ? 'Enregistrement...' : 'Enregistrer la réponse'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* TOAST SYSTEM */}
      {toast.show && (
        <div className={`sa-toast ${toast.type}`}>
          <span className="sa-toast-icon">
            {toast.type === 'error' ? '✕' : '✓'}
          </span>
          <span className="sa-toast-message">{toast.message}</span>
        </div>
      )}

    </div>
  );
};

export default AdminReclamations;
