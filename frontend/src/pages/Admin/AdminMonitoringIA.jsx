import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './AdminMonitoringIA.css';

const AdminMonitoringIA = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
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
    // On appelle directement avec des filtres vides
    setLoading(true);
    api.get('/ai/admin/conversations')
      .then(res => setConversations(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  // Charger les messages d'une conversation spécifique
  const handleSelectConversation = async (conv) => {
    setSelectedConv(conv);
    setLoadingMessages(true);
    try {
      const res = await api.get(`/ai/admin/conversations/${conv.id}/messages`);
      setMessages(res.data);
    } catch (err) {
      console.error("Erreur de chargement des messages de la conversation:", err);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCloseDrawer = () => {
    setSelectedConv(null);
    setMessages([]);
  };

  return (
    <div className="sa-page-content admin-monitoring-container">
      {/* SECTION FILTRES */}
      <div className="monitoring-filters-card">
        <form onSubmit={handleSearchSubmit} className="monitoring-filters-form">
          <div className="filter-group search-group">
            <label htmlFor="search">Rechercher un client</label>
            <input
              type="text"
              id="search"
              placeholder="Nom, email ou entreprise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-group date-group">
            <label htmlFor="startDate">Du</label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="filter-group date-group">
            <label htmlFor="endDate">Au</label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          <div className="filter-actions">
            <button type="submit" className="btn-filter-submit">
              Filtrer
            </button>
            <button type="button" className="btn-filter-reset" onClick={handleResetFilters}>
              Réinitialiser
            </button>
          </div>
        </form>
      </div>

      {/* SECTION TABLEAU */}
      <div className="monitoring-table-card">
        {loading ? (
          <div className="monitoring-loading-state">
            <div className="spinner"></div>
            <p>Chargement des conversations...</p>
          </div>
        ) : conversations.length === 0 ? (
          <div className="monitoring-empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <h3>Aucune discussion trouvée</h3>
            <p>Aucun client n'a démarré de discussion correspondant à ces critères.</p>
          </div>
        ) : (
          <div className="monitoring-table-wrapper">
            <table className="monitoring-table">
              <thead>
                <tr>
                  <th>Client</th>
                  <th>Entreprise</th>
                  <th>Date de début</th>
                  <th>Nombre d'échanges</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map(conv => (
                  <tr key={conv.id} className={selectedConv?.id === conv.id ? 'row-selected' : ''}>
                    <td>
                      <div className="client-cell-info">
                        <span className="client-cell-name">{conv.nom_client || 'Sans nom'}</span>
                        <span className="client-cell-email">{conv.email_client}</span>
                      </div>
                    </td>
                    <td>
                      <span className="client-company-badge">
                        {conv.entreprise_client || 'N/A'}
                      </span>
                    </td>
                    <td>
                      {new Date(conv.started_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td>
                      <span className="exchange-count-badge">
                        {conv.message_count} {conv.message_count > 1 ? 'messages' : 'message'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn-view-discussion"
                        onClick={() => handleSelectConversation(conv)}
                      >
                        Consulter la discussion
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
      {selectedConv && (
        <div className="monitoring-drawer-overlay" onClick={handleCloseDrawer}>
          <div className="monitoring-drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div className="drawer-header-title">
                <h3>Discussion #{selectedConv.id}</h3>
                <span className="drawer-client-name">
                  {selectedConv.nom_client || 'Client'} ({selectedConv.entreprise_client || 'N/A'})
                </span>
              </div>
              <button className="btn-close-drawer" onClick={handleCloseDrawer}>
                &times;
              </button>
            </div>

            <div className="drawer-body">
              {loadingMessages ? (
                <div className="drawer-loading-state">
                  <div className="spinner"></div>
                  <p>Chargement des messages...</p>
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
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminMonitoringIA;
