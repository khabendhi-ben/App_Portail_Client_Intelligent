import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './SuperAdminLLMConfig.css';

const SuperAdminLLMConfig = () => {
  const [config, setConfig] = useState({
    llm_endpoint: '',
    llm_api_key: '',
    llm_model: '',
    llm_system_prompt: ''
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [llmStatus, setLlmStatus] = useState('Chargement...');
  
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchConfig();
    fetchLlmStatus();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await api.get('/ai/superadmin/config');
      setConfig(response.data);
    } catch (err) {
      console.error("Erreur chargement config LLM", err);
      setMessage({ type: 'error', text: 'Impossible de charger la configuration actuelle.' });
    } finally {
      setLoading(false);
    }
  };

  const fetchLlmStatus = async () => {
    try {
      const response = await api.get('/superadmin/stats');
      setLlmStatus(response.data.llm_status);
    } catch (err) {
      setLlmStatus('Hors ligne');
    }
  };

  const handleChange = (e) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });
    try {
      await api.put('/ai/superadmin/config', config);
      setMessage({ type: 'success', text: 'Configuration LLM sauvegardée avec succès.' });
      fetchLlmStatus();
    } catch (err) {
      console.error("Erreur sauvegarde config", err);
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setMessage({ type: '', text: '' });
    try {
      const response = await api.post('/ai/superadmin/test-config', config);
      setMessage({ type: 'success', text: response.data.message });
      setLlmStatus('En ligne');
    } catch (err) {
      console.error("Erreur test config", err);
      const errorMsg = err.response?.data?.detail || err.message;
      setMessage({ type: 'error', text: `Le test a échoué : ${errorMsg}` });
      setLlmStatus('Hors ligne');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="sa-llm-content" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
          <div className="skeleton skeleton-avatar" style={{ width: '80px', height: '80px' }}></div>
          <div style={{ flex: 1 }}>
            <div className="skeleton skeleton-text" style={{ width: '40%', height: '24px' }}></div>
            <div className="skeleton skeleton-text-short"></div>
          </div>
        </div>
        <div className="skeleton skeleton-row"></div>
        <div className="skeleton skeleton-row"></div>
        <div className="skeleton skeleton-row"></div>
      </div>
    );
  }

  return (
    <div className="sa-llm-content">
      <div className="llm-card">
        
        {/* Formulaire de configuration pleine largeur */}
        <div className="llm-form-container" style={{ width: '100%' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem', paddingBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>Configuration du Chatbot IA (LLM)</h2>
            <div className={`llm-status-badge ${llmStatus === 'En ligne' ? 'online' : 'offline'}`}>
              <span className="pulse-dot"></span>
              {llmStatus}
            </div>
          </div>
          
          {message.text && (
            <div className={`sa-llm-alert ${message.type}`} style={{ marginBottom: '2rem' }}>
              {message.text}
            </div>
          )}

          <form onSubmit={handleSave}>
            
            {/* Ligne 1 : Point d'accès API (Full) */}
            <div className="llm-row" style={{ marginBottom: '1.8rem' }}>
              <div className="llm-field full">
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Point d'accès API (Endpoint URL)</label>
                <input 
                  type="text" 
                  name="llm_endpoint" 
                  value={config.llm_endpoint} 
                  onChange={handleChange}
                  placeholder="ex: https://api.mistral.ai/v1/chat/completions"
                  required
                  style={{ padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}
                />
                <small style={{ marginTop: '6px', color: '#64748b', fontSize: '0.78rem', display: 'block' }}>
                  L'URL complète de l'API REST du modèle (Mistral, OpenAI, etc.).
                </small>
              </div>
            </div>

            {/* Ligne 2 : Clé API & Modèle IA (2 colonnes) */}
            <div className="llm-row" style={{ marginBottom: '1.8rem', display: 'flex', gap: '1.5rem' }}>
              <div className="llm-field" style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Clé API (Secrète)</label>
                <input 
                  type="password" 
                  name="llm_api_key" 
                  value={config.llm_api_key} 
                  onChange={handleChange}
                  placeholder="Votre clé API..."
                  style={{ padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}
                />
                <small style={{ marginTop: '6px', color: '#64748b', fontSize: '0.78rem', display: 'block' }}>
                  La clé est chiffrée de manière sécurisée en base de données.
                </small>
              </div>
              
              <div className="llm-field" style={{ flex: 1 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Modèle IA</label>
                <input 
                  type="text" 
                  name="llm_model" 
                  value={config.llm_model} 
                  onChange={handleChange}
                  placeholder="ex: mistral-large-latest"
                  required
                  style={{ padding: '0.65rem 0.85rem', fontSize: '0.85rem' }}
                />
                <small style={{ marginTop: '6px', color: '#64748b', fontSize: '0.78rem', display: 'block' }}>
                  Identifiant du modèle à appeler.
                </small>
              </div>
            </div>

            {/* Ligne 3 : Prompt Système (Full) */}
            <div className="llm-row" style={{ marginBottom: '2rem' }}>
              <div className="llm-field full">
                <label style={{ fontSize: '0.8rem', fontWeight: '600', color: '#475569', marginBottom: '6px' }}>Prompt Système (Comportement)</label>
                <textarea 
                  name="llm_system_prompt" 
                  value={config.llm_system_prompt} 
                  onChange={handleChange}
                  rows="6"
                  placeholder="Tu es l'assistant marketing du Groupe Le Matin..."
                  style={{ padding: '0.65rem 0.85rem', fontSize: '0.85rem', lineHeight: '1.5' }}
                ></textarea>
                <small style={{ marginTop: '6px', color: '#64748b', fontSize: '0.78rem', display: 'block' }}>
                  Définit le rôle et le comportement de base de l'assistant avant de recevoir les données du client.
                </small>
              </div>
            </div>

            {/* Actions : Boutons alignés à droite */}
            <div className="llm-actions" style={{ marginTop: '2.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1.2rem', borderTop: '1px solid #f1f5f9', paddingTop: '1.5rem' }}>
              <button 
                type="button" 
                className="llm-btn-test" 
                onClick={handleTest}
                disabled={testing || saving}
                style={{ padding: '0.65rem 1.4rem', fontSize: '0.85rem' }}
              >
                {testing ? 'Test...' : 'Tester la connexion'}
              </button>
              
              <button 
                type="submit" 
                className="llm-btn-save"
                disabled={testing || saving}
                style={{ padding: '0.65rem 1.4rem', fontSize: '0.85rem' }}
              >
                {saving ? 'Enregistrement...' : 'Sauvegarder la configuration'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default SuperAdminLLMConfig;
