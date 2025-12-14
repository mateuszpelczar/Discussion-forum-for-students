/**
 * Strona główna - Dashboard po zalogowaniu.
 * Wyświetla listę wątków/postów (według makiety).
 * Zgodnie z zasadami SOLID i Clean Code.
 */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import serwisForumService from '../services/serwisForumService';
import type { Watek, Kategoria } from '../services/serwisForumService';
import type { UzytkownikLista } from '../services/serwisUzytkownikowService';
import ZarzadzanieKategoriami from './ZarzadzanieKategoriami';
import ZarzadzanieUzytkownikami from './ZarzadzanieUzytkownikami';
import DodajPost from './DodajPost';
import './StronaGlowna.css';

const StronaGlowna: React.FC = () => {
  const navigate = useNavigate();
  const { uzytkownik, wylogowanie } = useAuth();

  // Stan komponentu (KISS - proste zarządzanie stanem)
  const [watki, ustawWatki] = useState<Watek[]>([]);
  const [kategorie, ustawKategorie] = useState<Kategoria[]>([]);
  const [aktywniUzytkownicy, ustawAktywniUzytkownicy] = useState<UzytkownikLista[]>([]);
  const [ladowanie, ustawLadowanie] = useState<boolean>(true);
  const [blad, ustawBlad] = useState<string | null>(null);
  const [wybranaKategoria, ustawWybranaKategoria] = useState<number | null>(null);

  // Stan dla dropdown menu admina
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Stan dla modali
  const [pokazModalKategorie, setPokazModalKategorie] = useState(false);
  const [pokazModalUzytkownicy, setPokazModalUzytkownicy] = useState(false);
  const [pokazModalDodajPost, setPokazModalDodajPost] = useState(false);

  /**
   * Funkcja pomocnicza do formatowania daty (DRY - reużywalna).
   * Wyświetla czas względny (np. "2 godziny temu").
   */
  const formatujDate = (dataString: string): string => {
    const data = new Date(dataString);
    const teraz = new Date();
    const roznicaMs = teraz.getTime() - data.getTime();
    const roznicaMin = Math.floor(roznicaMs / 60000);
    const roznicaGodz = Math.floor(roznicaMin / 60);
    const roznicaDni = Math.floor(roznicaGodz / 24);

    if (roznicaMin < 1) return 'przed chwilą';
    if (roznicaMin < 60) return `${roznicaMin} min temu`;
    if (roznicaGodz < 24) return `${roznicaGodz} godz. temu`;
    if (roznicaDni < 7) return `${roznicaDni} dni temu`;

    return data.toLocaleDateString('pl-PL');
  };

  /**
   * Pobieranie danych przy montowaniu komponentu.
   * Zgodnie z zasadą Single Responsibility - jedna funkcja, jedno zadanie.
   */
  useEffect(() => {
    const pobierzDane = async () => {
      try {
        ustawLadowanie(true);
        ustawBlad(null);

        // Równoległe pobieranie danych (optymalizacja)
        const [daneWatkow, daneKategorii] = await Promise.all([
          serwisForumService.pobierzWatki(),
          serwisForumService.pobierzKategorie(),
        ]);

        ustawWatki(daneWatkow);
        ustawKategorie(daneKategorii);

        // UWAGA: Backend nie śledzi aktywnych sesji użytkowników
        // Jako zastępcze rozwiązanie pokazujemy tylko aktualnie zalogowanego użytkownika
        // Pełna implementacja wymagałaby WebSocket lub mechanizmu sesji na backendzie
        if (uzytkownik) {
          ustawAktywniUzytkownicy([{
            id: uzytkownik.id,
            username: uzytkownik.username,
            email: uzytkownik.email,
            rola: uzytkownik.rola,
            first_name: uzytkownik.first_name,
            last_name: uzytkownik.last_name,
            date_joined: new Date().toISOString(),
            profil: {
              avatar: undefined,
              wydzial: undefined,
              rok_studiow: undefined,
              opis: ''
            }
          }]);
        }
      } catch (error) {
        console.error('Błąd pobierania danych:', error);
        ustawBlad('Nie udało się pobrać danych forum.');
      } finally {
        ustawLadowanie(false);
      }
    };

    pobierzDane();
  }, [uzytkownik]); // Wykonaj ponownie gdy zmieni się użytkownik

  /**
   * Filtrowanie wątków po wybranej kategorii.
   */
  const filtrowaneWatki = wybranaKategoria
    ? watki.filter(watek => watek.kategoria.id === wybranaKategoria)
    : watki;

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

  return (
    <div className="forum-container">
      {/* Navbar */}
      <header className="forum-header">
        <div className="header-content">
          <h1>Forum studenckie</h1>

          {/* Nawigacja główna */}
          <nav className="main-nav">
            <button className="nav-btn active">Strona główna</button>
            <button
              className="nav-btn"
              onClick={() => setPokazModalDodajPost(true)}
            >
              Dodaj post
            </button>
            <button className="nav-btn">Mój profil</button>
          </nav>

          <div className="header-actions">
            <span className="username">
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

      {/* Main content - 3 kolumny */}
      <div className="forum-content">
        {/* Lewy sidebar - Kategorie */}
        <aside className="forum-sidebar">
          <div className="sidebar-section">
            <h3>Kategorie</h3>
            <ul className="category-list">
              <li
                className={`category-item ${wybranaKategoria === null ? 'active' : ''}`}
                onClick={() => ustawWybranaKategoria(null)}
              >
                Wszystkie
              </li>
              {kategorie.length > 0 ? (
                kategorie.map((kategoria) => (
                  <li
                    key={kategoria.id}
                    className={`category-item ${wybranaKategoria === kategoria.id ? 'active' : ''}`}
                    onClick={() => ustawWybranaKategoria(kategoria.id)}
                  >
                    {kategoria.nazwa}
                    {kategoria.liczba_watkow !== undefined && (
                      <span style={{ fontSize: '11px', color: '#999', marginLeft: '8px' }}>
                        ({kategoria.liczba_watkow})
                      </span>
                    )}
                  </li>
                ))
              ) : (
                <li className="empty-state">Brak kategorii</li>
              )}
            </ul>
          </div>
        </aside>

        {/* Środek - Posty */}
        <main className="forum-main">
          <div className="forum-controls">
            {/* Sortowanie - lewa strona */}
            <select className="sort-select">
              <option value="najnowsze">Najnowsze</option>
              <option value="najstarsze">Najstarsze</option>
              <option value="najpopularniejsze">Najpopularniejsze</option>
            </select>

            {/* Przycisk - prawa strona */}
            <button
              className="btn-new-post"
              onClick={() => setPokazModalDodajPost(true)}
            >
              Nowy post
            </button>
          </div>

          <div className="posts-list">
            {/* Stan ładowania */}
            {ladowanie && (
              <div className="empty-state">
                <p>Ładowanie postów...</p>
              </div>
            )}

            {/* Stan błędu */}
            {blad && !ladowanie && (
              <div className="empty-state">
                <p style={{ color: '#d32f2f' }}>{blad}</p>
              </div>
            )}

            {/* Lista wątków */}
            {!ladowanie && !blad && filtrowaneWatki.length > 0 && (
              filtrowaneWatki.map((watek) => (
                <div key={watek.id} className="post-item">
                  {/* Głosy - lewa strona */}
                  <div className="post-votes">
                    <button className="vote-btn vote-up">▲</button>
                    <div className="vote-count">{watek.liczba_postow || 0}</div>
                    <button className="vote-btn vote-down">▼</button>
                  </div>

                  {/* Treść posta */}
                  <div className="post-content">
                    {/* Badge kategorii */}
                    <span className="category-badge">{watek.kategoria.nazwa}</span>

                    {/* Tytuł */}
                    <h3 className="post-title">{watek.tytul}</h3>

                    {/* Opis/treść */}
                    <p className="post-description">
                      {watek.tresc.length > 150
                        ? `${watek.tresc.substring(0, 150)}...`
                        : watek.tresc}
                    </p>

                    {/* Meta informacje */}
                    <div className="post-meta">
                      <span className="author">Autor: {watek.autor.username}</span>
                      <span className="separator">•</span>
                      <span className="replies">{watek.liczba_postow || 0} odpowiedzi</span>
                    </div>
                  </div>
                </div>
              ))
            )}

            {/* Stan pusty */}
            {!ladowanie && !blad && filtrowaneWatki.length === 0 && (
              <div className="empty-state">
                <p>
                  {wybranaKategoria
                    ? 'Brak postów w tej kategorii'
                    : 'Brak postów do wyświetlenia'}
                </p>
              </div>
            )}
          </div>
        </main>

        {/* Prawy sidebar - Aktywni użytkownicy */}
        <aside className="forum-users">
          <h3>Aktywni użytkownicy</h3>
          <ul className="user-list">
            {aktywniUzytkownicy.length > 0 ? (
              aktywniUzytkownicy.map((user) => (
                <li key={user.id}>
                  <span className="user-online-indicator">●</span> {user.username}
                </li>
              ))
            ) : (
              <li className="empty-state">Brak aktywnych użytkowników</li>
            )}
          </ul>
        </aside>
      </div>

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
        onPostAdded={() => {
          // Odśwież listę wątków po dodaniu nowego
          serwisForumService.pobierzWatki().then(dane => ustawWatki(dane));
        }}
      />
    </div>
  );
};

export default StronaGlowna;
