import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../../services/api';
import './ClientAssistant.css';
import './ClientDashboard.css'; // Pour réutiliser le style de la modale overlay et de la card modale

const ClientAssistant = () => {
  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [openDeleteMenuId, setOpenDeleteMenuId] = useState(null);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deleteTargetConvId, setDeleteTargetConvId] = useState(null);
  const messagesEndRef = useRef(null);

  // Charger l'historique des discussions
  const loadConversations = async (shouldSetInitial = true) => {
    try {
      const res = await api.get('/ai/conversations');
      setConversations(res.data);
      if (shouldSetInitial && res.data.length > 0) {
        setActiveConvId(res.data[0].id);
        setMessages(res.data[0].messages || []);
      }
    } catch (err) {
      console.error("Erreur de chargement des discussions:", err);
    }
  };

  useEffect(() => {
    // Par défaut, on charge l'historique dans la barre latérale MAIS on ne l'ouvre pas
    // L'utilisateur arrivera toujours sur un écran "Nouvelle discussion" vierge
    loadConversations(false);
  }, []);

  // Fermer le menu de suppression lors d'un clic en dehors
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('.discussion-actions-btn') && !e.target.closest('.discussion-actions-dropdown')) {
        setOpenDeleteMenuId(null);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleDeleteConversationClick = (convId) => {
    setDeleteTargetConvId(convId);
    setShowDeleteConfirmModal(true);
    setOpenDeleteMenuId(null);
  };

  const confirmDeleteConversation = async () => {
    if (!deleteTargetConvId) return;
    try {
      await api.delete(`/ai/conversations/${deleteTargetConvId}`);
      setShowDeleteConfirmModal(false);
      setDeleteTargetConvId(null);
      await loadConversations(false);
      if (activeConvId === deleteTargetConvId) {
        handleNewConversation();
      }
    } catch (err) {
      console.error("Erreur de suppression de la discussion:", err);
      alert("Une erreur est survenue lors de la suppression de la discussion.");
    }
  };

  // Défiler vers le bas automatiquement
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSelectConversation = (convId) => {
    const selected = conversations.find(c => c.id === convId);
    if (selected) {
      setActiveConvId(convId);
      setMessages(selected.messages || []);
    }
  };

  const handleNewConversation = () => {
    setActiveConvId(null);
    setMessages([]);
  };

  const handleSendMessage = async (e, textOverride = null) => {
    if (e) e.preventDefault();
    const textToSend = textOverride || inputMessage;
    if (!textToSend.trim() || isLoading) return;

    const userText = textToSend;
    setInputMessage('');

    const newUserMessage = { id: Date.now(), sender: 'user', content: userText };
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);

    // Ajouter un message d'attente pour l'assistant (qui se remplira au fur et à mesure)
    const aiMessageId = Date.now() + 1;
    const placeholderMsg = { id: aiMessageId, sender: 'assistant', content: '' };
    setMessages(prev => [...prev, placeholderMsg]);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userText,
          conversation_id: activeConvId
        })
      });

      if (!response.ok) {
        throw new Error("Erreur de connexion au serveur de chat");
      }

      // Récupérer le header X-Conversation-Id pour les nouvelles discussions
      const newConvIdHeader = response.headers.get('X-Conversation-Id');
      const returnedConvId = newConvIdHeader ? parseInt(newConvIdHeader, 10) : null;

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let done = false;
      let accumulatedText = '';
      let firstChunk = true;

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        if (value) {
          const chunk = decoder.decode(value, { stream: !done });
          accumulatedText += chunk;
          
          if (firstChunk) {
            setIsLoading(false);
            firstChunk = false;
          }

          let textToRender = accumulatedText;
          let parsedSuggestions = null;
          if (accumulatedText.includes('__SUGGESTIONS__')) {
            const parts = accumulatedText.split('__SUGGESTIONS__');
            textToRender = parts[0];
            try {
              parsedSuggestions = JSON.parse(parts[1]);
            } catch (err) {
              // json in progress
            }
          }

          // Mettre à jour le message de l'assistant en temps réel
          setMessages(prev => prev.map(msg => {
            if (msg.id === aiMessageId) {
              return { ...msg, content: textToRender, suggestions: parsedSuggestions };
            }
            return msg;
          }));
        }
      }

      // Mettre à jour l'ID de conversation actif et recharger la liste latérale
      if (!activeConvId && returnedConvId) {
        setActiveConvId(returnedConvId);
        loadConversations(false);
      } else if (activeConvId) {
        setConversations(prev => prev.map(c => {
          if (c.id === activeConvId) {
            let textToRender = accumulatedText;
            let parsedSuggestions = null;
            if (accumulatedText.includes('__SUGGESTIONS__')) {
              const parts = accumulatedText.split('__SUGGESTIONS__');
              textToRender = parts[0];
              try { parsedSuggestions = JSON.parse(parts[1]); } catch (err) {}
            }
            return {
              ...c,
              messages: [...(c.messages || []), newUserMessage, { id: aiMessageId, sender: 'assistant', content: textToRender, suggestions: parsedSuggestions }]
            };
          }
          return c;
        }));
      }

    } catch (err) {
      console.error("Erreur de streaming:", err);
      setIsLoading(false);
      // Remplacer le message vide par une erreur
      setMessages(prev => prev.map(msg => {
        if (msg.id === aiMessageId) {
          return {
            ...msg,
            content: "Désolé, je rencontre des difficultés techniques pour me connecter au modèle d'entreprise Mistral."
          };
        }
        return msg;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const getConversationTitle = (conv) => {
    if (!conv.messages || conv.messages.length === 0) {
      return `Discussion #${conv.id}`;
    }
    const firstUserMsg = conv.messages.find(m => m.sender === 'user');
    if (firstUserMsg) {
      const content = firstUserMsg.content;
      return content.length > 25 ? content.substring(0, 25) + '...' : content;
    }
    return `Discussion #${conv.id}`;
  };

  return (
    <div className="client-assistant-wrapper">
      {/* Sidebar - Historique (Design plus simple, clair) */}
      <div className="assistant-sidebar">
        <button className="btn-new-discussion" onClick={handleNewConversation}>
          + Nouvelle discussion
        </button>
        <div className="discussion-items-list">
          {conversations.map(conv => (
            <div
              key={conv.id}
              className={`discussion-item ${activeConvId === conv.id ? 'active' : ''}`}
              onClick={() => handleSelectConversation(conv.id)}
            >
              <span className="discussion-item-icon"></span>
              <div className="discussion-item-info">
                <span className="discussion-item-title">{getConversationTitle(conv)}</span>
                <span className="discussion-item-date">
                  {new Date(conv.started_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                </span>
              </div>
              <button 
                className="discussion-actions-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenDeleteMenuId(openDeleteMenuId === conv.id ? null : conv.id);
                }}
                title="Options"
              >
                &#8942;
              </button>
              {openDeleteMenuId === conv.id && (
                <div className="discussion-actions-dropdown" onClick={(e) => e.stopPropagation()}>
                  <button 
                    onClick={() => handleDeleteConversationClick(conv.id)}
                    className="discussion-actions-delete"
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Zone de Chat (Design épuré type "Card" blanche de la capture 2) */}
      <div className="assistant-chat-card">
        <div className="chat-card-header">
          <h2>Assistant IA</h2>
        </div>

        <div className="chat-card-body">
          {messages.length === 0 ? (
            <div className="chat-empty-state">
              <div className="chat-bot-avatar">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2a10 10 0 0 1 10 10v1a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3v-1A10 10 0 0 1 12 2z" />
                  <path d="M12 18v4" />
                  <path d="M4.93 19.07l1.41-1.41" />
                  <path d="M19.07 19.07l-1.41-1.41" />
                  <circle cx="9" cy="11" r="1" />
                  <circle cx="15" cy="11" r="1" />
                </svg>
              </div>
              <div className="chat-bubble ai-bubble">
                Bonjour ! Je suis votre assistant virtuel Le Matin. Comment puis-je vous aider aujourd'hui ?
              </div>
            </div>
          ) : (
            messages.filter(msg => msg.content !== '').map(msg => (
              <div key={msg.id} className={`message-item-container ${msg.sender === 'user' ? 'user-message' : 'ai-message'}`}>
                {msg.sender !== 'user' && (
                  <div className="chat-bot-avatar">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                  </div>
                )}
                <div className="message-wrapper">
                  <div className={`chat-bubble ${msg.sender === 'user' ? 'user-bubble' : 'ai-bubble'}`}>
                    {msg.sender === 'user' ? (
                      msg.content
                    ) : (
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    )}
                  </div>
                  {/* Petit horodatage optionnel */}
                  <span className="message-time">
                    {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'}) : new Date().toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  
                  {/* Suggestions Automatiques */}
                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="chat-suggestions-container">
                      <span className="suggestions-title">Sujets associés :</span>
                      <div className="suggestions-buttons">
                        {msg.suggestions.map((sug, idx) => (
                          <button key={idx} className="btn-chat-suggestion" onClick={() => handleSendMessage(null, sug)}>
                            {sug}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {/* Loader : L'IA réfléchit... */}
          {isLoading && (
            <div className="message-item-container ai-message">
              <div className="chat-bot-avatar">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                  <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                  <line x1="12" y1="22.08" x2="12" y2="12"></line>
                </svg>
              </div>
              <div className="message-wrapper">
                <div className="chat-bubble ai-bubble loading-state">
                  <span>L'IA réfléchit</span>
                  <span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Barre de saisie style "Tapez votre message..." + Bouton Envoyer de la capture 2 */}
        <form className="chat-card-footer" onSubmit={handleSendMessage}>
          <input
            type="text"
            placeholder="Tapez votre message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={isLoading}
          />
          <button type="submit" disabled={!inputMessage.trim() || isLoading}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="send-icon">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
            Envoyer
          </button>
        </form>
      </div>

      {/* Modale de confirmation de suppression personnalisée */}
      {showDeleteConfirmModal && (
        <div className="client-modal-overlay">
          <div className="client-modal" style={{ maxWidth: '400px', textAlign: 'center' }}>
            <div className="client-modal-body" style={{ padding: '2.5rem 1.5rem', alignItems: 'center', gap: '1.2rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#fee2e2',
                color: '#d93025',
                fontSize: '2.2rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                marginBottom: '8px',
                lineHeight: '60px'
              }}>
                !
              </div>
              <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#0f172a', fontWeight: '700' }}>
                Supprimer la discussion
              </h3>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569', lineHeight: '1.5' }}>
                Voulez-vous vraiment masquer cette discussion de votre historique ?
              </p>
            </div>
            <div className="client-modal-footer" style={{ gap: '10px', justifyContent: 'center', width: '100%', padding: '0 1.5rem 1.5rem 1.5rem', boxSizing: 'border-box' }}>
              <button 
                type="button" 
                className="client-btn-pagination" 
                onClick={() => { setShowDeleteConfirmModal(false); setDeleteTargetConvId(null); }}
                style={{ border: '1px solid #cbd5e1', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', background: 'white', fontWeight: '500' }}
              >
                Annuler
              </button>
              <button 
                type="button" 
                className="client-btn-modal-close" 
                onClick={confirmDeleteConversation}
                style={{ background: '#d93025', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientAssistant;