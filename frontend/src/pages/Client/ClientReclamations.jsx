import React, { useState, useEffect } from 'react';
import { useOutletContext, useLocation } from 'react-router-dom';
import api from '../../services/api';
import './ClientDashboard.css';

const ClientReclamations = () => {
  const { reloadStats } = useOutletContext();
  const location = useLocation();

  const [reclamations, setReclamations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Formulaire de dépôt
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState('normal');
  const [submitting, setSubmitting] = useState(false);

  // Modale de succès
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successRef, setSuccessRef] = useState('');

  // Modale de détail
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedReclamation, setSelectedReclamation] = useState(null);

  // Helper pour mapper les statuts et styles de badges
  const getStatusBadge = (status) => {
    switch (status) {
      case 'resolved':
        return { className: 'active', label: 'Résolue' };
      case 'pending':
        return { className: 'pending', label: 'En cours' };
      case 'open':
      default:
        return { className: '', label: 'Ouverte', style: { background: '#e8f0fe', color: '#1a73e8' } };
    }
  };

  const getPriorityBadge = (priority) => {
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

  const handleOpenDetailModal = (rec) => {
    setSelectedReclamation(rec);
    setIsDetailOpen(true);
  };

  useEffect(() => {
    fetchReclamations();
  }, []);

  // Pré-remplir le formulaire si on vient de la page d'annonces
  useEffect(() => {
    if (location.state && location.state.prefillSubject) {
      setSubject(location.state.prefillSubject);
      if (location.state.prefillDescription) {
        setDescription(location.state.prefillDescription);
      }
      setIsModalOpen(true);
      // Nettoyer l'état de l'historique de navigation pour éviter de réouvrir au refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchReclamations = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get('/reclamations/me');
      setReclamations(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Erreur de chargement des réclamations:", err);
      setErrorMsg("Impossible de récupérer l'historique de vos réclamations.");
      setLoading(false);
    }
  };

  const handleOpenModal = () => {
    setSubject('');
    setDescription('');
    setPriority('normal');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (subject.trim() === '' || description.trim() === '') {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    try {
      setSubmitting(true);
      const postData = { subject, description, priority };
      const response = await api.post('/reclamations/', postData);
      
      // Fermer le formulaire
      setIsModalOpen(false);
      
      // Stocker la référence créée et ouvrir la confirmation
      setSuccessRef(response.data.reference || `REC-${response.data.id.toString().padStart(5, '0')}`);
      setShowSuccessModal(true);

      // Recharger les statistiques du dashboard (KPIs)
      if (reloadStats) {
        await reloadStats();
      }

      // Recharger la liste locale des réclamations
      fetchReclamations();
    } catch (error) {
      console.error("Erreur de soumission de la réclamation:", error);
      alert(error.response?.data?.detail || "Une erreur est survenue lors du dépôt de votre réclamation. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="client-body-content" style={{ padding: '2rem' }}>
      
      <div className="client-announcements-panel">
        
        {/* Barre d'outils avec bouton d'action */}
        <div className="client-toolbar" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b', fontWeight: '700' }}>Suivi de vos demandes</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748b' }}></p>
          </div>
        </div>

        {/* Tableau des réclamations */}
        <div className="sa-card">
          {loading ? (
            <div className="client-table-loading">
              <div className="client-spinner mini" style={{
                width: '20px',
                height: '20px',
                border: '2px solid #e2e8f0',
                borderTop: '2px solid #2e6b6b',
                borderRadius: '50%',
                animation: 'client-spin 1s linear infinite'
              }}></div>
              <span style={{ marginLeft: '8px' }}>Chargement de vos réclamations...</span>
            </div>
          ) : errorMsg ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#ef4444' }}>
              <p>{errorMsg}</p>
              <button className="client-btn-details" onClick={fetchReclamations}>Réessayer</button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="client-table">
                <thead>
                  <tr>
                    <th>RÉFÉRENCE</th>
                    <th>OBJET</th>
                    <th>COMMANDE ASSOCIÉE</th>
                    <th>DATE DE DÉPÔT</th>
                    <th>PRIORITÉ</th>
                    <th>STATUT</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {reclamations.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                        Vous n'avez déposé aucune réclamation pour le moment.
                      </td>
                    </tr>
                  ) : (
                    reclamations.map((rec) => {
                      const badgeInfo = getStatusBadge(rec.status);
                      const pBadge = getPriorityBadge(rec.priority);
                      return (
                        <tr key={rec.id}>
                          <td><strong>{rec.reference || `REC-${rec.id.toString().padStart(5, '0')}`}</strong></td>
                          <td className="claim-subject"><strong>{rec.subject}</strong></td>
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
                          <td>{new Date(rec.created_at).toLocaleDateString('fr-FR', { dateStyle: 'medium' })}</td>
                          <td>
                            <span className={`client-status-badge ${pBadge.className}`} style={{ fontWeight: '600' }}>
                              {pBadge.label}
                            </span>
                          </td>
                          <td>
                            <span 
                              className={`client-status-badge ${badgeInfo.className}`} 
                              style={{ fontWeight: '600', ...badgeInfo.style }}
                            >
                              {badgeInfo.label}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="client-btn-details"
                              onClick={() => handleOpenDetailModal(rec)}
                            >
                              Voir le détail
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* MODALE DE FORMULAIRE DE CRÉATION */}
      {isModalOpen && (
        <div className="client-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="client-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '550px' }}>
            <div className="client-modal-header">
              <h3>Nouvelle réclamation</h3>
              <button className="client-modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="client-modal-body" style={{ gap: '1.2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569' }}>Objet de la demande *</label>
                  <input 
                    type="text" 
                    value={subject} 
                    onChange={(e) => setSubject(e.target.value)}
                    required
                    placeholder="Ex: Facture erronée, problème technique..."
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
                    value={priority} 
                    onChange={(e) => setPriority(e.target.value)}
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
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    placeholder="Veuillez décrire le problème rencontré le plus précisément possible..."
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
                  {submitting ? 'Envoi en cours...' : 'Soumettre'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODALE DE CONFIRMATION (SUCCÈS) */}
      {showSuccessModal && (
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
                Votre demande a été transmise avec succès à notre équipe de support.
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
                  {successRef}
                </span>
              </div>

              <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b', lineHeight: '1.4' }}>
                Veuillez conserver ce numéro pour suivre l'état de votre dossier.
              </p>

              <button 
                onClick={() => setShowSuccessModal(false)}
                className="client-btn-modal-close"
                style={{ background: '#2e6b6b', width: '100%', padding: '10px 0', marginTop: '8px' }}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE DE DÉTAIL DE RÉCLAMATION */}
      {isDetailOpen && selectedReclamation && (
        <div className="client-modal-overlay" onClick={() => setIsDetailOpen(false)}>
          <div className="client-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="client-modal-header">
              <h3>Détail de la réclamation</h3>
              <button className="client-modal-close" onClick={() => setIsDetailOpen(false)}>&times;</button>
            </div>
            
            <div className="client-modal-body" style={{ gap: '1.2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Référence :</span>
                  <h4 style={{ margin: '2px 0 0 0', fontSize: '1.1rem', color: '#0f172a', fontWeight: '700' }}>
                    {selectedReclamation.reference || `REC-${selectedReclamation.id.toString().padStart(5, '0')}`}
                  </h4>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(() => {
                    const p = getPriorityBadge(selectedReclamation.priority);
                    return (
                      <span className={`client-status-badge ${p.className}`} style={{ fontWeight: '600' }}>
                        {p.label}
                      </span>
                    );
                  })()}
                  {(() => {
                    const badge = getStatusBadge(selectedReclamation.status);
                    return (
                      <span 
                        className={`client-status-badge ${badge.className}`} 
                        style={{ fontWeight: '600', ...badge.style }}
                      >
                        {badge.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              {selectedReclamation.announcement_ref && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Commande associée
                  </span>
                  <span style={{ fontSize: '0.95rem', color: '#2e6b6b', fontWeight: '700' }}>
                    {selectedReclamation.announcement_ref} {selectedReclamation.announcement_title ? `(${selectedReclamation.announcement_title})` : ''}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Date de dépôt
                </span>
                <span style={{ fontSize: '0.9rem', color: '#334155', fontWeight: '500' }}>
                  {new Date(selectedReclamation.created_at).toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Objet
                </span>
                <span style={{ fontSize: '1rem', color: '#0f172a', fontWeight: '700' }}>
                  {selectedReclamation.subject}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Description de votre demande
                </span>
                <div className="client-modal-description-box" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  {selectedReclamation.description}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Réponse de l'administration
                </span>
                {selectedReclamation.admin_response ? (
                  <div style={{
                    background: '#e6f4ea',
                    borderLeft: '4px solid #137333',
                    padding: '1.2rem',
                    borderRadius: '8px',
                    color: '#137333',
                    fontSize: '0.92rem',
                    lineHeight: '1.6',
                    whiteSpace: 'pre-wrap'
                  }}>
                    <div style={{ fontWeight: '700', marginBottom: '6px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      ✓ Réponse reçue
                    </div>
                    {selectedReclamation.admin_response}
                  </div>
                ) : (
                  <div style={{
                    background: '#f8fafc',
                    borderLeft: '4px solid #94a3b8',
                    padding: '1.2rem',
                    borderRadius: '8px',
                    color: '#64748b',
                    fontSize: '0.9rem',
                    lineHeight: '1.5',
                    fontStyle: 'italic'
                  }}>
                    Demande en cours de traitement par l'équipe Le Matin. Une réponse vous sera apportée dans les plus brefs délais.
                  </div>
                )}
              </div>
            </div>
            
            <div className="client-modal-footer">
              <button 
                className="client-btn-modal-close" 
                onClick={() => setIsDetailOpen(false)}
                style={{ background: '#2e6b6b' }}
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

export default ClientReclamations;
