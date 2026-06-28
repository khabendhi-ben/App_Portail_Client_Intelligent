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
  
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchConfig();
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
    } catch (err) {
      console.error("Erreur test config", err);
      const errorMsg = err.response?.data?.detail || err.message;
      setMessage({ type: 'error', text: `Le test a échoué : ${errorMsg}` });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="sa-page-content">
        <div className="sa-page-header">
          <h2>Configuration du Chatbot IA (LLM)</h2>
        </div>
        <div className="sa-card" style={{ padding: '2rem' }}>
          <div className="skeleton skeleton-row"></div>
          <div className="skeleton skeleton-row"></div>
          <div className="skeleton skeleton-row"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="sa-page-content">
      <div className="sa-page-header">
        <h2>Configuration du Chatbot IA (LLM)</h2>
      </div>

      <div className="sa-card">
        <p style={{ color: '#64748b', marginBottom: '2rem' }}>Gérez les paramètres de connexion au modèle de langage.</p>
        
        {message.text && (
          <div className={`sa-llm-alert ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="sa-llm-form">
          
          <div className="sa-llm-form-group">
            <label>Point d'accès API (Endpoint URL)</label>
            <input 
              type="text" 
              name="llm_endpoint" 
              value={config.llm_endpoint} 
              onChange={handleChange}
              placeholder="ex: https://api.mistral.ai/v1/chat/completions"
              required
            />
            <small>L'URL complète de l'API REST du modèle (Mistral, OpenAI, etc.).</small>
          </div>

          <div className="sa-llm-form-group">
            <label>Clé API (Secrète)</label>
            <input 
              type="password" 
              name="llm_api_key" 
              value={config.llm_api_key} 
              onChange={handleChange}
              placeholder="Votre clé API..."
              required
            />
            <small>La clé est chiffrée de manière sécurisée en base de données.</small>
          </div>

          <div className="sa-llm-form-group">
            <label>Modèle IA</label>
            <input 
              type="text" 
              name="llm_model" 
              value={config.llm_model} 
              onChange={handleChange}
              placeholder="ex: mistral-large-latest"
              required
            />
          </div>

          <div className="sa-llm-form-group">
            <label>Prompt Système (Comportement)</label>
            <textarea 
              name="llm_system_prompt" 
              value={config.llm_system_prompt} 
              onChange={handleChange}
              rows="5"
              placeholder="Tu es l'assistant marketing du Groupe Le Matin..."
            ></textarea>
            <small>Ce texte définit le rôle et le comportement de base de l'assistant avant de recevoir les données du client.</small>
          </div>

          <div className="sa-llm-actions">
            <button 
              type="button" 
              className="sa-llm-btn-test" 
              onClick={handleTest}
              disabled={testing || saving}
            >
              {testing ? 'Test en cours...' : 'Tester la connexion'}
            </button>
            <button 
              type="submit" 
              className="sa-llm-btn-save"
              disabled={testing || saving}
            >
              {saving ? 'Sauvegarde...' : 'Sauvegarder la configuration'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default SuperAdminLLMConfig;
