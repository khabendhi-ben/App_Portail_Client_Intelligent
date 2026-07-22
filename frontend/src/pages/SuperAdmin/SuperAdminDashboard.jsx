import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import './SuperAdminDashboard.css';
const SuperAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    active_clients: 0,
    open_claims: 0,
    resolved_claims: 0,
    active_admins: 0,
    total_admins: 0,
    llm_status: 'Chargement...',
    chart_data: null
  });

  const [aiStats, setAiStats] = useState({
    total_requests: 0,
    average_response_time_ms: 0,
    intent_distribution: []
  });

  useEffect(() => {
    fetchUsers();
    fetchStats();
    fetchAiStats();
  }, []);

  const fetchAiStats = async () => {
    try {
      const response = await api.get('/ai/superadmin/stats');
      setAiStats(response.data);
    } catch (error) {
      console.error("Erreur ai stats:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/superadmin/stats');
      setStats(response.data);
    } catch (error) {
      console.error("Erreur stats:", error);
      setStats(prev => ({ ...prev, llm_status: 'Erreur' }));
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Erreur users:", error);
      setLoading(false);
    }
  };

  // Dictionnaire de traduction pour les intentions
  const translatedIntents = {
    'CLAIM': 'Réclamations',
    'ANNOUNCEMENT': 'Annonces',
    'GREETING': 'Salutations',
    'OTHER': 'Autres',
    'UNKNOWN': 'Inconnu'
  };

  const formattedIntentData = aiStats.intent_distribution.map(entry => ({
    ...entry,
    intent: translatedIntents[entry.intent] || entry.intent
  }));

  return (
    <div className="sa-dashboard-content">
      {/* STAT CARDS */}
      <div className="sa-stats-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="sa-stat-card">
          <div className="sa-stat-icon blue">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <div className="sa-stat-content">
            <p className="sa-stat-value">{loading ? '...' : stats.active_clients}</p>
            <p className="sa-stat-label">Clients Actifs</p>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon orange">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          </div>
          <div className="sa-stat-content">
            <p className="sa-stat-value">{loading ? '...' : stats.open_claims}</p>
            <p className="sa-stat-label">Réclamations Ouvertes</p>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon green">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <div className="sa-stat-content">
            <p className="sa-stat-value">{loading ? '...' : stats.resolved_claims}</p>
            <p className="sa-stat-label">Réclamations Résolues</p>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon purple">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <div className="sa-stat-content">
            <p className="sa-stat-value">{loading ? '...' : stats.active_admins}</p>
            <p className="sa-stat-label">Admins actifs</p>
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      <div className="sa-charts-row">
        {stats.chart_data && (
          <div className="sa-chart-card">
            <div className="sa-chart-header">
              <div>
                <h3 className="sa-chart-title">Évolution des clients actifs</h3>
                <p className="sa-chart-subtitle">Mois dernier</p>
              </div>
            </div>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <AreaChart data={stats.chart_data.client_evolution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorClients" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <RechartsTooltip />
                  <Area type="monotone" dataKey="clients" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorClients)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* REPARTITION DES INTENTIONS */}
        <div className="sa-chart-card">
          <div className="sa-chart-header">
            <div>
              <h3 className="sa-chart-title">Répartition des Intentions</h3>
              <p className="sa-chart-subtitle">Ce que demandent les clients</p>
            </div>
          </div>
          <div style={{ width: '100%', height: 200, display: 'flex', justifyContent: 'center' }}>
            {formattedIntentData.length > 0 ? (
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={formattedIntentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="intent"
                  >
                    {formattedIntentData.map((entry, index) => {
                      const colors = ['#14b8a6', '#f59e0b', '#3b82f6', '#8b5cf6', '#ef4444'];
                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                    })}
                  </Pie>
                  <RechartsTooltip />
                  <Legend verticalAlign="middle" align="right" layout="vertical" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ alignSelf: 'center', color: '#94a3b8' }}>Aucune donnée</p>
            )}
          </div>
        </div>
      </div>

      {/* PERFORMANCE ASSISTANT IA */}
      <div className="sa-chart-card" style={{ marginTop: '1.5rem' }}>
        <div className="sa-chart-header" style={{ marginBottom: '1.2rem' }}>
          <div>
            <h3 className="sa-chart-title">Performances de l'Assistant IA</h3>
            <p className="sa-chart-subtitle">Indicateurs clés de statut, d'utilisation et de rapidité</p>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '2rem', padding: '0.5rem 0' }}>
          {/* Métrique 1 : Statut API LLM */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div className="sa-stat-icon" style={{ background: '#e6f7f4', color: '#0d9488', width: '44px', height: '44px', borderRadius: '10px', margin: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px' }}>
                <rect x="3" y="11" width="18" height="10" rx="2"></rect>
                <circle cx="12" cy="5" r="2"></circle>
                <path d="M12 7v4"></path>
                <line x1="8" y1="16" x2="8" y2="16"></line>
                <line x1="16" y1="16" x2="16" y2="16"></line>
              </svg>
            </div>
            <div>
              <div className={`llm-badge ${stats.llm_status === 'En ligne' ? 'online' : 'offline'}`} style={{ padding: '0.25rem 0.6rem', fontSize: '0.8rem', display: 'inline-flex', width: 'auto', marginBottom: '0.2rem' }}>
                <span className="pulse-dot"></span>
                {loading ? '...' : (stats.llm_status === 'En ligne' ? 'En ligne' : 'Hors ligne')}
              </div>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, fontWeight: 500 }}>Statut de l'API LLM</p>
            </div>
          </div>

          {/* Métrique 2 : Requêtes traitées */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div className="sa-stat-icon" style={{ background: '#e0e7ff', color: '#4f46e5', width: '44px', height: '44px', borderRadius: '10px', margin: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '1.8rem', fontWeight: '600', color: '#0f172a', margin: 0, lineHeight: 1.2 }}>{aiStats.total_requests}</p>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, fontWeight: 500 }}>Requêtes Traitées</p>
            </div>
          </div>

          {/* Métrique 3 : Temps moyen de réponse */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <div className="sa-stat-icon" style={{ background: '#e0f2fe', color: '#0284c7', width: '44px', height: '44px', borderRadius: '10px', margin: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: '22px', height: '22px' }}>
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '1.8rem', fontWeight: '600', color: '#0284c7', margin: 0, lineHeight: 1.2 }}>{(aiStats.average_response_time_ms / 1000).toFixed(2)} s</p>
              <p style={{ fontSize: '0.85rem', color: '#64748b', margin: 0, fontWeight: 500 }}>Temps Moyen de Réponse</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;