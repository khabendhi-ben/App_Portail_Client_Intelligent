import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import './SuperAdminLayout.css';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Détecter le rôle de l'utilisateur
  const role = localStorage.getItem('role')?.toLowerCase() || 'client';

  const fetchProfileData = async () => {
    try {
      if (role === 'client') {
        const res = await api.get('/clients/me/dashboard-stats');
        setUserData(res.data);
      } else {
        const res = await api.get('/users/me');
        setUserData(res.data);
      }
      setLoading(false);
    } catch (err) {
      console.error("Erreur de chargement du profil dans le layout:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    fetchProfileData();

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [role]);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  // Icônes réutilisables
  const icons = {
    dashboard: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="9"></rect>
        <rect x="14" y="3" width="7" height="5"></rect>
        <rect x="14" y="12" width="7" height="9"></rect>
        <rect x="3" y="16" width="7" height="5"></rect>
      </svg>
    ),
    admins: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
    ),
    clients: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
      </svg>
    ),
    ai: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
      </svg>
    ),
    stats: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>
    ),
    announcements: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 5L6 9H2v6h4l5 4V5z"></path>
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path>
      </svg>
    ),
    claims: (
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    )
  };

  // Obtenir les menus selon le rôle
  const getMenuItems = () => {
    switch (role) {
      case 'superadmin':
        return [
          { id: '/superadmin/dashboard', label: 'Tableau de bord', icon: icons.dashboard, enabled: true },
          { id: '/superadmin/gestion-admins', label: 'Gestion des Admins', icon: icons.admins, enabled: true },
          { id: '/superadmin/gestion-clients', label: 'Gestion des Clients', icon: icons.clients, enabled: true },
          { id: '/superadmin/statistiques', label: 'Statistiques Système', icon: icons.stats, enabled: true }
        ];
      case 'admin':
        return [
          { id: '/admin/dashboard', label: 'Tableau de bord', icon: icons.dashboard, enabled: true },
          { id: '/admin/gestion-clients', label: 'Gestion des Clients', icon: icons.clients, enabled: true },
          { id: '/admin/reclamations', label: 'Réclamations', icon: icons.claims, enabled: true },
          { id: '/admin/monitoring-ia', label: 'Monitoring IA', icon: icons.ai, enabled: true }
        ];
      case 'client':
        return [
          { id: '/client/dashboard', label: 'Tableau de bord', icon: icons.dashboard, enabled: true },
          { id: '/client/announcements', label: 'Mes Annonces', icon: icons.announcements, enabled: true },
          { id: '/client/reclamations', label: 'Réclamations', icon: icons.claims, enabled: true },
         { id: '/client/assistant', label: 'Assistant IA', icon: icons.ai, enabled: true, badge: '' }
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuItems();

  const getPageTitle = () => {
    if (location.pathname.endsWith('/profil')) return 'Mon Profil';
    const current = menuItems.find(item => location.pathname === item.id);
    if (current) return current.label;
    
    // Fallback titres de page
    if (role === 'superadmin') return 'Espace SuperAdmin';
    if (role === 'admin') return 'Espace Admin';
    return 'Espace Client';
  };

  // Rôle textuel affiché sous le nom
  const getDisplayRole = () => {
    if (role === 'superadmin') return 'Super-Administrateur';
    if (role === 'admin') return 'Administrateur';
    return userData?.company_name || 'Partenaire';
  };

  if (loading) {
    return (
      <div className="client-loading-container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#f8fafc',
        gap: '16px',
        color: '#475569',
        fontFamily: 'sans-serif'
      }}>
        <div className="client-spinner" style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTop: '3px solid #2e6b6b',
          borderRadius: '50%',
          animation: 'client-spin 1s linear infinite'
        }}></div>
        <p>Chargement de votre espace...</p>
        <style>{`
          @keyframes client-spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="sa-layout">
      {/* SIDEBAR */}
      <aside className={`sa-sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sa-sidebar-header">
          {isSidebarOpen ? (
            <img src="/logo.png" alt="Groupe Le Matin" className="sa-sidebar-logo-img" />
          ) : (
            <span className="sa-sidebar-logo-mini"></span>
          )}
        </div>

        <nav className="sa-nav">
          {menuItems.map(item => {
            const isActive = location.pathname === item.id;
            if (!item.enabled) {
              return (
                <button 
                  key={item.id} 
                  className="sa-nav-item disabled" 
                  title={item.badge + " disponible"} 
                  style={{ opacity: 0.5, cursor: 'not-allowed' }}
                >
                  {item.icon}
                  {isSidebarOpen && (
                    <>
                      <span style={{ marginLeft: '12px' }}>{item.label}</span>
                      <span className="client-nav-badge" style={{ 
                        fontSize: '0.7rem', 
                        background: '#334155', 
                        color: '#cbd5e1', 
                        padding: '2px 6px', 
                        borderRadius: '10px', 
                        marginLeft: 'auto' 
                      }}>{item.badge}</span>
                    </>
                  )}
                </button>
              );
            }
            return (
              <button
                key={item.id}
                className={`sa-nav-item ${isActive ? 'active' : ''}`}
                onClick={() => navigate(item.id)}
                title={item.label}
              >
                {item.icon}
                {isSidebarOpen && <span style={{ marginLeft: '12px' }}>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        <button className="sa-logout-btn" onClick={handleLogout} title="Déconnexion">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          {isSidebarOpen && <span style={{ marginLeft: '12px' }}>Déconnexion</span>}
        </button>
      </aside>

      {/* MAIN CONTENT */}
      <main className="sa-main-content">
        {/* HEADER */}
        <header className="sa-header">
          <div className="sa-header-left">
            <button className="sa-toggle-btn" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              ☰
            </button>
            <h1 className="sa-page-title">{getPageTitle()}</h1>
          </div>
          
          <div className="sa-header-right">
            <div className="sa-user-dropdown-wrapper" ref={dropdownRef}>
              <button
                className="sa-user-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <div className="sa-user-avatar">
                  {userData?.nom ? userData.nom.charAt(0).toUpperCase() : userData?.email?.charAt(0).toUpperCase()}
                </div>
                <div className="sa-user-info">
                  <span className="sa-user-name">{userData?.nom || (role === 'client' ? 'Client' : 'Administrateur')}</span>
                  <span className="sa-user-role">{getDisplayRole()}</span>
                </div>
                <span className="sa-dropdown-arrow">{dropdownOpen ? '▲' : '▼'}</span>
              </button>

              {dropdownOpen && (
                <div className="sa-dropdown-menu">
                  <button className="sa-dropdown-item" onClick={() => { setDropdownOpen(false); navigate(`/${role}/profil`); }}>
                    Mon Profil
                  </button>
                  <hr className="sa-dropdown-divider" />
                  <button className="sa-dropdown-item logout" onClick={handleLogout}>
                    ↪ Déconnexion
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* BODY */}
        <div className="sa-body-content">
          <Outlet context={{ stats: userData, reloadStats: fetchProfileData }} />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
