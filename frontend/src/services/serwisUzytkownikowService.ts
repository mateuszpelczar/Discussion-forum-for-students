/**
 * Serwis użytkowników - zarządzanie użytkownikami.
 * Zgodnie z zasadą Single Responsibility Principle.
 */
import axiosInstance from '../utils/axios';
import type { Autor } from './serwisForumService';

/**
 * Interfejs profilu użytkownika.
 */
export interface Profil {
    avatar?: string;
    wydzial?: string;
    rok_studiow?: number;
    opis?: string;
}

/**
 * Interfejs użytkownika na liście (rozszerzony o profil).
 */
export interface UzytkownikLista extends Autor {
    date_joined: string;
    profil: Profil;
    is_active: boolean;
    first_name?: string;
    last_name?: string;
}

/**
 * Dane do aktualizacji użytkownika przez admina.
 */
export interface AdminAktualizacjaUzytkownika {
    username?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    rola?: 'ADMIN' | 'USER';
    is_active?: boolean;
    // Pola profilu
    wydzial?: string;
    rok_studiow?: number | null;
    opis?: string;
}

/**
 * Klasa serwisu użytkowników.
 * Zawiera metody do pobierania i zarządzania użytkownikami.
 * Zgodnie z zasadą Single Responsibility - tylko komunikacja z API użytkowników.
 */
class SerwisUzytkownikowService {
    /**
   * Pobiera listę użytkowników z opcjonalnym filtrowaniem.
   * @param rola - Filtrowanie po roli: 'ADMIN' lub 'USER' (opcjonalne)
   * @param search - Wyszukiwanie po username (opcjonalne)
   */
    async pobierzUzytkownikow(rola?: 'ADMIN' | 'USER', search?: string): Promise<UzytkownikLista[]> {
        const params: Record<string, string> = {};

        if (rola) {
            params.rola = rola;
        }

        if (search) {
            params.search = search;
        }

        const odpowiedz = await axiosInstance.get<any>('/uzytkownicy/', { params });
        // Backend zwraca paginowane dane: {count, next, previous, results}
        return odpowiedz.data.results || odpowiedz.data;
    }

    /**
     * Pobiera szczegóły użytkownika.
     * @param id - ID użytkownika
     */
    async pobierzUzytkownika(id: number): Promise<UzytkownikLista> {
        const odpowiedz = await axiosInstance.get<UzytkownikLista>(`/uzytkownicy/${id}/`);
        return odpowiedz.data;
    }

    /**
     * Aktualizuje dane użytkownika (tylko admin).
     * @param id - ID użytkownika
     * @param dane - Dane do aktualizacji
     */
    async aktualizujUzytkownika(id: number, dane: AdminAktualizacjaUzytkownika): Promise<UzytkownikLista> {
        const odpowiedz = await axiosInstance.patch<{ wiadomosc: string; uzytkownik: UzytkownikLista }>(
            `/admin/uzytkownicy/${id}/`,
            dane
        );
        return odpowiedz.data.uzytkownik;
    }

    /**
     * Blokuje użytkownika (tylko admin).
     * @param id - ID użytkownika
     */
    async zablokujUzytkownika(id: number): Promise<UzytkownikLista> {
        const odpowiedz = await axiosInstance.post<{ wiadomosc: string; uzytkownik: UzytkownikLista }>(
            `/admin/uzytkownicy/${id}/zablokuj/`
        );
        return odpowiedz.data.uzytkownik;
    }

    /**
     * Odblokowuje użytkownika (tylko admin).
     * @param id - ID użytkownika
     */
    async odblokujUzytkownika(id: number): Promise<UzytkownikLista> {
        const odpowiedz = await axiosInstance.post<{ wiadomosc: string; uzytkownik: UzytkownikLista }>(
            `/admin/uzytkownicy/${id}/odblokuj/`
        );
        return odpowiedz.data.uzytkownik;
    }
}

// Eksport instancji serwisu (Singleton pattern - YAGNI)
export default new SerwisUzytkownikowService();

