/**
 * Context autoryzacji.
 * Zarządza stanem uwierzytelnienia w całej aplikacji.
 * Zgodnie z wzorcem Context API React.
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import type { ReactNode } from 'react';
import serwisAutoryzacji from '../services/serwisAutoryzacji';
import type { Uzytkownik, UzytkownikRejestracja, UzytkownikLogowanie } from '../services/serwisAutoryzacji';

interface AuthContextType {
  uzytkownik: Uzytkownik | null;
  ladowanie: boolean;
  zalogowany: boolean;
  rejestracja: (dane: UzytkownikRejestracja) => Promise<void>;
  logowanie: (dane: UzytkownikLogowanie) => Promise<void>;
  wylogowanie: () => Promise<void>;
  odswiezUzytkownika: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider kontekstu autoryzacji.
 * Opakowuje aplikację i dostarcza funkcje autoryzacji.
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [uzytkownik, setUzytkownik] = useState<Uzytkownik | null>(null);
  const [ladowanie, setLadowanie] = useState<boolean>(true);
  const [zalogowany, setZalogowany] = useState<boolean>(false);

  /**
   * Sprawdzenie czy użytkownik jest zalogowany przy montowaniu komponentu.
   */
  useEffect(() => {
    sprawdzAutoryzacje();
  }, []);

  /**
   * Sprawdzenie stanu autoryzacji.
   */
  const sprawdzAutoryzacje = async () => {
    try {
      if (serwisAutoryzacji.czyZalogowany()) {
        const daneUzytkownika = await serwisAutoryzacji.pobierzAktualnegoUzytkownika();
        setUzytkownik(daneUzytkownika);
        setZalogowany(true);
      }
    } catch (error) {
      console.error('Błąd przy sprawdzaniu autoryzacji:', error);
      // Wyczyść nieprawidłowe tokeny
      await serwisAutoryzacji.wylogowanie();
    } finally {
      setLadowanie(false);
    }
  };

  /**
   * Rejestracja nowego użytkownika.
   */
  const rejestracja = async (dane: UzytkownikRejestracja) => {
    try {
      const odpowiedz = await serwisAutoryzacji.rejestracja(dane);
      setUzytkownik(odpowiedz.uzytkownik);
      setZalogowany(true);
    } catch (error) {
      console.error('Błąd rejestracji:', error);
      throw error;
    }
  };

  /**
   * Logowanie użytkownika.
   */
  const logowanie = async (dane: UzytkownikLogowanie) => {
    try {
      const odpowiedz = await serwisAutoryzacji.logowanie(dane);
      setUzytkownik(odpowiedz.uzytkownik);
      setZalogowany(true);
    } catch (error) {
      console.error('Błąd logowania:', error);
      throw error;
    }
  };

  /**
   * Wylogowanie użytkownika.
   */
  const wylogowanie = async () => {
    try {
      await serwisAutoryzacji.wylogowanie();
      setUzytkownik(null);
      setZalogowany(false);
    } catch (error) {
      console.error('Błąd wylogowania:', error);
      throw error;
    }
  };

  /**
   * Odświeżenie danych użytkownika.
   */
  const odswiezUzytkownika = async () => {
    try {
      const daneUzytkownika = await serwisAutoryzacji.pobierzAktualnegoUzytkownika();
      setUzytkownik(daneUzytkownika);
    } catch (error) {
      console.error('Błąd przy odświeżaniu użytkownika:', error);
      throw error;
    }
  };

  const wartosc: AuthContextType = {
    uzytkownik,
    ladowanie,
    zalogowany,
    rejestracja,
    logowanie,
    wylogowanie,
    odswiezUzytkownika,
  };

  return <AuthContext.Provider value={wartosc}>{children}</AuthContext.Provider>;
};

/**
 * Hook do użycia kontekstu autoryzacji.
 * Zgodnie z wzorcem Custom Hooks React.
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth musi być użyty wewnątrz AuthProvider');
  }
  
  return context;
};
