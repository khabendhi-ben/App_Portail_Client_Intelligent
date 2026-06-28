import React from 'react';
import './ClientContact.css';

const ClientContact = () => {
  return (
    <div className="client-contact-container">
      
      {/* BANNIÈRE VERTE */}
      <div className="contact-banner">
        <div className="contact-banner-text">
          <h2>Notre équipe est à votre écoute</h2>
          
        </div>
        <div className="contact-banner-badge">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <polyline points="12 6 12 12 16 14"></polyline>
          </svg>
          Lun - Ven • 9h - 18h
        </div>
      </div>

      {/* CONTENU PRINCIPAL (2 Colonnes) */}
      <div className="contact-content-split">
        
        {/* COLONNE GAUCHE : CARTE GOOGLE MAPS */}
        <div className="contact-left-col">
          <div className="contact-map-card">
            <iframe 
              src="https://maps.google.com/maps?q=Groupe+Le+Matin,+Casablanca&t=&z=16&ie=UTF8&iwloc=&output=embed" 
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Google Maps Groupe Le Matin"
            ></iframe>
          </div>
        </div>

        {/* COLONNE DROITE : CARTES DE COORDONNÉES */}
        <div className="contact-right-col">
          
          {/* CARTE 1 : Rédaction & Administration */}
          <div className="contact-card">
            <h3 className="contact-card-title">Rédaction & Administration</h3>
            
            <div className="contact-info-item">
              <div className="contact-icon-box">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
              <div className="contact-text-box">
                <span className="contact-label">TÉLÉPHONE</span>
                <span className="contact-value">+212 5 22 48 91 00</span>
                <span className="contact-label">Fax</span>
                <span className="contact-value">+212 5 22 20 30 48</span>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-icon-box">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
              </div>
              <div className="contact-text-box">
                <span className="contact-label">EMAIL</span>
                <span className="contact-value">redactions@lematin.ma</span>
                
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-icon-box">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <div className="contact-text-box">
                <span className="contact-label">ADRESSE</span>
                <span className="contact-value">17, Rue Othmane Ben Affane</span>
                <span className="contact-subvalue">Casablanca 20000, Maroc</span>
              </div>
            </div>
          </div>

          {/* CARTE 2 : Publicité */}
          <div className="contact-card">
            <h3 className="contact-card-title">Publicité</h3>
            
            <div className="contact-info-item">
              <div className="contact-icon-box">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
              <div className="contact-text-box">
                <span className="contact-label">TÉLÉPHONE</span>
                <span className="contact-value">+212 5 22 48 91 58</span>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-icon-box">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <div className="contact-text-box">
                <span className="contact-label">ADRESSE</span>
                <span className="contact-value">17, Rue Othmane Ben Affane</span>
                <span className="contact-subvalue">Casablanca 20000, Maroc</span>
              </div>
            </div>
          </div>

          {/* CARTE 3 : Petites Annonces */}
          <div className="contact-card">
            <h3 className="contact-card-title">Petites annonces</h3>
            
            <div className="contact-info-item">
              <div className="contact-icon-box">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
              </div>
              <div className="contact-text-box">
                <span className="contact-label">TÉLÉPHONE</span>
                <span className="contact-value">+212 5 22 26 88 60</span>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-icon-box">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
              </div>
              <div className="contact-text-box">
                <span className="contact-label">HORAIRES</span>
                <div className="contact-schedule-line"><span>Lundi - Vendredi</span> <span className="time-badge">08h00 - 17h30</span></div>
                <div className="contact-schedule-line"><span>Samedi</span> <span className="time-badge">09h00 - 12h30</span></div>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-icon-box">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
              </div>
              <div className="contact-text-box">
                <span className="contact-label">ADRESSE</span>
                <span className="contact-value">88, Boulevard Mohammed V</span>
                <span className="contact-subvalue">Casablanca 20000, Maroc</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ClientContact;
