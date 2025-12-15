/**
 * Serwis forum - wszystkie funkcje związane z forum.
 * Zgodnie z zasadą Single Responsibility Principle.
 * Wzorowany na serwisAutoryzacji.ts dla spójności (DRY).
 */
import axiosInstance from '../utils/axios';

/**
 * Interfejs autora wątku/postu.
 */
export interface Autor {
  id: number;
  username: string;
  email: string;
  first_name?: string;
  last_name?: string;
  rola: 'USER' | 'ADMIN';
}

/**
 * Interfejs kategorii.
 */
export interface Kategoria {
  id: number;
  nazwa: string;
  opis: string;
  liczba_watkow?: number;
  liczba_postow?: number;
}

/**
 * Interfejs wątku (posta na liście).
 */
export interface Watek {
  id: number;
  tytul: string;
  tresc: string;
  autor: Autor;
  kategoria: Kategoria;
  data_utworzenia: string;
  data_aktualizacji: string;
  zablokowany: boolean;
  liczba_postow?: number;
  suma_glosow?: number;
}

/**
 * Interfejs postu w wątku.
 */
export interface Post {
  id: number;
  tresc: string;
  autor: Autor;
  data_utworzenia: string;
  data_aktualizacji: string;
  suma_glosow?: number;
  moj_glos?: number | null;
}

/**
 * Interfejs szczegółów wątku (z postami).
 */
export interface WatekSzczegoly extends Watek {
  posty: Post[];
}

/**
 * Klasa serwisu forum.
 * Zawiera wszystkie metody komunikacji z API forum.
 * Zgodnie z zasadą Single Responsibility - tylko komunikacja z API.
 */
class SerwisForumService {
  /**
   * Pobiera listę kategorii.
   */
  async pobierzKategorie(): Promise<Kategoria[]> {
    const odpowiedz = await axiosInstance.get<any>('/forum/kategorie/');
    // Backend zwraca paginowane dane: {count, next, previous, results}
    return odpowiedz.data.results || odpowiedz.data;
  }

  /**
   * Pobiera listę wątków z opcjonalnym filtrowaniem.
   * @param kategoriaId - ID kategorii do filtrowania (opcjonalne)
   * @param szukaj - Fraza do wyszukiwania (opcjonalne)
   */
  async pobierzWatki(kategoriaId?: number, szukaj?: string): Promise<Watek[]> {
    const params: Record<string, string> = {};

    if (kategoriaId) {
      params.kategoria = kategoriaId.toString();
    }

    if (szukaj) {
      params.szukaj = szukaj;
    }

    const odpowiedz = await axiosInstance.get<any>('/forum/watki/', { params });
    // Backend zwraca paginowane dane: {count, next, previous, results}
    return odpowiedz.data.results || odpowiedz.data;
  }

  /**
   * Pobiera szczegóły wątku z postami.
   * @param watekId - ID wątku
   */
  async pobierzWatek(watekId: number): Promise<WatekSzczegoly> {
    const odpowiedz = await axiosInstance.get<WatekSzczegoly>(`/forum/watki/${watekId}/`);
    return odpowiedz.data;
  }

  /**
   * Tworzy nowy wątek.
   * @param dane - Dane nowego wątku (tytul, tresc, kategoria_id)
   */
  async utworzWatek(dane: {
    tytul: string;
    tresc: string;
    kategoria_id: number;
  }): Promise<Watek> {
    const odpowiedz = await axiosInstance.post<Watek>('/forum/watki/nowy/', dane);
    return odpowiedz.data;
  }

  /**
   * Tworzy nowy post w wątku.
   * @param watekId - ID wątku
   * @param tresc - Treść postu
   */
  async utworzPost(watekId: number, tresc: string): Promise<Post> {
    const odpowiedz = await axiosInstance.post<Post>(
      `/forum/watki/${watekId}/posty/nowy/`,
      { tresc }
    );
    return odpowiedz.data;
  }

  /**
   * Głosuje na post (+1 lub -1).
   * @param postId - ID postu
   * @param wartosc - Wartość głosu (1 lub -1)
   */
  async glosujNaPost(postId: number, wartosc: 1 | -1): Promise<{ wiadomosc: string; wartosc: number }> {
    const odpowiedz = await axiosInstance.post<{ wiadomosc: string; wartosc: number }>(
      `/forum/posty/${postId}/glosuj/`,
      { wartosc }
    );
    return odpowiedz.data;
  }

  /**
   * Pobiera listę postów dla wątku.
   * @param watekId - ID wątku
   */
  async pobierzPostyWatku(watekId: number): Promise<Post[]> {
    const odpowiedz = await axiosInstance.get<any>(`/forum/watki/${watekId}/posty/`);
    return odpowiedz.data.results || odpowiedz.data;
  }

  /**
   * Usuwa post (autor lub admin).
   * @param postId - ID postu
   */
  async usunPost(postId: number): Promise<void> {
    await axiosInstance.delete(`/forum/posty/${postId}/usun/`);
  }

  /**
   * Usuwa wątek (tylko admin).
   * @param watekId - ID wątku
   */
  async usunWatek(watekId: number): Promise<void> {
    await axiosInstance.delete(`/forum/admin/watki/${watekId}/`);
  }

  // ===== METODY ADMINISTRACYJNE =====
  // Zgodnie z OCP (Open/Closed Principle) - rozszerzamy bez modyfikacji istniejących metod

  /**
   * Pobiera listę kategorii dla admina (z możliwością zarządzania).
   * Endpoint: GET /forum/admin/kategorie/
   */
  async pobierzKategorieAdmin(): Promise<Kategoria[]> {
    const odpowiedz = await axiosInstance.get<any>('/forum/admin/kategorie/');
    // Backend zwraca paginowane dane: {count, next, previous, results}
    return odpowiedz.data.results || odpowiedz.data;
  }

  /**
   * Tworzy nową kategorię (tylko admin).
   * @param dane - Dane nowej kategorii (nazwa, opis)
   */
  async utworzKategorie(dane: { nazwa: string; opis: string }): Promise<Kategoria> {
    const odpowiedz = await axiosInstance.post<Kategoria>('/forum/admin/kategorie/', dane);
    return odpowiedz.data;
  }

  /**
   * Aktualizuje kategorię (tylko admin).
   * @param id - ID kategorii
   * @param dane - Dane do aktualizacji (nazwa, opis)
   */
  async aktualizujKategorie(id: number, dane: Partial<{ nazwa: string; opis: string }>): Promise<Kategoria> {
    const odpowiedz = await axiosInstance.patch<Kategoria>(
      `/forum/admin/kategorie/${id}/`,
      dane
    );
    return odpowiedz.data;
  }

  /**
   * Usuwa kategorię (tylko admin).
   * @param id - ID kategorii
   */
  async usunKategorie(id: number): Promise<void> {
    await axiosInstance.delete(`/forum/admin/kategorie/${id}/`);
  }
}

// Eksport instancji serwisu (Singleton pattern - YAGNI, nie potrzebujemy wielu instancji)
export default new SerwisForumService();
