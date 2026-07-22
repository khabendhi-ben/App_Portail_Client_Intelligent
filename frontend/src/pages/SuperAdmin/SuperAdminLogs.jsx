import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import './SuperAdminLogs.css';

const SuperAdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // États "brouillon" pour les filtres
  const [draftAction, setDraftAction] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftIp, setDraftIp] = useState('');
  const [draftSeverity, setDraftSeverity] = useState('');
  const [draftDate, setDraftDate] = useState('');

  // États "actifs" pour les filtres
  const [actionFilter, setActionFilter] = useState('');
  const [userEmailFilter, setUserEmailFilter] = useState('');
  const [ipFilter, setIpFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Utilisateur sélectionné pour le détail des logs (dans le drawer)
  const [selectedUser, setSelectedUser] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const toastRef = useRef(null);

  const showToast = (message, type = 'success') => {
    if (toastRef.current) clearTimeout(toastRef.current);
    setToast({ show: true, message, type });
    toastRef.current = setTimeout(() => setToast(p => ({ ...p, show: false })), 4000);
  };

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (actionFilter) params.append('action', actionFilter);
      if (userEmailFilter) params.append('user_email', userEmailFilter);
      if (ipFilter) params.append('ip', ipFilter);
      if (severityFilter) params.append('severity', severityFilter);
      if (dateFilter) params.append('date', dateFilter);
      params.append('limit', '500'); // Augmenter la limite pour un meilleur regroupement

      const res = await api.get(`/users/logs?${params.toString()}`);
      setLogs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [actionFilter, userEmailFilter, ipFilter, severityFilter, dateFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleFilter = () => {
    setActionFilter(draftAction);
    setUserEmailFilter(draftEmail);
    setIpFilter(draftIp);
    setSeverityFilter(draftSeverity);
    setDateFilter(draftDate);
  };

  const handleReset = () => {
    setDraftAction('');
    setDraftEmail('');
    setDraftIp('');
    setDraftSeverity('');
    setDraftDate('');
    setActionFilter('');
    setUserEmailFilter('');
    setIpFilter('');
    setSeverityFilter('');
    setDateFilter('');
  };

  const handleBlockAccount = async (email) => {
    if (!email) return;
    if (!window.confirm(`Voulez-vous vraiment bloquer le compte de "${email}" ?`)) return;

    try {
      const allClients = await api.get('/clients/');
      const client = allClients.data.find(c => c.email === email);
      if (!client) {
        showToast("Impossible de trouver le compte de cet utilisateur.", "error");
        return;
      }
      await api.put(`/clients/${client.id}/deactivate`);
      showToast(`Compte de ${email} bloqué avec succès.`, 'success');
      
      // Mettre à jour l'état local du drawer si besoin
      if (selectedUser && selectedUser.email === email) {
        setSelectedUser(prev => ({ ...prev, isBlocked: true }));
      }
    } catch (err) {
      console.error(err);
      showToast("Erreur lors du blocage du compte.", "error");
    }
  };

  // Regrouper les journaux système par utilisateur
  const getGroupedLogs = () => {
    const grouped = [];
    logs.forEach(log => {
      const emailKey = log.user_email || 'anonymous';
      let userGroup = grouped.find(g => g.email === emailKey);
      if (!userGroup) {
        userGroup = {
          email: log.user_email || null,
          nom: log.user_nom || (log.user_email ? 'Utilisateur sans nom' : 'Visiteur Anonyme'),
          actions: []
        };
        grouped.push(userGroup);
      }
      userGroup.actions.push(log);
    });

    // Trier et enrichir chaque groupe
    return grouped.map(group => {
      const sortedActions = [...group.actions].sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
      const lastAction = sortedActions[0];
      return {
        ...group,
        actions: sortedActions,
        total_actions: group.actions.length,
        last_action_name: lastAction?.action || '—',
        last_action_date: lastAction?.timestamp || null,
        last_ip: lastAction?.ip_address || '—'
      };
    }).sort((a, b) => new Date(b.last_action_date) - new Date(a.last_action_date));
  };

  const getActionClass = (action) => {
    if (!action) return 'action-neutral';
    const act = action.toUpperCase();
    if (act.includes('REUSSIE') || act.includes('CREATION') || act.includes('ACTIVATION')) {
      return 'action-success'; // Vert
    }
    if (act.includes('ECHEC') || act.includes('SUPPRESSION') || act.includes('BLOCAGE')) {
      return 'action-danger';  // Rouge
    }
    if (act.includes('DESACTIVATION') || act.includes('MODIFICATION') || act.includes('UPDATE') || act.includes('REINITIALISATION')) {
      return 'action-warning'; // Orange / Jaune
    }
    return 'action-neutral';
  };

  const formatDate = (ts) => {
    if (!ts) return '-';
    const d = new Date(ts);
    return d.toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const getSeverityClass = (sev) => {
    if (!sev) return 'badge-info';
    switch (sev.toUpperCase()) {
      case 'ERROR': return 'badge-error';
      case 'WARNING': return 'badge-warning';
      default: return 'badge-info';
    }
  };

  const getSeverityLabel = (sev) => {
    if (!sev) return 'INFO';
    switch (sev.toUpperCase()) {
      case 'ERROR': return 'ERROR';
      case 'WARNING': return 'WARNING';
      default: return 'INFO';
    }
  };

  const handleCloseDrawer = () => {
    setSelectedUser(null);
  };

  const groupedLogs = getGroupedLogs();

  return (
    <div className="sa-logs-container">
      {/* En-tête */}
      <div className="sa-logs-header">
        <div className="sa-logs-title-block">
          <h2 className="sa-logs-title">Journaux système</h2>
          <span className="sa-logs-subtitle">Surveillance des activités et événements de sécurité par utilisateur</span>
        </div>
      </div>

      {/* Barre de filtres */}
      <div className="sa-logs-filters">
        <input
          type="text"
          placeholder="Action (ex: CONNEXION...)"
          value={draftAction}
          onChange={(e) => setDraftAction(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
        />
        <input
          type="text"
          placeholder="Email utilisateur"
          value={draftEmail}
          onChange={(e) => setDraftEmail(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
        />
        <input
          type="text"
          placeholder="Adresse IP"
          value={draftIp}
          onChange={(e) => setDraftIp(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleFilter()}
        />
        <select value={draftSeverity} onChange={(e) => setDraftSeverity(e.target.value)}>
          <option value="">Criticité</option>
          <option value="INFO">🔵 INFO</option>
          <option value="WARNING">🟠 WARNING</option>
          <option value="ERROR">🔴 ERROR</option>
        </select>
        <input
          type="date"
          value={draftDate}
          onChange={(e) => setDraftDate(e.target.value)}
        />
        <div className="sa-logs-filter-actions">
          <button className="sa-logs-filter-btn" onClick={handleFilter}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Filtrer
          </button>
          <button className="sa-logs-reset-btn" onClick={handleReset}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      {/* Tableau regroupé par utilisateur */}
      <div className="sa-logs-card">
        {loading ? (
          <div style={{ padding: '1.5rem' }}>
            <div className="skeleton skeleton-row"></div>
            <div className="skeleton skeleton-row"></div>
            <div className="skeleton skeleton-row"></div>
            <div className="skeleton skeleton-row"></div>
          </div>
        ) : groupedLogs.length === 0 ? (
          <div className="sa-logs-empty">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <p>Aucune activité trouvée avec ces critères.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="sa-logs-table">
              <thead>
                <tr>
                  <th>Utilisateur</th>
                  <th>Dernière Action</th>
                  <th>Date & Heure</th>
                  <th>Nombre d'activités</th>
                  <th>Dernière adresse IP</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {groupedLogs.map((group) => (
                  <tr key={group.email || 'anonymous'} className="sa-logs-row">
                    <td>
                      <div className="sa-logs-user">
                        <div className="sa-logs-user-avatar" style={{ backgroundColor: group.email ? '#2e6b6b' : '#64748b' }}>
                          {group.nom.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="sa-logs-user-name">{group.nom}</span>
                          <span className="sa-logs-user-email">{group.email || 'Pas d\'adresse email'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`sa-logs-action-tag ${getActionClass(group.last_action_name)}`}>{group.last_action_name}</span>
                    </td>
                    <td className="sa-logs-date">{formatDate(group.last_action_date)}</td>
                    <td>
                      <span className="sa-severity-badge badge-info" style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem' }}>
                        {group.total_actions} {group.total_actions > 1 ? 'activités' : 'activité'}
                      </span>
                    </td>
                    <td>
                      <code className="sa-logs-ip">{group.last_ip}</code>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button 
                        className="sa-logs-filter-btn" 
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                        onClick={() => setSelectedUser(group)}
                      >
                        Consulter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PANNEAU LATÉRAL (DRAWER) DE L'HISTORIQUE DE L'UTILISATEUR */}
      {selectedUser && (
        <div className="monitoring-drawer-overlay" onClick={handleCloseDrawer}>
          <div className="monitoring-drawer" onClick={(e) => e.stopPropagation()} style={{ width: '500px' }}>
            <div className="drawer-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9' }}>
              <div className="drawer-header-title">
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1e293b' }}>Historique des activités</h3>
                <span className="drawer-client-name" style={{ fontSize: '0.85rem', color: '#64748b' }}>
                  {selectedUser.nom} {selectedUser.email ? `(${selectedUser.email})` : ''}
                </span>
              </div>
              <button className="btn-close-drawer" onClick={handleCloseDrawer} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#94a3b8' }}>
                &times;
              </button>
            </div>

            <div className="drawer-body" style={{ padding: '1.5rem', overflowY: 'auto', height: 'calc(100% - 80px)' }}>
              {selectedUser.email && (
                <button
                  className="sa-logs-dropdown-item danger"
                  onClick={() => handleBlockAccount(selectedUser.email)}
                  style={{
                    width: '100%',
                    padding: '0.65rem',
                    borderRadius: '8px',
                    border: '1px solid #fee2e2',
                    backgroundColor: '#fef2f2',
                    color: '#b91c1c',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '1.5rem',
                    fontSize: '0.85rem'
                  }}
                >
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                  </svg>
                  Bloquer ce compte utilisateur
                </button>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {selectedUser.actions.map((action) => (
                  <div 
                    key={action.id} 
                    style={{
                      borderLeft: `3px solid ${action.severity === 'ERROR' ? '#ef4444' : action.severity === 'WARNING' ? '#f59e0b' : '#3b82f6'}`,
                      paddingLeft: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className={`sa-severity-badge ${getSeverityClass(action.severity)}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.4rem' }}>
                        {getSeverityLabel(action.severity)}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        {formatDate(action.timestamp)}
                      </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '4px 0' }}>
                      <span className={`sa-logs-action-tag ${getActionClass(action.action)}`} style={{ fontSize: '0.7rem', padding: '2px 6px' }}>
                        {action.action}
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>
                      {action.details || 'Aucun détail fourni.'}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Adresse IP :</span>
                      <code style={{ fontSize: '0.75rem', color: '#475569', background: '#f1f5f9', padding: '1px 4px', borderRadius: '4px' }}>
                        {action.ip_address || '—'}
                      </code>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={`sa-logs-toast ${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
};

export default SuperAdminLogs;
