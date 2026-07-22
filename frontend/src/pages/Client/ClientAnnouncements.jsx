import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './ClientDashboard.css';

const ClientAnnouncements = () => {
  const navigate = useNavigate();

  // État pour le menu déroulant d'actions ouvert (ID de la commande)
  const [openDropdownId, setOpenDropdownId] = useState(null);

  // États de saisie des filtres (temporaires)
  const [inputReference, setInputReference] = useState('');
  const [inputDate, setInputDate] = useState('');
  const [inputType, setInputType] = useState('all');
  const [inputStatus, setInputStatus] = useState('all');

  // États des filtres appliqués (utilisés pour l'appel API)
  const [appliedReference, setAppliedReference] = useState('');
  const [appliedDate, setAppliedDate] = useState('');
  const [appliedType, setAppliedType] = useState('all');
  const [appliedStatus, setAppliedStatus] = useState('all');

  // États de focus pour l'affichage du placeholder de la date
  const [isDateFocused, setIsDateFocused] = useState(false);

  // États pour les Annonces
  const [announcements, setAnnouncements] = useState([]);
  const [annLoading, setAnnLoading] = useState(false);
  const [annPage, setAnnPage] = useState(1);
  const [annLimit] = useState(10); // 10 éléments par page (comme dans la maquette)
  const [annTotal, setAnnTotal] = useState(0);
  const [annPages, setAnnPages] = useState(1);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // États pour la modale de réclamation
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [claimAnnouncement, setClaimAnnouncement] = useState(null);
  const [claimSubject, setClaimSubject] = useState('');
  const [claimDescription, setClaimDescription] = useState('');
  const [claimPriority, setClaimPriority] = useState('normal');
  const [claimSubmitting, setClaimSubmitting] = useState(false);
  const [claimSuccessRef, setClaimSuccessRef] = useState('');
  const [showClaimSuccessModal, setShowClaimSuccessModal] = useState(false);

  // Fermer le menu déroulant lors d'un clic en dehors
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.orders-action-btn') && !e.target.closest('.orders-action-dropdown')) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const toggleDropdown = (e, id) => {
    e.stopPropagation();
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  const handleClaimAnnouncement = (ann) => {
    setOpenDropdownId(null);
    setClaimAnnouncement(ann);
    setClaimSubject(`Réclamation - Annonce ${ann.reference}`);
    setClaimDescription(`Bonjour,\n\nJe souhaite déposer une réclamation concernant la commande ${ann.reference}.\n\n[Saisissez les détails de votre problème ici]`);
    setClaimPriority('normal');
    setIsClaimModalOpen(true);
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (claimSubject.trim() === '' || claimDescription.trim() === '') {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      setClaimSubmitting(true);
      const postData = {
        subject: claimSubject,
        description: claimDescription,
        priority: claimPriority,
        announcement_id: claimAnnouncement.id
      };
      const response = await api.post('/reclamations/', postData);
      
      // Stocker la référence créée et ouvrir la confirmation
      setClaimSuccessRef(response.data.reference || `REC-${response.data.id.toString().padStart(5, '0')}`);
      setIsClaimModalOpen(false);
      setShowClaimSuccessModal(true);
    } catch (error) {
      console.error("Erreur lors de la soumission de la réclamation:", error);
      alert(error.response?.data?.detail || "Une erreur est survenue lors de la création de la réclamation. Veuillez réessayer.");
    } finally {
      setClaimSubmitting(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [annPage, appliedReference, appliedDate, appliedType, appliedStatus]);

  const fetchAnnouncements = async () => {
    try {
      setAnnLoading(true);
      const params = {
        page: annPage,
        limit: annLimit,
        status: appliedStatus,
      };
      if (appliedReference.trim() !== '') {
        params.reference = appliedReference.trim();
      }
      if (appliedDate) {
        params.start_date = appliedDate;
        params.end_date = appliedDate; // Filtre sur le jour précis
      }
      if (appliedType !== 'all') {
        params.type = appliedType;
      }
      const response = await api.get('/announcements/me', { params });
      setAnnouncements(response.data.items);
      setAnnTotal(response.data.total);
      setAnnPages(response.data.pages);
      setAnnLoading(false);
    } catch (err) {
      console.error("Erreur de chargement des annonces:", err);
      setAnnLoading(false);
    }
  };

  const handleFilterSubmit = (e) => {
    if (e) e.preventDefault();
    setAppliedReference(inputReference);
    setAppliedDate(inputDate);
    setAppliedType(inputType);
    setAppliedStatus(inputStatus);
    setAnnPage(1); // Revenir à la première page
  };

  const handleResetFilters = () => {
    setInputReference('');
    setInputDate('');
    setInputType('all');
    setInputStatus('all');
    
    setAppliedReference('');
    setAppliedDate('');
    setAppliedType('all');
    setAppliedStatus('all');
    
    setAnnPage(1);
  };

  // Formatage de la date en AAAA-MM-JJ HH:mm:ss
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '-';
    const pad = (n) => n.toString().padStart(2, '0');
    
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Formatage du montant avec le séparateur de milliers et suffixe MAD
  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) return '0,00 MAD';
    const formatted = new Intl.NumberFormat('fr-MA', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
    return `${formatted} MAD`;
  };

  // Mapping des types en majuscules pour correspondre à la maquette
  const formatType = (type) => {
    if (!type) return 'COMMANDE ANNONCE';
    const t = type.toLowerCase();
    if (t === 'bannière') return 'COMMANDE ANNONCE';
    if (t === 'article') return 'COMMANDE JOURNAL';
    if (t === 'social') return 'RECHARGE';
    if (t === 'vidéo') return 'COMMANDE VIDÉO';
    if (t === 'print') return 'COMMANDE PRINT';
    return type.toUpperCase();
  };

  // Export CSV de toutes les commandes filtrées
  const handleExportCSV = async () => {
    try {
      const params = {
        page: 1,
        limit: 1000,
        status: appliedStatus,
      };
      if (appliedReference.trim()) {
        params.reference = appliedReference.trim();
      }
      if (appliedDate) {
        params.start_date = appliedDate;
        params.end_date = appliedDate;
      }
      if (appliedType !== 'all') {
        params.type = appliedType;
      }
      
      const response = await api.get('/announcements/me', { params });
      const itemsToExport = response.data.items;
      
      if (itemsToExport.length === 0) {
        alert("Aucune commande à exporter.");
        return;
      }
      
      // En-têtes et lignes CSV
      const headers = ["RÉFÉRENCE", "SUPPORT", "TITRE", "TYPE", "STATUT", "MONTANT (TTC)", "DATE DE CRÉATION"];
      const rows = itemsToExport.map(ann => [
        ann.reference || `cmd-${ann.id}/${ann.user_id}`,
        (ann.support || 'LE MATIN').toUpperCase(),
        ann.title || '-',
        formatType(ann.type),
        ann.status === 'active' ? 'ACTIVE' : ann.status === 'pending' ? 'EN ATTENTE DE VALIDATION' : ann.status === 'rejected' ? 'ANNULÉ' : 'ARCHIVÉE',
        formatAmount(ann.budget),
        formatDate(ann.created_at)
      ]);
      
      const csvContent = [
        headers.join(';'),
        ...rows.map(e => e.map(val => `"${val.replace(/"/g, '""')}"`).join(';'))
      ].join('\n');
      
      // Téléchargement
      const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", `suivi_commandes_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Erreur lors de l'export CSV:", err);
      alert("Une erreur est survenue lors de l'exportation.");
    }
  };

  return (
    <div className="client-body-content" style={{ padding: '2rem' }}>

      <div className="client-announcements-panel">
        
        {/* Barre de filtres (Recherche manuelle avec boutons Filtrer / Réinitialiser) */}
        <form onSubmit={handleFilterSubmit} className="orders-filter-bar">
          <input 
            type="text"
            placeholder="Référence"
            value={inputReference}
            onChange={(e) => setInputReference(e.target.value)}
            className="orders-filter-input"
          />
          
          <input 
            type={isDateFocused || inputDate ? "date" : "text"}
            placeholder="Date"
            value={inputDate}
            onFocus={() => setIsDateFocused(true)}
            onBlur={() => setIsDateFocused(false)}
            onChange={(e) => setInputDate(e.target.value)}
            className="orders-filter-input"
          />

          <select 
            value={inputType} 
            onChange={(e) => setInputType(e.target.value)}
            className="orders-filter-select"
          >
            <option value="all">Type</option>
            <option value="COMMANDE JOURNAUX">COMMANDE JOURNAUX</option>
          </select>

          <select 
            value={inputStatus} 
            onChange={(e) => setInputStatus(e.target.value)}
            className="orders-filter-select"
          >
            <option value="all">Statut</option>
            <option value="active">Actives</option>
            <option value="pending">En attente</option>
          </select>

          <button type="submit" className="orders-filter-btn">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Filtrer
          </button>

          <button 
            type="button" 
            onClick={handleResetFilters} 
            className="orders-reset-btn"
          >
            Réinitialiser
          </button>
        </form>

        {/* Tableau des Commandes */}
        <div className="sa-card">
          {annLoading ? (
            <div className="client-table-loading">
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
          ) : (
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="client-table">
                <thead>
                  <tr>
                    <th>RÉFÉRENCE</th>
                    <th>SUPPORT</th>
                    <th>TYPE</th>
                    <th>STATUT</th>
                    <th>MONTANT (TTC)</th>
                    <th>DATE DE CRÉATION</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {announcements.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                        Aucune commande trouvée.
                      </td>
                    </tr>
                  ) : (
                    announcements.map((ann) => (
                      <tr key={ann.id}>
                        <td>
                          <span className="orders-ref-text">{ann.reference}</span>
                        </td>
                        <td>
                          <span className="orders-support-text">{ann.support || 'LE MATIN'}</span>
                        </td>
                        <td>
                          <span className="orders-type-text">{formatType(ann.type)}</span>
                        </td>
                        <td>
                          <span className={`orders-status-badge ${ann.status}`}>
                            {ann.status === 'active' && 'ACTIVE'}
                            {ann.status === 'pending' && 'EN ATTENTE DE VALIDATION'}
                            {ann.status === 'rejected' && 'ANNULÉ'}
                            {ann.status === 'archived' && 'ARCHIVÉE'}
                          </span>
                        </td>
                        <td>
                          <strong>{formatAmount(ann.budget)}</strong>
                        </td>
                        <td>{formatDate(ann.created_at)}</td>
                        <td style={{ position: 'relative' }}>
                          <button 
                            className="orders-action-btn"
                            onClick={(e) => toggleDropdown(e, ann.id)}
                            title="Actions"
                          >
                            &#8942;
                          </button>
                          {openDropdownId === ann.id && (
                            <div className="orders-action-dropdown" onClick={(e) => e.stopPropagation()}>
                              <button 
                                onClick={() => { setSelectedAnnouncement(ann); setOpenDropdownId(null); }} 
                                className="orders-dropdown-item"
                              >
                                Voir le détail
                              </button>
                              <button 
                                onClick={() => handleClaimAnnouncement(ann)} 
                                className="orders-dropdown-item claim"
                              >
                                Réclamer
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination centrée */}
        {!annLoading && annPages > 1 && (
          <div className="orders-pagination-container">
            {annPage > 1 && (
              <button 
                className="orders-btn-suivant"
                style={{ marginRight: '10px' }}
                onClick={() => setAnnPage(prev => Math.max(prev - 1, 1))}
              >
                Précédent
              </button>
            )}
            {annPage < annPages && (
              <button 
                className="orders-btn-suivant"
                onClick={() => setAnnPage(prev => Math.min(prev + 1, annPages))}
              >
                Suivant
              </button>
            )}
          </div>
        )}
      </div>

      {/* MODALE DE DÉTAIL D'ANNONCE */}
      {selectedAnnouncement && (
        <div className="client-modal-overlay" onClick={() => setSelectedAnnouncement(null)}>
          <div className="client-modal" onClick={(e) => e.stopPropagation()}>
            <div className="client-modal-header">
              <h3>Détail de la commande</h3>
              <button className="client-modal-close" onClick={() => setSelectedAnnouncement(null)}>&times;</button>
            </div>
            
            <div className="client-modal-body">
              <h2 className="client-modal-title">{selectedAnnouncement.title || '-'}</h2>
              
              <div className="client-modal-meta-grid">
                <div className="client-modal-meta-item">
                  <span className="client-modal-meta-label">Référence</span>
                  <span className="orders-ref-text">
                    {selectedAnnouncement.reference}
                  </span>
                </div>

                <div className="client-modal-meta-item">
                  <span className="client-modal-meta-label">Support Publicitaire</span>
                  <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#334155' }}>
                    {selectedAnnouncement.support || 'LE MATIN'}
                  </span>
                </div>

                <div className="client-modal-meta-item">
                  <span className="client-modal-meta-label">Type de Commande</span>
                  <span className="orders-type-text" style={{ fontWeight: '600', color: '#475569' }}>
                    {formatType(selectedAnnouncement.type)}
                  </span>
                </div>
                
                <div className="client-modal-meta-item">
                  <span className="client-modal-meta-label">Montant Budget (TTC)</span>
                  <span className="client-modal-budget">
                    {formatAmount(selectedAnnouncement.budget)}
                  </span>
                </div>

                <div className="client-modal-meta-item">
                  <span className="client-modal-meta-label">Date de Création</span>
                  <span className="client-modal-date">
                    {formatDate(selectedAnnouncement.created_at)}
                  </span>
                </div>

                <div className="client-modal-meta-item">
                  <span className="client-modal-meta-label">Statut Actuel</span>
                  <span className={`orders-status-badge ${selectedAnnouncement.status}`} style={{ alignSelf: 'flex-start', padding: '6px 14px' }}>
                    {selectedAnnouncement.status === 'active' && 'ACTIVE'}
                    {selectedAnnouncement.status === 'pending' && 'EN ATTENTE DE VALIDATION'}
                    {selectedAnnouncement.status === 'rejected' && 'ANNULÉ'}
                    {selectedAnnouncement.status === 'archived' && 'ARCHIVÉE'}
                  </span>
                </div>
              </div>

              <div className="client-modal-content-section">
                <h4 className="client-modal-section-title">Description de la Commande</h4>
                <div className="client-modal-description-box">
                  {selectedAnnouncement.content}
                </div>
              </div>
            </div>

            <div className="client-modal-footer">
              <button className="client-btn-modal-close" onClick={() => setSelectedAnnouncement(null)}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE CRÉATION DE RÉCLAMATION DIRECTE */}
      {isClaimModalOpen && claimAnnouncement && (
        <div className="client-modal-overlay" onClick={() => setIsClaimModalOpen(false)}>
          <div className="client-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="client-modal-header">
              <h3>Nouvelle réclamation</h3>
              <button className="client-modal-close" onClick={() => setIsClaimModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmitClaim}>
              <div className="client-modal-body" style={{ gap: '1.2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Commande associée
                  </span>
                  <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#2e6b6b' }}>
                    {claimAnnouncement.reference}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Objet de la demande *</label>
                  <input 
                    type="text" 
                    value={claimSubject} 
                    onChange={(e) => setClaimSubject(e.target.value)}
                    required
                    placeholder="Ex: Contenu erroné, problème de diffusion..."
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      outline: 'none'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Priorité *</label>
                  <select 
                    value={claimPriority} 
                    onChange={(e) => setClaimPriority(e.target.value)}
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      outline: 'none',
                      background: '#ffffff',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="normal">Normale</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Description détaillée *</label>
                  <textarea 
                    value={claimDescription} 
                    onChange={(e) => setClaimDescription(e.target.value)}
                    required
                    placeholder="Décrivez votre problème le plus précisément possible..."
                    rows="5"
                    style={{
                      padding: '10px 12px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      outline: 'none',
                      fontFamily: 'inherit',
                      resize: 'vertical'
                    }}
                  />
                </div>
              </div>

              <div className="client-modal-footer" style={{ gap: '10px' }}>
                <button 
                  type="button" 
                  className="client-btn-pagination" 
                  onClick={() => setIsClaimModalOpen(false)}
                  disabled={claimSubmitting}
                  style={{ border: '1px solid #cbd5e1', padding: '8px 16px' }}
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="client-btn-modal-close" 
                  disabled={claimSubmitting}
                  style={{ background: '#2e6b6b' }}
                >
                  {claimSubmitting ? 'Envoi en cours...' : 'Soumettre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION (SUCCÈS) */}
      {showClaimSuccessModal && (
        <div className="client-modal-overlay">
          <div className="client-modal" style={{ maxWidth: '450px', textAlign: 'center' }}>
            <div className="client-modal-body" style={{ padding: '2.5rem 2rem', alignItems: 'center', gap: '1.2rem' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#e6f4ea',
                color: '#137333',
                fontSize: '2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginBottom: '8px'
              }}>
                ✓
              </div>
              
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: '700' }}>Réclamation enregistrée</h3>
              
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: '1.5' }}>
                Votre réclamation a été transmise avec succès à notre équipe de support.
              </p>

              <div style={{
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                padding: '12px 20px',
                borderRadius: '8px',
                width: '100%',
                boxSizing: 'border-box',
                margin: '8px 0'
              }}>
                <span style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                  Numéro de référence
                </span>
                <span style={{ fontSize: '1.4rem', fontWeight: '700', color: '#2e6b6b', letterSpacing: '0.05em' }}>
                  {claimSuccessRef}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: '1.4' }}>
                Veuillez conserver ce numéro pour suivre l'état de votre dossier.
              </p>

              <button 
                onClick={() => setShowClaimSuccessModal(false)}
                className="client-btn-modal-close"
                style={{ background: '#2e6b6b', width: '100%', padding: '10px 0', marginTop: '8px' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientAnnouncements;

