/**
 * Strona główna - Dashboard po zalogowaniu.
 * Wyświetla listę wątków/postów (według makiety).
 * Zgodnie z zasadami SOLID i Clean Code.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import serwisForumService from '../services/serwisForumService';
import type { Watek, Kategoria } from '../services/serwisForumService';
import type { UzytkownikLista } from '../services/serwisUzytkownikowService';
import Navbar from './Navbar';
import './StronaGlowna.css';
import forumBanner from '../assets/forumdyskusyjne.png';

const StronaGlowna: React.FC = () => {
  const navigate = useNavigate();
  const { uzytkownik } = useAuth();

  // Stan komponentu (KISS - proste zarządzanie stanem)
  const [watki, ustawWatki] = useState<Watek[]>([]);
  const [kategorie, ustawKategorie] = useState<Kategoria[]>([]);
  const [aktywniUzytkownicy, ustawAktywniUzytkownicy] = useState<UzytkownikLista[]>([]);
  const [ladowanie, ustawLadowanie] = useState<boolean>(true);
  const [blad, ustawBlad] = useState<string | null>(null);
  const [wybranaKategoria, ustawWybranaKategoria] = useState<number | null>(null);
  const [sortowanie, ustawSortowanie] = useState<'najnowsze' | 'najstarsze' | 'najpopularniejsze'>('najnowsze');

  /**
   * Callback po dodaniu nowego posta - odśwież listę.
   */
  const handlePostAdded = async () => {
    const daneWatkow = await serwisForumService.pobierzWatki();
    ustawWatki(daneWatkow);
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
            is_active: true,
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
   * Filtrowanie i sortowanie wątków.
   */
  const filtrowaneWatki = (() => {
    // Najpierw filtrujemy po kategorii
    let wynik = wybranaKategoria
      ? watki.filter(watek => watek.kategoria.id === wybranaKategoria)
      : [...watki];

    // Następnie sortujemy
    switch (sortowanie) {
      case 'najnowsze':
        wynik.sort((a, b) => new Date(b.data_utworzenia).getTime() - new Date(a.data_utworzenia).getTime());
        break;
      case 'najstarsze':
        wynik.sort((a, b) => new Date(a.data_utworzenia).getTime() - new Date(b.data_utworzenia).getTime());
        break;
      case 'najpopularniejsze':
        wynik.sort((a, b) => (b.suma_glosow || 0) - (a.suma_glosow || 0));
        break;
    }

    return wynik;
  })();

  return (
    <div className="forum-container">
      {/* Navbar wspólny dla całej aplikacji */}
      <Navbar onPostAdded={handlePostAdded} />

      {/* Baner forum */}
      <div className="forum-banner">
        <img src={forumBanner} alt="Forum Dyskusyjne dla Studentów" />
      </div>

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
            <select
              className="sort-select"
              value={sortowanie}
              onChange={(e) => ustawSortowanie(e.target.value as 'najnowsze' | 'najstarsze' | 'najpopularniejsze')}
            >
              <option value="najnowsze">Najnowsze</option>
              <option value="najstarsze">Najstarsze</option>
              <option value="najpopularniejsze">Najpopularniejsze</option>
            </select>

            {/* Przycisk - prawa strona - usunięty, przeniósł się do Navbar */}
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
                <div
                  key={watek.id}
                  className="post-item"
                  onClick={() => navigate(`/watek/${watek.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Statystyki - lewa strona */}
                  <div className="post-votes">
                    <div style={{ marginBottom: '8px' }}>
                      <span className="vote-count">{watek.suma_glosow || 0}</span>
                      <span className="vote-label">głosów</span>
                    </div>
                    <div>
                      <span className="vote-count">{watek.liczba_postow || 0}</span>
                      <span className="vote-label">odpowiedzi</span>
                    </div>
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
    </div>
  );
};

export default StronaGlowna;
