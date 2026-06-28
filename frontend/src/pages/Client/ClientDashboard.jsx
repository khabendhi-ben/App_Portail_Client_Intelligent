import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import './ClientDashboard.css';

const ClientDashboard = () => {
  const { stats } = useOutletContext();
  const navigate = useNavigate();

  if (!stats) {
    return (
      <div style={{ padding: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="skeleton" style={{ height: '140px', borderRadius: '12px' }}></div>
          <div className="skeleton" style={{ height: '140px', borderRadius: '12px' }}></div>
          <div className="skeleton" style={{ height: '140px', borderRadius: '12px' }}></div>
          <div className="skeleton" style={{ height: '140px', borderRadius: '12px' }}></div>
        </div>
        <div className="skeleton" style={{ height: '400px', borderRadius: '12px' }}></div>
      </div>
    );
  }

  // Extraire l'initiale et le nom
  const getInitials = (name) => {
    if (!name) return 'C';
    const parts = name.trim().split(/\s+/);
    if (parts.length > 1) {
      return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    }
    return name.charAt(0).toUpperCase();
  };

  const userInitial = getInitials(stats.nom || stats.email);
  const userName = stats.nom || 'Client';

  // Formater le budget de manière professionnelle (ex: 150 000 DH)
  const formattedBudget = stats.budget !== undefined 
    ? new Intl.NumberFormat('fr-FR').format(stats.budget) + ' DH'
    : '0 DH';

  // Calculs pour le donut chart des réclamations
  const claimsOpen = stats.claims_open_count || 0;
  const claimsPending = stats.claims_pending_count || 0;
  const claimsResolved = stats.claims_resolved_count || 0;
  const claimsTotal = claimsOpen + claimsPending + claimsResolved;

  const pctOpen = claimsTotal > 0 ? Math.round((claimsOpen / claimsTotal) * 100) : 0;
  const pctPending = claimsTotal > 0 ? Math.round((claimsPending / claimsTotal) * 100) : 0;
  const pctResolved = claimsTotal > 0 ? Math.round((claimsResolved / claimsTotal) * 100) : 0;

  return (
    <div className="client-body-content">
            {/* BANNIÈRE BIENVENUE ÉPURÉE & PROFESSIONNELLE */}
      <div className="dashboard-welcome-banner">
        <div className="welcome-left-section">
          {/* Avatar avec orbite et point vert */}
          <div className="welcome-avatar-wrapper">
            <div className="avatar-orbit-ring">
              <span className="orbit-dot"></span>
            </div>
            <div className="welcome-avatar">{userInitial}</div>
          </div>
          
          {/* Textes d'accueil */}
          <div className="welcome-text-container">
            <h1 className="welcome-title">Bonjour, {userName} !</h1>
            <p className="welcome-subtitle">Nous sommes ravis de vous revoir.</p>
            <p className="welcome-activity-text">Voici un aperçu de votre activité aujourd'hui.</p>
          </div>
        </div>
      </div>

      {/* GRILLE DES 3 KPI CARDS PROFESSIONNELLES (RANGÉE DU BAS) */}
      <div className="client-kpi-cards-grid">
        
        {/* CARTE 1 : BUDGET TOTAL */}
        <div className="kpi-card-modern">
          <div className="kpi-icon-box bg-green">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
              <polyline points="17 6 23 6 23 12"></polyline>
            </svg>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-card-label">Budget Total</span>
            <span className="kpi-card-value">{formattedBudget}</span>
          </div>
          
        </div>

        {/* CARTE 2 : ANNONCES ACTIVES */}
        <div className="kpi-card-modern clickable" onClick={() => navigate('/client/announcements')} title="Consulter vos annonces">
          <div className="kpi-icon-box bg-blue">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
              <line x1="16" y1="13" x2="8" y2="13"></line>
              <line x1="16" y1="17" x2="8" y2="17"></line>
              <polyline points="10 9 9 9 8 9"></polyline>
            </svg>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-card-label">Annonces</span>
            <span className="kpi-card-value">{stats.active_announcements_count !== undefined ? stats.active_announcements_count : 0}</span>
          </div>
          <span className="kpi-card-link link-blue">
            Voir détails <span className="arrow-symbol">&rarr;</span>
          </span>
        </div>

        {/* CARTE 3 : RÉCLAMATIONS */}
        <div className="kpi-card-modern clickable" onClick={() => navigate('/client/reclamations')} title="Consulter vos réclamations">
          <div className="kpi-icon-box bg-orange">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="kpi-card-body">
            <span className="kpi-card-label">Réclamations</span>
            <span className="kpi-card-value">{stats.open_claims_count !== undefined ? stats.open_claims_count : 0}</span>
          </div>
          <span className="kpi-card-link link-orange">
            Voir détails <span className="arrow-symbol">&rarr;</span>
          </span>
        </div>

      </div>

      {/* RANGÉE DU BAS : WIDGETS */}
      <div className="dashboard-bottom-row">
        
        {/* CARTE DES ACTIONS RAPIDES */}
        <div className="dashboard-widget-card actions-rapides-card">
          <div className="widget-header">
            <div className="widget-header-title">
             
              <h3>Actions rapides</h3>
            </div>
          </div>
          <div className="actions-list">
            
            {/* Action 1 : Consulter mes annonces */}
            <div className="action-row" onClick={() => navigate('/client/announcements')}>
              <div className="action-left">
                <div className="action-icon-circle bg-green-light">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00c853" strokeWidth="2.5">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                </div>
                <span className="action-label-text">Consulter mes annonces</span>
              </div>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="action-chevron">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>

            {/* Action 2 : Déposer une réclamation (Redirige vers les annonces pour choisir une commande) */}
            <div className="action-row" onClick={() => navigate('/client/announcements')} title="Choisissez une annonce pour déposer votre réclamation">
              <div className="action-left">
                <div className="action-icon-circle bg-orange-light">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ff6d00" strokeWidth="2.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </div>
                <span className="action-label-text">Déposer une réclamation</span>
              </div>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="action-chevron">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>

            {/* Action 3 : Ouvrir Assistant IA */}
            <div className="action-row" onClick={() => navigate('/client/assistant')}>
              <div className="action-left">
                <div className="action-icon-circle bg-teal-light">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#14b8a6" strokeWidth="2.5">
                    <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                    <circle cx="12" cy="5" r="2"></circle>
                    <path d="M12 7v4"></path>
                    <line x1="8" y1="16" x2="8" y2="16"></line>
                    <line x1="16" y1="16" x2="16" y2="16"></line>
                  </svg>
                </div>
                <span className="action-label-text">Ouvrir Assistant IA</span>
              </div>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="action-chevron">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>

            {/* Action 4 : Contacter le support */}
            <div className="action-row" onClick={() => navigate('/client/contact')}>
              <div className="action-left">
                <div className="action-icon-circle bg-purple-light">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#a855f7" strokeWidth="2.5">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>
                <span className="action-label-text">Contacter le support</span>
              </div>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" className="action-chevron">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>

          </div>
        </div>

        {/* CARTE STATUT DES RÉCLAMATIONS */}
        <div className="dashboard-widget-card claims-status-card">
          <div className="widget-header">
            <div className="widget-header-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#334155' }}>
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
              </svg>
              <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b', fontWeight: '700' }}>Statut des réclamations</h3>
            </div>
          </div>
          
          <div className="claims-dashboard-split">
            {/* Left Donut */}
            <div className="claims-dashboard-donut-wrapper">
              <div className="donut-chart-circle" style={{
                background: claimsTotal > 0 ? `conic-gradient(#ef4444 0% ${pctOpen}%, #f59e0b ${pctOpen}% ${pctOpen + pctPending}%, #10b981 ${pctOpen + pctPending}% 100%)` : '#cbd5e1'
              }}>
                <div className="donut-chart-inner">
                  <span className="donut-chart-total">{claimsTotal}</span>
                  <span className="donut-chart-label">Total</span>
                </div>
              </div>
            </div>

            {/* Right List */}
            <div className="claims-dashboard-list">
              <div className="claims-dashboard-item">
                <div className="claims-item-left">
                  <span className="claims-dot open"></span>
                  <span className="claims-count">{claimsOpen}</span>
                  <span className="claims-label">Ouverte(s)</span>
                </div>
                
              </div>

              <div className="claims-dashboard-item">
                <div className="claims-item-left">
                  <span className="claims-dot pending"></span>
                  <span className="claims-count">{claimsPending}</span>
                  <span className="claims-label">En cours</span>
                </div>
                
              </div>

              <div className="claims-dashboard-item">
                <div className="claims-item-left">
                  <span className="claims-dot resolved"></span>
                  <span className="claims-count">{claimsResolved}</span>
                  <span className="claims-label">Résolue(s)</span>
                </div>
                
              </div>
            </div>
          </div>

          <div className="claims-dashboard-footer">
            <span className="claims-footer-link" onClick={() => navigate('/client/reclamations')}>
              Voir toutes les réclamations <span className="arrow-symbol">&rarr;</span>
            </span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ClientDashboard;
