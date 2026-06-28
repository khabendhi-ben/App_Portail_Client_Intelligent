import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend
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

  useEffect(() => {
    fetchUsers();
    fetchStats();
  }, []);

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

  const admins = users.filter(u => u.role === 'admin');

  const recentActivity = [
    { text: 'Nouveau client créé', detail: 'Fatima Admin • 10:30', color: '#2dd4bf' },
    { text: 'Réclamation résolue', detail: 'Karim Manager • 10:15', color: '#2dd4bf' },
    { text: 'Annonce approuvée', detail: 'Amina Support • 09:45', color: '#2dd4bf' },
    { text: 'Client désactivé', detail: 'Omar Service • 09:20', color: '#ef4444' },
    { text: 'Configuration modifiée', detail: 'SuperAdmin • 08:50', color: '#f59e0b' },
  ];

  return (
    <div className="sa-dashboard-content">
      {/* STAT CARDS */}
      <div className="sa-stats-row">
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

        {/* 5th CARD: LLM Status */}
        <div className="sa-stat-card">
          <div className="sa-stat-icon" style={{ background: '#e6f7f4', color: '#0d9488' }}>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"></rect><circle cx="12" cy="5" r="2"></circle><path d="M12 7v4"></path><line x1="8" y1="16" x2="8" y2="16"></line><line x1="16" y1="16" x2="16" y2="16"></line></svg>
          </div>
          <div className="sa-stat-content" style={{ alignItems: 'flex-start' }}>
            <p className="sa-stat-value" style={{ fontSize: '1.2rem', marginBottom: '0.4rem' }}>
              API LLM
            </p>
            <div className={`llm-badge ${stats.llm_status === 'En ligne' ? 'online' : 'offline'}`} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
              <span className="pulse-dot"></span>
              {loading ? '...' : (stats.llm_status === 'En ligne' ? 'En ligne' : 'Hors ligne')}
            </div>
          </div>
        </div>
      </div>

      {/* CHARTS ROW */}
      {stats.chart_data && (
        <div className="sa-charts-row">
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

          <div className="sa-chart-card">
            <div className="sa-chart-header">
              <div>
                <h3 className="sa-chart-title">Réclamations · 7 derniers jours</h3>
                <p className="sa-chart-subtitle">Ouvertes vs résolues</p>
              </div>
              <div className="sa-chart-legend">
                <div className="sa-chart-legend-item">
                  <div className="sa-legend-dot" style={{ backgroundColor: '#f59e0b' }}></div>
                  Ouvertes
                </div>
                <div className="sa-chart-legend-item">
                  <div className="sa-legend-dot" style={{ backgroundColor: '#14b8a6' }}></div>
                  Résolues
                </div>
              </div>
            </div>
            <div style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <BarChart data={stats.chart_data.claims_7_days} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={12}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                  <RechartsTooltip cursor={{fill: '#f8fafc'}} />
                  <Bar dataKey="ouvertes" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="resolues" fill="#14b8a6" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;