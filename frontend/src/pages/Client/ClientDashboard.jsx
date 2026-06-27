import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import './ClientDashboard.css';

const ClientDashboard = () => {
  const { stats } = useOutletContext();
  const navigate = useNavigate();

  if (!stats) {
    return (
      <div className="client-loading-container" style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  return (
    <div className="client-body-content">
      {/* Welcome Card */}
      

      {/* KPI Grid */}
      <div className="client-kpi-grid">
        {/* Active Announcements */}
        <div 
          className="client-kpi-card" 
          onClick={() => navigate('/client/announcements')} 
          style={{ cursor: 'pointer' }}
          title="Consulter vos annonces"
        >
          <div className="client-kpi-icon-wrapper">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
            </svg>
          </div>
          <div className="client-kpi-info">
            <span className="client-kpi-label">Annonces</span>
            <span className="client-kpi-value">{stats.active_announcements_count}</span>
          </div>
        </div>

        {/* Budget */}
        <div className="client-kpi-card">
          <div className="client-kpi-icon-wrapper">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="2" y1="10" x2="22" y2="10"></line>
            </svg>
          </div>
          
        </div>

        {/* Open Claims */}
        <div className="client-kpi-card">
          <div className="client-kpi-icon-wrapper">
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div className="client-kpi-info">
            <span className="client-kpi-label">Réclamations Ouvertes</span>
            <span className="client-kpi-value">{stats.open_claims_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
