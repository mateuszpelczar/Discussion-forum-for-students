/**
 * Panel Admina - zarządzanie użytkownikami i kategoriami.
 * Widoczny tylko dla użytkowników z rolą ADMIN.
 * Zgodnie z zasadami SOLID i Clean Code.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import serwisForumService from '../services/serwisForumService';
import serwisUzytkownikowService from '../services/serwisUzytkownikowService';
import type { Kategoria } from '../services/serwisForumService';
import type { UzytkownikLista } from '../services/serwisUzytkownikowService';
import './PanelAdmina.css';

const PanelAdmina: React.FC = () => {
    const navigate = useNavigate();
    const { uzytkownik } = useAuth();

    // Przekierowanie jeśli nie admin (zabezpieczenie)
    useEffect(() => {
        if (uzytkownik && uzytkownik.rola !== 'ADMIN') {
            navigate('/');
        }
    }, [uzytkownik, navigate]);

    // Stan dla kategorii (KISS - proste zarządzanie stanem)
    const [kategorie, ustawKategorie] = useState<Kategoria[]>([]);
    const [nowaKategoria, ustawNowaKategorie] = useState({ nazwa: '', opis: '' });
    const [edytowanaKategoria, ustawEdytowanaKategorie] = useState<number | null>(null);
    const [ladowanieKategorii, ustawLadowanieKategorii] = useState(false);

    // Stan dla użytkowników
    const [uzytkownicy, ustawUzytkownikow] = useState<UzytkownikLista[]>([]);
    const [filtrRoli, ustawFiltrRoli] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');
    const [ladowanieUzytkownikow, ustawLadowanieUzytkownikow] = useState(false);

    // Stan błędów i komunikatów
    const [blad, ustawBlad] = useState<string | null>(null);
    const [sukces, ustawSukces] = useState<string | null>(null);

    /**
     * Pobieranie kategorii przy montowaniu komponentu.
     * Zgodnie z zasadą Single Responsibility.
     */
    useEffect(() => {
        pobierzKategorie();
        pobierzUzytkownikow();
    }, []);

    /**
     * Pobieranie użytkowników przy zmianie filtra.
     */
    useEffect(() => {
        pobierzUzytkownikow();
    }, [filtrRoli]);

    const pobierzKategorie = async () => {
        try {
            ustawLadowanieKategorii(true);
            const dane = await serwisForumService.pobierzKategorieAdmin();
            // Upewnij się, że dane to tablica (obsługa błędów - Clean Code)
            ustawKategorie(Array.isArray(dane) ? dane : []);
        } catch (error) {
            console.error('Błąd pobierania kategorii:', error);
            ustawBlad('Nie udało się pobrać kategorii.');
            ustawKategorie([]); // Ustaw pustą tablicę w przypadku błędu
        } finally {
            ustawLadowanieKategorii(false);
        }
    };

    const pobierzUzytkownikow = async () => {
        try {
            ustawLadowanieUzytkownikow(true);
            const rola = filtrRoli === 'ALL' ? undefined : filtrRoli;
            const dane = await serwisUzytkownikowService.pobierzUzytkownikow(rola);
            ustawUzytkownikow(dane);
        } catch (error) {
            console.error('Błąd pobierania użytkowników:', error);
            ustawBlad('Nie udało się pobrać użytkowników.');
        } finally {
            ustawLadowanieUzytkownikow(false);
        }
    };

    const handleDodajKategorie = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nowaKategoria.nazwa.trim()) {
            ustawBlad('Nazwa kategorii jest wymagana.');
            return;
        }

        try {
            await serwisForumService.utworzKategorie(nowaKategoria);
            ustawSukces('Kategoria została dodana.');
            ustawNowaKategorie({ nazwa: '', opis: '' });
            pobierzKategorie();

            // Ukryj komunikat po 3 sekundach
            setTimeout(() => ustawSukces(null), 3000);
        } catch (error) {
            console.error('Błąd dodawania kategorii:', error);
            ustawBlad('Nie udało się dodać kategorii.');
        }
    };

    const handleUsunKategorie = async (id: number) => {
        if (!window.confirm('Czy na pewno chcesz usunąć tę kategorię?')) {
            return;
        }

        try {
            await serwisForumService.usunKategorie(id);
            ustawSukces('Kategoria została usunięta.');
            pobierzKategorie();

            setTimeout(() => ustawSukces(null), 3000);
        } catch (error) {
            console.error('Błąd usuwania kategorii:', error);
            ustawBlad('Nie udało się usunąć kategorii.');
        }
    };

    const handleEdytujKategorie = async (id: number, dane: { nazwa: string; opis: string }) => {
        try {
            await serwisForumService.aktualizujKategorie(id, dane);
            ustawSukces('Kategoria została zaktualizowana.');
            ustawEdytowanaKategorie(null);
            pobierzKategorie();

            setTimeout(() => ustawSukces(null), 3000);
        } catch (error) {
            console.error('Błąd aktualizacji kategorii:', error);
            ustawBlad('Nie udało się zaktualizować kategorii.');
        }
    };

    /**
     * Formatowanie daty (DRY - reużywalna funkcja).
     */
    const formatujDate = (dataString: string): string => {
        const data = new Date(dataString);
        return data.toLocaleDateString('pl-PL');
    };

    // Jeśli nie admin, nie renderuj nic (dodatkowe zabezpieczenie)
    if (!uzytkownik || uzytkownik.rola !== 'ADMIN') {
        return null;
    }

    return (
        <div className="admin-container">
            {/* Header */}
            <header className="admin-header">
                <div className="header-content">
                    <h1>Panel Administracyjny</h1>
                    <button onClick={() => navigate('/')} className="btn-back">
                        ← Powrót do forum
                    </button>
                </div>
            </header>

            {/* Komunikaty */}
            {blad && (
                <div className="alert alert-error">
                    {blad}
                    <button onClick={() => ustawBlad(null)} className="alert-close">×</button>
                </div>
            )}
            {sukces && (
                <div className="alert alert-success">
                    {sukces}
                </div>
            )}

            {/* Główna zawartość */}
            <div className="admin-content">
                {/* Sekcja kategorii */}
                <section className="admin-section">
                    <h2>Zarządzanie Kategoriami</h2>

                    {/* Formularz dodawania */}
                    <form onSubmit={handleDodajKategorie} className="category-form">
                        <div className="form-group">
                            <label htmlFor="nazwa">Nazwa kategorii</label>
                            <input
                                type="text"
                                id="nazwa"
                                value={nowaKategoria.nazwa}
                                onChange={(e) => ustawNowaKategorie({ ...nowaKategoria, nazwa: e.target.value })}
                                placeholder="np. Pytania ogólne"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="opis">Opis</label>
                            <textarea
                                id="opis"
                                value={nowaKategoria.opis}
                                onChange={(e) => ustawNowaKategorie({ ...nowaKategoria, opis: e.target.value })}
                                placeholder="Krótki opis kategorii"
                                rows={3}
                            />
                        </div>
                        <button type="submit" className="btn-primary">
                            Dodaj kategorię
                        </button>
                    </form>

                    {/* Lista kategorii */}
                    <div className="category-list">
                        {ladowanieKategorii ? (
                            <p>Ładowanie kategorii...</p>
                        ) : kategorie.length === 0 ? (
                            <p className="empty-state">Brak kategorii</p>
                        ) : (
                            kategorie.map((kategoria) => (
                                <div key={kategoria.id} className="category-item">
                                    {edytowanaKategoria === kategoria.id ? (
                                        <div className="category-edit">
                                            <input
                                                type="text"
                                                defaultValue={kategoria.nazwa}
                                                id={`edit-nazwa-${kategoria.id}`}
                                            />
                                            <textarea
                                                defaultValue={kategoria.opis}
                                                id={`edit-opis-${kategoria.id}`}
                                                rows={2}
                                            />
                                            <div className="category-actions">
                                                <button
                                                    onClick={() => {
                                                        const nazwa = (document.getElementById(`edit-nazwa-${kategoria.id}`) as HTMLInputElement).value;
                                                        const opis = (document.getElementById(`edit-opis-${kategoria.id}`) as HTMLTextAreaElement).value;
                                                        handleEdytujKategorie(kategoria.id, { nazwa, opis });
                                                    }}
                                                    className="btn-save"
                                                >
                                                    Zapisz
                                                </button>
                                                <button
                                                    onClick={() => ustawEdytowanaKategorie(null)}
                                                    className="btn-cancel"
                                                >
                                                    Anuluj
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="category-info">
                                                <h3>{kategoria.nazwa}</h3>
                                                <p>{kategoria.opis}</p>
                                                {kategoria.liczba_watkow !== undefined && (
                                                    <span className="category-stats">
                                                        Wątków: {kategoria.liczba_watkow}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="category-actions">
                                                <button
                                                    onClick={() => ustawEdytowanaKategorie(kategoria.id)}
                                                    className="btn-edit"
                                                >
                                                    Edytuj
                                                </button>
                                                <button
                                                    onClick={() => handleUsunKategorie(kategoria.id)}
                                                    className="btn-delete"
                                                >
                                                    Usuń
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </section>

                {/* Sekcja użytkowników */}
                <section className="admin-section">
                    <h2>Zarządzanie Użytkownikami</h2>

                    {/* Filtry */}
                    <div className="user-filters">
                        <button
                            onClick={() => ustawFiltrRoli('ALL')}
                            className={`filter-btn ${filtrRoli === 'ALL' ? 'active' : ''}`}
                        >
                            Wszyscy ({uzytkownicy.length})
                        </button>
                        <button
                            onClick={() => ustawFiltrRoli('ADMIN')}
                            className={`filter-btn ${filtrRoli === 'ADMIN' ? 'active' : ''}`}
                        >
                            Administratorzy
                        </button>
                        <button
                            onClick={() => ustawFiltrRoli('USER')}
                            className={`filter-btn ${filtrRoli === 'USER' ? 'active' : ''}`}
                        >
                            Użytkownicy
                        </button>
                    </div>

                    {/* Lista użytkowników */}
                    <div className="user-list">
                        {ladowanieUzytkownikow ? (
                            <p>Ładowanie użytkowników...</p>
                        ) : uzytkownicy.length === 0 ? (
                            <p className="empty-state">Brak użytkowników</p>
                        ) : (
                            <table className="user-table">
                                <thead>
                                    <tr>
                                        <th>Username</th>
                                        <th>Email</th>
                                        <th>Rola</th>
                                        <th>Data dołączenia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {uzytkownicy.map((user) => (
                                        <tr key={user.id}>
                                            <td>{user.username}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`role-badge ${user.rola.toLowerCase()}`}>
                                                    {user.rola}
                                                </span>
                                            </td>
                                            <td>{formatujDate(user.date_joined)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default PanelAdmina;
