import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [clientsRes, requestsRes] = await Promise.all([
        api.get('/clients/'),
        api.get('/auth/client/reset-requests')
      ]);
      setClients(clientsRes.data);
      setResetRequests(requestsRes.data);
    } catch (error) {
      console.error("Erreur lors du chargement des données du tableau de bord:", error);
    } finally {
      setLoading(false);
    }
  };

  // Statics calculations
  const totalClients = clients.length;
  const activeClients = clients.filter(c => c.is_active).length;
  const inactiveClients = totalClients - activeClients;
  const pendingResets = resetRequests.filter(r => r.status === 'en_attente').length;

  // Subscription breakdown
  const standardSubs = clients.filter(c => c.subscription_type === 'Standard').length;
  const premiumSubs = clients.filter(c => c.subscription_type === 'Premium').length;
  const otherSubs = totalClients - standardSubs - premiumSubs;

  const standardPercentage = totalClients > 0 ? Math.round((standardSubs / totalClients) * 100) : 0;
  const premiumPercentage = totalClients > 0 ? Math.round((premiumSubs / totalClients) * 100) : 0;
  const otherPercentage = totalClients > 0 ? Math.round((otherSubs / totalClients) * 100) : 0;

  // Sort clients by ID descending or just reverse to get "recent" ones
  const recentClients = [...clients].reverse().slice(0, 5);
  const recentResets = [...resetRequests].reverse().slice(0, 5);

  return (
    <div className="ad-dashboard-container">
      {/* HEADER */}
     

      {/* STAT CARDS */}
      <div className="ad-stats-grid">
        <div className="ad-stat-card card-total">
          <div className="ad-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div className="ad-stat-info">
            <span className="ad-stat-label">Total Clients</span>
            <span className="ad-stat-value">{loading ? '...' : totalClients}</span>
          </div>
        </div>

        <div className="ad-stat-card card-active">
          <div className="ad-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="ad-stat-info">
            <span className="ad-stat-label">Clients Actifs</span>
            <span className="ad-stat-value">{loading ? '...' : activeClients}</span>
          </div>
        </div>

        <div className="ad-stat-card card-inactive">
          <div className="ad-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          </div>
          <div className="ad-stat-info">
            <span className="ad-stat-label">Comptes Suspendus</span>
            <span className="ad-stat-value">{loading ? '...' : inactiveClients}</span>
          </div>
        </div>

        <div className={`ad-stat-card card-resets ${pendingResets > 0 ? 'has-pending' : ''}`}>
          <div className="ad-stat-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 9.9-1" />
            </svg>
            {pendingResets > 0 && <span className="ad-badge-pulse"></span>}
          </div>
          <div className="ad-stat-info">
            <span className="ad-stat-label">Demandes Reset</span>
            <span className="ad-stat-value">{loading ? '...' : pendingResets}</span>
          </div>
        </div>
      </div>

      {/* MIDDLE SECTION: DETAILED VIEWS */}
      <div className="ad-dashboard-main-row">
        {/* RECENT CLIENTS */}
        <div className="ad-card ad-clients-card">
          <div className="ad-card-header">
            <h3>Clients Récemment Ajoutés</h3>
            <button className="ad-btn-link" onClick={() => navigate('/admin/gestion-clients')}>
              Gérer les clients →
            </button>
          </div>
          <div className="ad-card-body">
            {loading ? (
              <div className="ad-loading-placeholder">Chargement...</div>
            ) : recentClients.length === 0 ? (
              <div className="ad-empty-state">Aucun client enregistré pour le moment.</div>
            ) : (
              <div className="ad-table-responsive">
                <table className="ad-dashboard-table">
                  <thead>
                    <tr>
                      <th>Entreprise</th>
                      <th>Contact</th>
                      <th>Abonnement</th>
                      <th>Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentClients.map(client => (
                      <tr key={client.id}>
                        <td>
                          <div className="ad-company-cell">
                            <span className="ad-company-avatar">
                              {client.company_name ? client.company_name.substring(0, 2).toUpperCase() : 'CL'}
                            </span>
                            <div>
                              <span className="ad-company-name">{client.company_name || 'N/A'}</span>
                              <span className="ad-company-email">{client.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="ad-contact-name">{client.nom || '—'}</span>
                        </td>
                        <td>
                          <span className={`ad-sub-badge ${client.subscription_type ? client.subscription_type.toLowerCase() : 'standard'}`}>
                            {client.subscription_type || 'Standard'}
                          </span>
                        </td>
                        <td>
                          <span className={`ad-status-dot-badge ${client.is_active ? 'active' : 'inactive'}`}>
                            <span className="dot"></span>
                            {client.is_active ? 'Actif' : 'Suspendu'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR WIDGETS */}
        <div className="ad-dashboard-sidebar-column">
          {/* SUBSCRIPTION RATIO */}
          <div className="ad-card ad-sub-card">
            <h3>Distribution des Abonnements</h3>
            <div className="ad-sub-distribution">
              {loading ? (
                <div className="ad-loading-placeholder">Chargement...</div>
              ) : totalClients === 0 ? (
                <div className="ad-empty-state">Pas de données</div>
              ) : (
                <div className="ad-distribution-content">
                  {/* Visual Stacked Progress Bar */}
                  <div className="ad-stacked-bar">
                    {standardPercentage > 0 && (
                      <div className="ad-bar-segment standard" style={{ width: `${standardPercentage}%` }} title={`Standard: ${standardSubs} (${standardPercentage}%)`}></div>
                    )}
                    {premiumPercentage > 0 && (
                      <div className="ad-bar-segment premium" style={{ width: `${premiumPercentage}%` }} title={`Premium: ${premiumSubs} (${premiumPercentage}%)`}></div>
                    )}
                    {otherPercentage > 0 && (
                      <div className="ad-bar-segment other" style={{ width: `${otherPercentage}%` }} title={`Autre: ${otherSubs} (${otherPercentage}%)`}></div>
                    )}
                  </div>

                  {/* Legend */}
                  <div className="ad-distribution-legend">
                    <div className="legend-item">
                      <span className="legend-dot standard"></span>
                      <span className="legend-label">Standard</span>
                      <span className="legend-count">{standardSubs} ({standardPercentage}%)</span>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot premium"></span>
                      <span className="legend-label">Premium</span>
                      <span className="legend-count">{premiumSubs} ({premiumPercentage}%)</span>
                    </div>
                    {otherSubs > 0 && (
                      <div className="legend-item">
                        <span className="legend-dot other"></span>
                        <span className="legend-label">Autres</span>
                        <span className="legend-count">{otherSubs} ({otherPercentage}%)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* PENDING PASSWORD RESETS */}
          <div className="ad-card ad-resets-card">
            <h3>Demandes de réinitialisation</h3>
            <div className="ad-card-body">
              {loading ? (
                <div className="ad-loading-placeholder">Chargement...</div>
              ) : recentResets.length === 0 ? (
                <div className="ad-empty-state-check">
                  <div className="check-icon">✓</div>
                  <p>Aucune demande de réinitialisation de mot de passe en attente.</p>
                </div>
              ) : (
                <div className="ad-resets-list">
                  {recentResets.map(req => (
                    <div className="ad-reset-item" key={req.id}>
                      <div className="ad-reset-item-info">
                        <span className="ad-reset-email" title={req.email}>{req.email}</span>
                        <span className="ad-reset-time">
                          {new Date(req.created_at).toLocaleDateString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <button
                        className="ad-btn-action-treat"
                        onClick={() => navigate('/admin/gestion-clients?tab=requests')}
                      >
                        Traiter
                      </button>
                    </div>
                  ))}
                  {pendingResets > 5 && (
                    <button className="ad-view-all-resets" onClick={() => navigate('/admin/gestion-clients?tab=requests')}>
                      Voir les {pendingResets} demandes en attente
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
