import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './SuperAdminDashboard.css';

const SuperAdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Erreur:", error);
      setLoading(false);
    }
  };

  const admins = users.filter(u => u.role === 'admin');
  const clients = users.filter(u => u.role === 'client');
  const activeAdmins = users.filter(u => u.role === 'admin' && u.is_active);
  const activeClients = users.filter(u => u.role === 'client' && u.is_active);

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
          <div className="sa-stat-icon purple">👤</div>
          <div>
            <p className="sa-stat-label">Admins Actifs</p>
            <p className="sa-stat-value">{loading ? '...' : activeAdmins.length}</p>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0 0' }}>
              {loading ? '' : `${admins.length} au total`}
            </p>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon blue">👥</div>
          <div>
            <p className="sa-stat-label">Clients Actifs</p>
            <p className="sa-stat-value">{loading ? '...' : activeClients.length}</p>
            <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '4px 0 0 0' }}>
              {loading ? '' : `${clients.length} au total`}
            </p>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon green"></div>
          <div>
            <p className="sa-stat-label">Requêtes IA / jour</p>
            <p className="sa-stat-value">3</p>
          </div>
        </div>
        <div className="sa-stat-card">
          <div className="sa-stat-icon orange"></div>
          <div>
            <p className="sa-stat-label">Uptime Serveur</p>
            <p className="sa-stat-value">%</p>
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION */}
      <div className="sa-bottom-row">
        {/* TABLE */}
        <div className="sa-card sa-table-card">
          <h2 className="sa-card-title">Administrateurs Actifs</h2>
          {loading ? (
            <p style={{ color: '#94a3b8', padding: '1rem' }}>Chargement...</p>
          ) : (
            <div style={{ overflowX: 'auto', width: '100%' }}>
              <table className="sa-table">
                <thead>
                  <tr>
                    <th>NOM COMPLET</th>
                    <th>EMAIL</th>
                    <th>STATUT</th>
                  </tr>
                </thead>
                <tbody>
                  {admins.length === 0 ? (
                    <tr><td colSpan="3" style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Aucun administrateur trouvé</td></tr>
                  ) : (
                    admins.map((admin) => (
                      <tr key={admin.id}>
                        <td><strong>{admin.nom || admin.email.split('@')[0]}</strong></td>
                        <td>{admin.email}</td>
                        <td>
                          <span className={`sa-badge ${admin.is_active ? 'active' : 'inactive'}`}>
                            {admin.is_active ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ACTIVITY FEED */}
        <div className="sa-card sa-activity-card">
          <h2 className="sa-card-title">Activité en temps réel</h2>
          <ul className="sa-activity-list">
            {recentActivity.map((item, idx) => (
              <li key={idx} className="sa-activity-item">
                <span className="sa-activity-dot" style={{ background: item.color }}></span>
                <div>
                  <p className="sa-activity-text">{item.text}</p>
                  <p className="sa-activity-detail">{item.detail}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;