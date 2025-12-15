/**
 * Wspólny komponent nawigacji (menu bar).
 * Wyświetlany u góry na wszystkich stronach po zalogowaniu.
 * Zgodnie z zasadą DRY - jeden komponent dla całej aplikacji.
 */
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ZarzadzanieKategoriami from './ZarzadzanieKategoriami';
import ZarzadzanieUzytkownikami from './ZarzadzanieUzytkownikami';
import DodajPost from './DodajPost';
import './Navbar.css';

interface NavbarProps {
  onPostAdded?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onPostAdded }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { uzytkownik, wylogowanie } = useAuth();

  // Stan dla dropdown menu admina
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Stan dla modali
  const [pokazModalKategorie, setPokazModalKategorie] = useState(false);
  const [pokazModalUzytkownicy, setPokazModalUzytkownicy] = useState(false);
  const [pokazModalDodajPost, setPokazModalDodajPost] = useState(false);

  /**
   * Zamknięcie dropdown przy kliknięciu poza nim.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setAdminDropdownOpen(false);
      }
    };

    if (adminDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [adminDropdownOpen]);

  const handleWylogowanie = async () => {
    try {
      await wylogowanie();
      navigate('/logowanie');
    } catch (error) {
      console.error('Błąd wylogowania:', error);
    }
  };

  const handlePostAdded = () => {
    setPokazModalDodajPost(false);
    if (onPostAdded) {
      onPostAdded();
    }
  };

  return (
    <>
      <header className="navbar">
        <div className="navbar-content">
          <h1 onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
            Forum studenckie
          </h1>

          {/* Nawigacja główna */}
          <nav className="navbar-nav">
            <button
              className={`nav-btn ${location.pathname === '/' ? 'active' : ''}`}
              onClick={() => navigate('/')}
            >
              Strona główna
            </button>
            <button
              className="nav-btn"
              onClick={() => setPokazModalDodajPost(true)}
            >
              Nowy wątek
            </button>
            <button
              className={`nav-btn ${location.pathname === '/profil' ? 'active' : ''}`}
              onClick={() => navigate('/profil')}
            >
              Mój profil
            </button>
          </nav>

          <div className="navbar-actions">
            <span className="navbar-username">
              Zalogowano jako: <strong>{uzytkownik?.username}</strong>
              {uzytkownik?.rola === 'ADMIN' && (
                <span className="badge-admin">ADMIN</span>
              )}
            </span>

            {/* Dropdown menu dla admina */}
            {uzytkownik?.rola === 'ADMIN' && (
              <div className="admin-dropdown" ref={dropdownRef}>
                <button
                  onClick={() => setAdminDropdownOpen(!adminDropdownOpen)}
                  className="btn-admin-dropdown"
                >
                  Admin ▼
                </button>
                {adminDropdownOpen && (
                  <div className="dropdown-menu">
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setPokazModalKategorie(true);
                        setAdminDropdownOpen(false);
                      }}
                    >
                      Zarządzanie kategoriami
                    </button>
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        setPokazModalUzytkownicy(true);
                        setAdminDropdownOpen(false);
                      }}
                    >
                      Zarządzanie użytkownikami
                    </button>
                  </div>
                )}
              </div>
            )}

            <button onClick={handleWylogowanie} className="btn-logout">
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      {/* Modale zarządzania */}
      <ZarzadzanieKategoriami
        isOpen={pokazModalKategorie}
        onClose={() => setPokazModalKategorie(false)}
      />
      <ZarzadzanieUzytkownikami
        isOpen={pokazModalUzytkownicy}
        onClose={() => setPokazModalUzytkownicy(false)}
      />
      <DodajPost
        isOpen={pokazModalDodajPost}
        onClose={() => setPokazModalDodajPost(false)}
        onPostAdded={handlePostAdded}
      />
    </>
  );
};

export default Navbar;
