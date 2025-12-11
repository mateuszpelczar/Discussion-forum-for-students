/**
 * Strona główna - Dashboard po zalogowaniu.
 * Wyświetla listę wątków/postów (według makiety).
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './StronaGlowna.css';

const StronaGlowna: React.FC = () => {
  const navigate = useNavigate();
  const { uzytkownik, wylogowanie } = useAuth();

  const handleWylogowanie = async () => {
    try {
      await wylogowanie();
      navigate('/logowanie');
    } catch (error) {
      console.error('Błąd wylogowania:', error);
    }
  };

  return (
    <div className="forum-container">
      {/* Navbar */}
      <header className="forum-header">
        <div className="header-content">
          <h1>Forum studenckie</h1>
          <div className="header-actions">
            <span className="username">
              Zalogowano jako: <strong>{uzytkownik?.username}</strong>
              {uzytkownik?.rola === 'ADMIN' && (
                <span className="badge-admin">ADMIN</span>
              )}
            </span>
            <button onClick={handleWylogowanie} className="btn-logout">
              Wyloguj
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="forum-content">
        <aside className="forum-sidebar">
          <div className="sidebar-section">
            <h3>Kategorie</h3>
            <ul className="category-list">
              <li className="empty-state">Brak kategorii</li>
            </ul>
          </div>

          <div className="sidebar-section">
            <h3>Aktywni użytkownicy</h3>
            <ul className="user-list">
              <li className="empty-state">Brak aktywnych użytkowników</li>
            </ul>
          </div>
        </aside>

        <main className="forum-main">
          <div className="forum-controls">
            <div className="tabs">
              <button className="tab active">Strona główna</button>
              <button className="tab">Dodaj post</button>
              <button className="tab">Mój profil</button>
            </div>
            <button className="btn-new-post">Nowy post</button>
          </div>

          <div className="posts-header">
            <h2>Posty (wątki)</h2>
            <div className="sort-controls">
              <select className="sort-select">
                <option>Najnowsze</option>
                <option>Najpopularniejsze</option>
                <option>Najczęściej komentowane</option>
              </select>
            </div>
          </div>

          <div className="posts-list">
            <div className="empty-state">
              <p>Brak postów do wyświetlenia</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StronaGlowna;
