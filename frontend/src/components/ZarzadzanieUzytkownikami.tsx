/**
 * Modal zarządzania użytkownikami - według makiety.
 * Widoczny tylko dla adminów.
 */
import React, { useState, useEffect } from 'react';
import serwisUzytkownikowService from '../services/serwisUzytkownikowService';
import type { UzytkownikLista } from '../services/serwisUzytkownikowService';
import './Modal.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const ZarzadzanieUzytkownikami: React.FC<Props> = ({ isOpen, onClose }) => {
    const [uzytkownicy, setUzytkownicy] = useState<UzytkownikLista[]>([]);
    const [ladowanie, setLadowanie] = useState(false);
    const [blad, setBlad] = useState<string | null>(null);
    const [szukaj, setSzukaj] = useState('');

    useEffect(() => {
        if (isOpen) {
            pobierzUzytkownikow();
        }
    }, [isOpen]);

    const pobierzUzytkownikow = async () => {
        try {
            setLadowanie(true);
            const dane = await serwisUzytkownikowService.pobierzUzytkownikow();
            console.log('Pobrani użytkownicy:', dane); // Debug
            // Upewnij się, że dane to tablica (obsługa błędów - Clean Code)
            setUzytkownicy(Array.isArray(dane) ? dane : []);
        } catch (error) {
            console.error('Błąd pobierania użytkowników:', error);
            setBlad('Nie udało się pobrać użytkowników.');
            setUzytkownicy([]); // Ustaw pustą tablicę w przypadku błędu
        } finally {
            setLadowanie(false);
        }
    };

    // Bezpieczne filtrowanie - upewnij się, że uzytkownicy to tablica
    const filtrowaniUzytkownicy = Array.isArray(uzytkownicy)
        ? uzytkownicy.filter((user) =>
            user.username.toLowerCase().includes(szukaj.toLowerCase()) ||
            user.email.toLowerCase().includes(szukaj.toLowerCase())
        )
        : [];

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Makieta GUI – zarządzanie użytkownikami</h2>
                    <button onClick={onClose} className="modal-close">×</button>
                </div>

                <div className="modal-body">
                    <div className="modal-section-header">
                        <h3>Lista użytkowników</h3>
                        <input
                            type="text"
                            placeholder="Szukaj..."
                            value={szukaj}
                            onChange={(e) => setSzukaj(e.target.value)}
                            className="search-input"
                        />
                    </div>

                    {blad && <div className="error-message">{blad}</div>}

                    {ladowanie ? (
                        <p>Ładowanie...</p>
                    ) : filtrowaniUzytkownicy.length === 0 ? (
                        <p className="empty-state">
                            {szukaj ? 'Nie znaleziono użytkowników.' : 'Brak użytkowników.'}
                        </p>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nazwa</th>
                                    <th>E-mail</th>
                                    <th>Rola</th>
                                    <th>Status</th>
                                    <th>Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtrowaniUzytkownicy.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.username}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`role-badge-table ${user.rola.toLowerCase()}`}>
                                                {user.rola}
                                            </span>
                                        </td>
                                        <td>Aktywny</td>
                                        <td>
                                            <button className="btn-action-table">Zablokuj</button>
                                            <button className="btn-action-table">Zmień dane</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ZarzadzanieUzytkownikami;
