/**
 * Widok szczegółów wątku - pokazuje posty/odpowiedzi.
 * Admin może usuwać posty, użytkownicy mogą głosować.
 * Zgodnie z zasadami SOLID i Clean Code.
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import serwisForumService from '../services/serwisForumService';
import type { WatekSzczegoly, Post } from '../services/serwisForumService';
import Navbar from './Navbar';
import './SzczegolyWatku.css';

const SzczegolyWatku: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { uzytkownik } = useAuth();

  const [watek, ustawWatek] = useState<WatekSzczegoly | null>(null);
  const [posty, ustawPosty] = useState<Post[]>([]);
  const [ladowanie, ustawLadowanie] = useState(true);
  const [blad, ustawBlad] = useState<string | null>(null);
  const [nowyKomentarz, ustawNowyKomentarz] = useState('');
  const [wysylanie, ustawWysylanie] = useState(false);

  /**
   * Formatowanie daty względnej.
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
   * Pobieranie danych wątku i postów.
   */
  useEffect(() => {
    const pobierzDane = async () => {
      if (!id) return;

      try {
        ustawLadowanie(true);
        ustawBlad(null);

        const [daneWatku, danePostow] = await Promise.all([
          serwisForumService.pobierzWatek(parseInt(id)),
          serwisForumService.pobierzPostyWatku(parseInt(id)),
        ]);

        ustawWatek(daneWatku);
        ustawPosty(danePostow);
      } catch (error) {
        console.error('Błąd pobierania danych wątku:', error);
        ustawBlad('Nie udało się pobrać wątku.');
      } finally {
        ustawLadowanie(false);
      }
    };

    pobierzDane();
  }, [id]);

  /**
   * Głosowanie na post.
   */
  const handleGlosuj = async (postId: number, wartosc: 1 | -1) => {
    try {
      await serwisForumService.glosujNaPost(postId, wartosc);
      // Odśwież posty po głosowaniu
      const danePostow = await serwisForumService.pobierzPostyWatku(parseInt(id!));
      ustawPosty(danePostow);
    } catch (error) {
      console.error('Błąd głosowania:', error);
      alert('Nie udało się zagłosować.');
    }
  };

  /**
   * Usuwanie posta (admin lub autor).
   */
  const handleUsunPost = async (postId: number) => {
    if (!window.confirm('Czy na pewno chcesz usunąć ten post?')) return;

    try {
      await serwisForumService.usunPost(postId);
      // Usuń post z listy lokalnie
      ustawPosty(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      console.error('Błąd usuwania posta:', error);
      alert('Nie udało się usunąć posta.');
    }
  };

  /**
   * Dodawanie nowej odpowiedzi.
   */
  const handleDodajOdpowiedz = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nowyKomentarz.trim()) {
      alert('Treść odpowiedzi nie może być pusta.');
      return;
    }

    try {
      ustawWysylanie(true);
      const nowyPost = await serwisForumService.utworzPost(parseInt(id!), nowyKomentarz);
      ustawPosty(prev => [...prev, nowyPost]);
      ustawNowyKomentarz('');
    } catch (error) {
      console.error('Błąd dodawania odpowiedzi:', error);
      alert('Nie udało się dodać odpowiedzi.');
    } finally {
      ustawWysylanie(false);
    }
  };

  if (ladowanie) {
    return (
      <div className="szczegoly-container">
        <div className="ladowanie">Ładowanie wątku...</div>
      </div>
    );
  }

  if (blad || !watek) {
    return (
      <div className="szczegoly-container">
        <div className="blad">{blad || 'Nie znaleziono wątku.'}</div>
        <button onClick={() => navigate('/')} className="btn-powrot">
          Powrót do forum
        </button>
      </div>
    );
  }

  /**
   * Usuwanie całego wątku (tylko admin).
   */
  const handleUsunWatek = async () => {
    if (!window.confirm('Czy na pewno chcesz usunąć cały wątek? Ta operacja jest nieodwracalna.')) return;

    try {
      await serwisForumService.usunWatek(parseInt(id!));
      alert('Wątek został usunięty.');
      navigate('/');
    } catch (error) {
      console.error('Błąd usuwania wątku:', error);
      alert('Nie udało się usunąć wątku.');
    }
  };

  return (
    <div className="szczegoly-container">
      {/* Navbar wspólny dla całej aplikacji */}
      <Navbar />

      <div className="szczegoly-content">
      {/* Główny wątek */}
      <div className="watek-glowny">
        <div className="watek-header">
          <span className="kategoria-badge">{watek.kategoria.nazwa}</span>
          {watek.zablokowany && <span className="badge-zablokowany">🔒 Zablokowany</span>}
          {/* Przycisk usuwania wątku dla admina */}
          {uzytkownik?.rola === 'ADMIN' && (
            <button
              className="btn-usun-watek"
              onClick={handleUsunWatek}
              title="Usuń cały wątek"
            >
              🗑️ Usuń wątek
            </button>
          )}
        </div>
        <h2 className="watek-tytul">{watek.tytul}</h2>
        <div className="watek-tresc">{watek.tresc}</div>
        <div className="watek-meta">
          <span className="autor">Autor: <strong>{watek.autor.username}</strong></span>
          <span className="data">{formatujDate(watek.data_utworzenia)}</span>
        </div>
      </div>

      {/* Lista odpowiedzi */}
      <div className="odpowiedzi-sekcja">
        <h3>Odpowiedzi ({posty.length})</h3>

        {posty.length === 0 ? (
          <div className="brak-odpowiedzi">
            Brak odpowiedzi. Bądź pierwszy!
          </div>
        ) : (
          <div className="lista-odpowiedzi">
            {posty.map((post) => (
              <div key={post.id} className="odpowiedz-item">
                {/* Głosowanie */}
                <div className="glosowanie">
                  <button
                    className={`btn-glos glos-plus ${post.moj_glos === 1 ? 'aktywny' : ''}`}
                    onClick={() => handleGlosuj(post.id, 1)}
                    title="Głosuj za"
                  >
                    ▲
                  </button>
                  <span className="suma-glosow">{post.suma_glosow || 0}</span>
                  <button
                    className={`btn-glos glos-minus ${post.moj_glos === -1 ? 'aktywny' : ''}`}
                    onClick={() => handleGlosuj(post.id, -1)}
                    title="Głosuj przeciw"
                  >
                    ▼
                  </button>
                </div>

                {/* Treść odpowiedzi */}
                <div className="odpowiedz-content">
                  <div className="odpowiedz-header">
                    <span className="odpowiedz-autor">{post.autor.username}</span>
                    <span className="odpowiedz-data">{formatujDate(post.data_utworzenia)}</span>
                  </div>
                  <div className="odpowiedz-tresc">{post.tresc}</div>

                  {/* Akcje - usuwanie dla admina lub autora */}
                  {(uzytkownik?.rola === 'ADMIN' || uzytkownik?.id === post.autor.id) && (
                    <div className="odpowiedz-akcje">
                      <button
                        className="btn-usun"
                        onClick={() => handleUsunPost(post.id)}
                        title="Usuń odpowiedź"
                      >
                        🗑️ Usuń
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Formularz nowej odpowiedzi */}
      {!watek.zablokowany ? (
        <form className="formularz-odpowiedzi" onSubmit={handleDodajOdpowiedz}>
          <h3>Dodaj odpowiedź</h3>
          <textarea
            value={nowyKomentarz}
            onChange={(e) => ustawNowyKomentarz(e.target.value)}
            placeholder="Napisz swoją odpowiedź..."
            rows={4}
            required
          />
          <button type="submit" disabled={wysylanie} className="btn-wyslij">
            {wysylanie ? 'Wysyłanie...' : 'Wyślij odpowiedź'}
          </button>
        </form>
      ) : (
        <div className="watek-zablokowany-info">
          Ten wątek jest zablokowany. Nie można dodawać odpowiedzi.
        </div>
      )}
      </div>
    </div>
  );
};

export default SzczegolyWatku;
