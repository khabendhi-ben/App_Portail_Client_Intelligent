import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AdminMonitoringIA.css';
import '../SuperAdmin/SuperAdminTable.css';

const AdminMonitoringIA = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Client sélectionné pour afficher ses sessions
  const [selectedClient, setSelectedClient] = useState(null);
  // Détail de la conversation sélectionnée
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Charger les conversations depuis le backend
  const fetchConversations = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm.trim()) params.client_search = searchTerm;
      if (startDate) params.start_date = new Date(startDate).toISOString();
      if (endDate) params.end_date = new Date(endDate).toISOString();

      const res = await api.get('/ai/admin/conversations', { params });
      setConversations(res.data);
    } catch (err) {
      console.error("Erreur de chargement des conversations de supervision:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchConversations();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setStartDate('');
    setEndDate('');
    setLoading(true);
    api.get('/ai/admin/conversations')
      .then(res => setConversations(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  // Regrouper les sessions par client (Email unique)
  const getGroupedClients = () => {
    const grouped = [];
    conversations.forEach(conv => {
      let client = grouped.find(c => c.email === conv.email_client);
      if (!client) {
        client = {
          email: conv.email_client,
          nom: conv.nom_client || 'Sans nom',
          entreprise: conv.entreprise_client || 'N/A',
          sessions: []
        };
        grouped.push(client);
      }
      client.sessions.push(conv);
    });

    // Trier par date de la session la plus récente
    return grouped.map(client => {
      const sortedSessions = [...client.sessions].sort(
        (a, b) => new Date(b.started_at) - new Date(a.started_at)
      );
      const totalMessages = client.sessions.reduce((sum, s) => sum + s.message_count, 0);
      const lastActivity = sortedSessions[0]?.started_at;
      return {
        ...client,
        sessions: sortedSessions,
        total_messages: totalMessages,
        last_activity: lastActivity
      };
    }).sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity));
  };

  // Charger les messages d'une conversation spécifique
  const handleSelectConversation = async (conv) => {
    setSelectedConv(conv);
    setLoadingMessages(true);
    try {
      const res = await api.get(`/ai/admin/conversations/${conv.id}/messages`);
      // Tri par ID pour l'ordre chronologique
      const sorted = [...res.data].sort((a, b) => a.id - b.id);
      setMessages(sorted);
    } catch (err) {
      console.error("Erreur de chargement des messages de la conversation:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedClient(null);
    setSelectedConv(null);
    setMessages([]);
  };

  const groupedClients = getGroupedClients();

  return (
    <div className="sa-page-content admin-monitoring-container">
      {/* SECTION FILTRES STYLE LOGS */}
      <div className="sa-logs-filters" style={{ marginBottom: '1.5rem' }}>
        <input
          type="text"
          placeholder="Nom, email ou entreprise..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && fetchConversations()}
        />
        
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          placeholder="Du"
        />

        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          placeholder="Au"
        />

        <div className="sa-logs-filter-actions">
          <button className="sa-logs-filter-btn" onClick={fetchConversations}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            Filtrer
          </button>
          <button className="sa-logs-reset-btn" onClick={handleResetFilters}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10"></polyline>
              <polyline points="1 20 1 14 7 14"></polyline>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
            Actualiser
          </button>
        </div>
      </div>

      {/* SECTION TABLEAU UNIFIÉ */}
      <div className="sa-card">
        {loading ? (
          <div className="monitoring-loading-state">
            <div className="spinner"></div>
            <div style={{ padding: '1rem' }}>
              <div className="skeleton skeleton-row"></div>
              <div className="skeleton skeleton-row"></div>
              <div className="skeleton skeleton-row"></div>
            </div>
          </div>
        ) : groupedClients.length === 0 ? (
          <div className="monitoring-empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <h3>Aucun client trouvé</h3>
            <p>Aucune conversation enregistrée avec ces critères.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table className="sa-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Entreprise</th>
                  <th>Dernière activité</th>
                  <th>Sessions de chat</th>
                  <th>Nombre total d'échanges</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {groupedClients.map(client => (
                  <tr key={client.email} className={selectedClient?.email === client.email ? 'row-selected' : ''}>
                    <td>
                      <div className="client-cell-info">
                        <span className="client-cell-name">{client.nom}</span>
                        <span className="client-cell-email">{client.email}</span>
                      </div>
                    </td>
                    <td>
                      <span className="client-company-badge">
                        {client.entreprise}
                      </span>
                    </td>
                    <td>
                      {client.last_activity ? new Date(client.last_activity).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      }) : '—'}
                    </td>
                    <td>
                      <span className="exchange-count-badge" style={{ backgroundColor: '#f1f5f9', color: '#475569' }}>
                        {client.sessions.length} {client.sessions.length > 1 ? 'sessions' : 'session'}
                      </span>
                    </td>
                    <td>
                      <span className="exchange-count-badge">
                        {client.total_messages} {client.total_messages > 1 ? 'messages' : 'message'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="sa-logs-filter-btn"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', display: 'inline-flex' }}
                        onClick={() => setSelectedClient(client)}
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

      {/* PANNEAU LATÉRAL (DRAWER) DE VISUALISATION */}
      {selectedClient && (
        <div className="monitoring-drawer-overlay" onClick={handleCloseDrawer}>
          <div className="monitoring-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-header-title">
                <h3>{selectedConv ? `Discussion #${selectedConv.id}` : 'Sessions de discussion'}</h3>
                <span className="drawer-client-name">
                  {selectedClient.nom} ({selectedClient.entreprise})
                </span>
              </div>
              <button className="btn-close-drawer" onClick={handleCloseDrawer}>
                &times;
              </button>
            </div>

            <div className="drawer-body">
              {/* Si aucune session spécifique n'est sélectionnée, on montre la liste des sessions du client */}
              {!selectedConv ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem' }}>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.5rem' }}>Sélectionnez une session pour voir l'historique des messages :</p>
                  {selectedClient.sessions.map(session => (
                    <div 
                      key={session.id} 
                      className="session-list-item"
                      onClick={() => handleSelectConversation(session)}
                      style={{
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px',
                        padding: '1rem',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.borderColor = '#2e6b6b'}
                      onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e2e8f0'}
                    >
                      <div>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem', color: '#1e293b' }}>
                          Session #{session.id}
                        </p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#94a3b8' }}>
                          Commencée le {new Date(session.started_at).toLocaleDateString('fr-FR', {
                            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                      <span className="exchange-count-badge">
                        {session.message_count} {session.message_count > 1 ? 'messages' : 'message'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                // Si une session est sélectionnée, on montre les messages de cette session
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <button 
                    onClick={() => { setSelectedConv(null); setMessages([]); }}
                    style={{
                      alignSelf: 'flex-start',
                      background: 'none',
                      border: 'none',
                      color: '#2e6b6b',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px',
                      marginBottom: '1rem',
                      fontSize: '0.85rem'
                    }}
                  >
                    &larr; Retour aux sessions
                  </button>

                  {loadingMessages ? (
                    <div className="drawer-loading-state">
                      <div className="spinner"></div>
                      <div style={{ padding: '1rem' }}>
                        <div className="skeleton skeleton-row" style={{ height: '60px' }}></div>
                        <div className="skeleton skeleton-row" style={{ height: '80px', width: '80%', alignSelf: 'flex-end' }}></div>
                      </div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="drawer-empty-state">
                      <p>Aucun message dans cette discussion.</p>
                    </div>
                  ) : (
                    <div className="drawer-chat-history">
                      {messages.map(msg => (
                        <div key={msg.id} className={`drawer-msg-item ${msg.sender === 'user' ? 'user-msg' : 'ai-msg'}`}>
                          {msg.sender !== 'user' && (
                            <div className="drawer-avatar">
                              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                                <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                                <line x1="12" y1="22.08" x2="12" y2="12"></line>
                              </svg>
                            </div>
                          )}
                          <div className="drawer-msg-wrapper">
                            <div className="drawer-msg-bubble">
                              {msg.content}
                            </div>
                            <span className="drawer-msg-time">
                              {new Date(msg.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMonitoringIA;
