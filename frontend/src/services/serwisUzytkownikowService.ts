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
}

// Eksport instancji serwisu (Singleton pattern - YAGNI)
export default new SerwisUzytkownikowService();
