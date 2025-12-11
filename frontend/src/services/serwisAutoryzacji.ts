/**
 * Serwis autoryzacji - wszystkie funkcje związane z auth.
 * Zgodnie z zasadą Single Responsibility Principle.
 */
import axiosInstance from '../utils/axios';

export interface UzytkownikRejestracja {
  username: string;
  email: string;
  password: string;
  password2: string;
  first_name?: string;
  last_name?: string;
}

export interface UzytkownikLogowanie {
  email: string;
  password: string;
}

export interface Profil {
  avatar?: string;
  wydzial?: string;
  rok_studiow?: number;
  opis?: string;
}

export interface Uzytkownik {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  rola: 'USER' | 'ADMIN';
  date_joined: string;
  profil: Profil;
}

export interface OdpowiedzAutoryzacji {
  uzytkownik: Uzytkownik;
  tokeny: {
    access: string;
    refresh: string;
  };
  wiadomosc: string;
}

/**
 * Klasa serwisu autoryzacji.
 * Zawiera wszystkie metody komunikacji z API autoryzacji.
 */
class SerwisAutoryzacji {
  /**
   * Rejestracja nowego użytkownika.
   */
  async rejestracja(dane: UzytkownikRejestracja): Promise<OdpowiedzAutoryzacji> {
    const odpowiedz = await axiosInstance.post<OdpowiedzAutoryzacji>(
      '/auth/rejestracja/',
      dane
    );
    
    // Zapisanie tokenów
    if (odpowiedz.data.tokeny) {
      localStorage.setItem('access_token', odpowiedz.data.tokeny.access);
      localStorage.setItem('refresh_token', odpowiedz.data.tokeny.refresh);
    }
    
    return odpowiedz.data;
  }

  /**
   * Logowanie użytkownika.
   */
  async logowanie(dane: UzytkownikLogowanie): Promise<OdpowiedzAutoryzacji> {
    const odpowiedz = await axiosInstance.post<OdpowiedzAutoryzacji>(
      '/auth/logowanie/',
      dane
    );
    
    // Zapisanie tokenów
    if (odpowiedz.data.tokeny) {
      localStorage.setItem('access_token', odpowiedz.data.tokeny.access);
      localStorage.setItem('refresh_token', odpowiedz.data.tokeny.refresh);
    }
    
    return odpowiedz.data;
  }

  /**
   * Wylogowanie użytkownika.
   */
  async wylogowanie(): Promise<void> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (refreshToken) {
      try {
        await axiosInstance.post('/auth/wylogowanie/', {
          refresh: refreshToken,
        });
      } catch (error) {
        console.error('Błąd przy wylogowaniu:', error);
      }
    }
    
    // Usunięcie tokenów
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  /**
   * Pobranie danych aktualnie zalogowanego użytkownika.
   */
  async pobierzAktualnegoUzytkownika(): Promise<Uzytkownik> {
    const odpowiedz = await axiosInstance.get<Uzytkownik>('/auth/uzytkownik/');
    return odpowiedz.data;
  }

  /**
   * Aktualizacja profilu użytkownika.
   */
  async aktualizujProfil(dane: Partial<Uzytkownik>): Promise<Uzytkownik> {
    const odpowiedz = await axiosInstance.patch<Uzytkownik>(
      '/auth/profil/',
      dane
    );
    return odpowiedz.data;
  }

  /**
   * Zmiana hasła użytkownika.
   */
  async zmienHaslo(dane: {
    stare_haslo: string;
    nowe_haslo: string;
    potwierdz_haslo: string;
  }): Promise<{ wiadomosc: string }> {
    const odpowiedz = await axiosInstance.post<{ wiadomosc: string }>(
      '/auth/zmien-haslo/',
      dane
    );
    return odpowiedz.data;
  }

  /**
   * Sprawdzenie czy użytkownik jest zalogowany.
   */
  czyZalogowany(): boolean {
    return !!localStorage.getItem('access_token');
  }
}

export default new SerwisAutoryzacji();
