import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../services/api';
import './SuperAdminLogs.css';

const SuperAdminLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // États "brouillon" : ce que l'utilisateur est en train de taper
  const [draftAction, setDraftAction] = useState('');
  const [draftEmail, setDraftEmail] = useState('');
  const [draftIp, setDraftIp] = useState('');
  const [draftSeverity, setDraftSeverity] = useState('');
  const [draftDate, setDraftDate] = useState('');

  // États "actifs" : ce qui est réellement envoyé à l'API
  const [actionFilter, setActionFilter] = useState('');
  const [userEmailFilter, setUserEmailFilter] = useState('');
  const [ipFilter, setIpFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  const [openMenuId, setOpenMenuId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const menuRefs = useRef({});
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
      params.append('limit', '200');

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

  // Déclenché par le bouton "Filtrer"
  const handleFilter = () => {
    setActionFilter(draftAction);
    setUserEmailFilter(draftEmail);
    setIpFilter(draftIp);
    setSeverityFilter(draftSeverity);
    setDateFilter(draftDate);
  };

  // Fermer le menu si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      const isInsideAny = Object.values(menuRefs.current).some(
        (ref) => ref && ref.contains(e.target)
      );
      if (!isInsideAny) setOpenMenuId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const handleBlockAccount = async (log) => {
    if (!log.user_email) return;
    if (!window.confirm(`Voulez-vous vraiment bloquer le compte de "${log.user_email}" ?`)) return;

    try {
      // Trouver le client via son email puis le désactiver
      const allClients = await api.get('/clients/');
      const client = allClients.data.find(c => c.email === log.user_email);
      if (!client) {
        showToast("Impossible de trouver le compte de cet utilisateur.", "error");
        return;
      }
      await api.put(`/clients/${client.id}/deactivate`);
      showToast(`Compte de ${log.user_email} bloqué avec succès.`, 'success');
      setOpenMenuId(null);
    } catch (err) {
      console.error(err);
      showToast("Erreur lors du blocage du compte.", "error");
    }
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
      case 'ERROR': return ' ERROR';
      case 'WARNING': return ' WARNING';
      default: return ' INFO';
    }
  };

  return (
    <div className="sa-logs-container">
      {/* En-tête */}
      <div className="sa-logs-header">
        <div className="sa-logs-title-block">
          <h2 className="sa-logs-title">Journaux système</h2>
          <span className="sa-logs-subtitle">Surveillance en temps réel des activités et anomalies</span>
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

      {/* Tableau */}
      <div className="sa-logs-card">
        {loading ? (
          <div style={{ padding: '1.5rem' }}>
            <div className="skeleton skeleton-row"></div>
            <div className="skeleton skeleton-row"></div>
            <div className="skeleton skeleton-row"></div>
            <div className="skeleton skeleton-row"></div>
            <div className="skeleton skeleton-row"></div>
            <div className="skeleton skeleton-row"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="sa-logs-empty">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
            <p>Aucun journal trouvé avec ces filtres.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="sa-logs-table">
              <thead>
                <tr>
                  <th>Criticité</th>
                  <th>Date & Heure</th>
                  <th>Utilisateur</th>
                  <th>Action</th>
                  <th>Détails</th>
                  <th>Adresse IP</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className={`sa-logs-row severity-${(log.severity || 'INFO').toLowerCase()}`}>
                    <td>
                      <span className={`sa-severity-badge ${getSeverityClass(log.severity)}`}>
                        {getSeverityLabel(log.severity)}
                      </span>
                    </td>
                    <td className="sa-logs-date">{formatDate(log.timestamp)}</td>
                    <td>
                      {log.user_email ? (
                        <div className="sa-logs-user">
                          <div className="sa-logs-user-avatar">
                            {log.user_email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="sa-logs-user-name">{log.user_nom || '—'}</span>
                            <span className="sa-logs-user-email">{log.user_email}</span>
                          </div>
                        </div>
                      ) : (
                        <span className="sa-logs-anon">Anonyme</span>
                      )}
                    </td>
                    <td>
                      <span className="sa-logs-action-tag">{log.action}</span>
                    </td>
                    <td className="sa-logs-details">{log.details || '—'}</td>
                    <td>
                      <code className="sa-logs-ip">{log.ip_address || '—'}</code>
                    </td>
                    <td>
                      {log.user_email && (
                        <div
                          className="sa-logs-menu-wrapper"
                          ref={(el) => { menuRefs.current[log.id] = el; }}
                        >
                          <button
                            className="sa-logs-dots-btn"
                            onClick={() => setOpenMenuId(openMenuId === log.id ? null : log.id)}
                            title="Actions"
                          >
                            ⋮
                          </button>
                          {openMenuId === log.id && (
                            <div className="sa-logs-dropdown">
                              <button
                                className="sa-logs-dropdown-item danger"
                                onClick={() => handleBlockAccount(log)}
                              >
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10"></circle>
                                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                                </svg>
                                Bloquer le compte
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {toast.show && (
        <div className={`sa-logs-toast ${toast.type}`}>{toast.message}</div>
      )}
    </div>
  );
};

export default SuperAdminLogs;
