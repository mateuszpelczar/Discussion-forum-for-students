/**
 * Widok profilu użytkownika.
 * Wyświetla dane użytkownika i umożliwia edycję.
 * Zgodnie z zasadami SOLID i Clean Code.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import './Profil.css';

const Profil: React.FC = () => {
  const navigate = useNavigate();
  const { uzytkownik, odswiezUzytkownika } = useAuth();

  const [edycja, ustawEdycja] = useState(false);
  const [dane, ustawDane] = useState({
    imie: '',
    nazwisko: '',
    wydzial: '',
    rok_studiow: '',
    opis: '',
  });
  const [zapisywanie, ustawZapisywanie] = useState(false);

  /**
   * Odświeżenie danych użytkownika przy montowaniu komponentu.
   */
  useEffect(() => {
    odswiezUzytkownika();
  }, []);

  /**
   * Inicjalizacja danych z kontekstu użytkownika.
   */
  useEffect(() => {
    if (uzytkownik) {
      ustawDane({
        imie: uzytkownik.first_name || '',
        nazwisko: uzytkownik.last_name || '',
        wydzial: uzytkownik.profil?.wydzial || '',
        rok_studiow: uzytkownik.profil?.rok_studiow?.toString() || '',
        opis: uzytkownik.profil?.opis || '',
      });
    }
  }, [uzytkownik]);

  /**
   * Formatowanie daty dołączenia.
   */
  const formatujDate = (dataString: string | undefined): string => {
    if (!dataString) return 'Nieznana';
    const data = new Date(dataString);
    return data.toLocaleDateString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  /**
   * Obsługa zmiany pól formularza.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    ustawDane(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Zapisywanie zmian profilu.
   * (Na razie tylko lokalnie - backend wymaga implementacji endpointu)
   */
  const handleZapisz = async (e: React.FormEvent) => {
    e.preventDefault();
    ustawZapisywanie(true);

    try {
      // TODO: Implementacja zapisu do backendu
      // await serwisUzytkownikowService.aktualizujProfil(dane);
      
      // Na razie tylko symulacja
      await new Promise(resolve => setTimeout(resolve, 500));
      
      ustawEdycja(false);
      alert('Zmiany zostały zapisane!');
    } catch (error) {
      console.error('Błąd zapisywania profilu:', error);
      alert('Nie udało się zapisać zmian.');
    } finally {
      ustawZapisywanie(false);
    }
  };

  if (!uzytkownik) {
    return (
      <div className="profil-container">
        <div className="profil-blad">
          Musisz być zalogowany, aby zobaczyć profil.
        </div>
      </div>
    );
  }

  return (
    <div className="profil-container">
      {/* Navbar wspólny dla całej aplikacji */}
      <Navbar />

      <div className="profil-content">
      {/* Karta profilu */}
      <div className="profil-karta">
        {/* Avatar i podstawowe info */}
        <div className="profil-avatar-sekcja">
          <div className="avatar-placeholder">
            {uzytkownik.username.charAt(0).toUpperCase()}
          </div>
          <div className="podstawowe-info">
            <h2>{uzytkownik.username}</h2>
            <span className={`rola-badge ${uzytkownik.rola === 'ADMIN' ? 'admin' : 'user'}`}>
              {uzytkownik.rola === 'ADMIN' ? 'Administrator' : 'Użytkownik'}
            </span>
          </div>
        </div>

        {/* Dane użytkownika */}
        {!edycja ? (
          <div className="profil-dane">
            <div className="dane-wiersz">
              <span className="etykieta">Email:</span>
              <span className="wartosc">{uzytkownik.email}</span>
            </div>
            <div className="dane-wiersz">
              <span className="etykieta">Imię:</span>
              <span className="wartosc">{dane.imie || 'Nie podano'}</span>
            </div>
            <div className="dane-wiersz">
              <span className="etykieta">Nazwisko:</span>
              <span className="wartosc">{dane.nazwisko || 'Nie podano'}</span>
            </div>
            <div className="dane-wiersz">
              <span className="etykieta">Wydział:</span>
              <span className="wartosc">{dane.wydzial || 'Nie podano'}</span>
            </div>
            <div className="dane-wiersz">
              <span className="etykieta">Rok studiów:</span>
              <span className="wartosc">{dane.rok_studiow || 'Nie podano'}</span>
            </div>
            <div className="dane-wiersz">
              <span className="etykieta">O mnie:</span>
              <span className="wartosc">{dane.opis || 'Nie podano'}</span>
            </div>
            <div className="dane-wiersz">
              <span className="etykieta">Data dołączenia:</span>
              <span className="wartosc">{formatujDate(uzytkownik.date_joined)}</span>
            </div>

            <button onClick={() => ustawEdycja(true)} className="btn-edytuj">
              ✏️ Edytuj profil
            </button>
          </div>
        ) : (
          /* Formularz edycji */
          <form className="profil-formularz" onSubmit={handleZapisz}>
            <div className="formularz-grupa">
              <label>Imię:</label>
              <input
                type="text"
                name="imie"
                value={dane.imie}
                onChange={handleChange}
                placeholder="Twoje imię"
              />
            </div>
            <div className="formularz-grupa">
              <label>Nazwisko:</label>
              <input
                type="text"
                name="nazwisko"
                value={dane.nazwisko}
                onChange={handleChange}
                placeholder="Twoje nazwisko"
              />
            </div>
            <div className="formularz-grupa">
              <label>Wydział:</label>
              <select name="wydzial" value={dane.wydzial} onChange={handleChange}>
                <option value="">Wybierz wydział</option>
                <option value="Informatyka">Wydział Informatyki</option>
                <option value="Ekonomia">Wydział Ekonomii</option>
                <option value="Zarządzanie">Wydział Zarządzania</option>
                <option value="Prawo">Wydział Prawa</option>
                <option value="Pedagogika">Wydział Pedagogiki</option>
              </select>
            </div>
            <div className="formularz-grupa">
              <label>Rok studiów:</label>
              <select name="rok_studiow" value={dane.rok_studiow} onChange={handleChange}>
                <option value="">Wybierz rok</option>
                <option value="1">1 rok</option>
                <option value="2">2 rok</option>
                <option value="3">3 rok</option>
                <option value="4">4 rok</option>
                <option value="5">5 rok</option>
              </select>
            </div>
            <div className="formularz-grupa">
              <label>O mnie:</label>
              <textarea
                name="opis"
                value={dane.opis}
                onChange={handleChange}
                placeholder="Napisz coś o sobie..."
                rows={4}
              />
            </div>

            <div className="formularz-przyciski">
              <button type="submit" disabled={zapisywanie} className="btn-zapisz">
                {zapisywanie ? 'Zapisywanie...' : 'Zapisz zmiany'}
              </button>
              <button
                type="button"
                onClick={() => ustawEdycja(false)}
                className="btn-anuluj"
              >
                Anuluj
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Statystyki użytkownika */}
      <div className="profil-statystyki">
        <h3>Twoja aktywność</h3>
        <div className="statystyki-grid">
          <div className="statystyka-item">
            <span className="statystyka-liczba">{uzytkownik.profil?.liczba_watkow ?? 0}</span>
            <span className="statystyka-etykieta">Wątków</span>
          </div>
          <div className="statystyka-item">
            <span className="statystyka-liczba">{uzytkownik.profil?.liczba_postow ?? 0}</span>
            <span className="statystyka-etykieta">Odpowiedzi</span>
          </div>
          <div className="statystyka-item">
            <span className="statystyka-liczba">{uzytkownik.profil?.liczba_glosow ?? 0}</span>
            <span className="statystyka-etykieta">Głosów</span>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
};

export default Profil;
