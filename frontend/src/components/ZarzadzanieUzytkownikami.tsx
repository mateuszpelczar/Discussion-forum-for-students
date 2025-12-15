/**
 * Modal zarządzania użytkownikami - według makiety.
 * Widoczny tylko dla adminów.
 * Umożliwia blokowanie/odblokowywanie użytkowników oraz zmianę danych.
 */
import React, { useState, useEffect } from 'react';
import serwisUzytkownikowService from '../services/serwisUzytkownikowService';
import type { UzytkownikLista, AdminAktualizacjaUzytkownika } from '../services/serwisUzytkownikowService';
import './Modal.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const ZarzadzanieUzytkownikami: React.FC<Props> = ({ isOpen, onClose }) => {
    const [uzytkownicy, setUzytkownicy] = useState<UzytkownikLista[]>([]);
    const [ladowanie, setLadowanie] = useState(false);
    const [blad, setBlad] = useState<string | null>(null);
    const [sukces, setSukces] = useState<string | null>(null);
    const [szukaj, setSzukaj] = useState('');

    // Stan dla modalu edycji
    const [edytowanyUzytkownik, setEdytowanyUzytkownik] = useState<UzytkownikLista | null>(null);
    const [daneEdycji, setDaneEdycji] = useState<AdminAktualizacjaUzytkownika>({});
    const [ladowanieAkcji, setLadowanieAkcji] = useState(false);

    useEffect(() => {
        if (isOpen) {
            pobierzUzytkownikow();
        }
    }, [isOpen]);

    const pobierzUzytkownikow = async () => {
        try {
            setLadowanie(true);
            setBlad(null);
            const dane = await serwisUzytkownikowService.pobierzUzytkownikow();
            console.log('Pobrani użytkownicy:', dane);
            setUzytkownicy(Array.isArray(dane) ? dane : []);
        } catch (error) {
            console.error('Błąd pobierania użytkowników:', error);
            setBlad('Nie udało się pobrać użytkowników.');
            setUzytkownicy([]);
        } finally {
            setLadowanie(false);
        }
    };

    /**
     * Obsługa blokowania/odblokowywania użytkownika.
     */
    const handleToggleBlokada = async (user: UzytkownikLista) => {
        try {
            setLadowanieAkcji(true);
            setBlad(null);

            let zaktualizowanyUzytkownik: UzytkownikLista;

            if (user.is_active) {
                zaktualizowanyUzytkownik = await serwisUzytkownikowService.zablokujUzytkownika(user.id);
                setSukces(`Użytkownik ${user.username} został zablokowany.`);
            } else {
                zaktualizowanyUzytkownik = await serwisUzytkownikowService.odblokujUzytkownika(user.id);
                setSukces(`Użytkownik ${user.username} został odblokowany.`);
            }

            // Aktualizacja listy użytkowników
            setUzytkownicy(prev =>
                prev.map(u => u.id === zaktualizowanyUzytkownik.id ? zaktualizowanyUzytkownik : u)
            );

            setTimeout(() => setSukces(null), 3000);
        } catch (error: any) {
            console.error('Błąd zmiany statusu użytkownika:', error);
            const errorMsg = error.response?.data?.error || 'Nie udało się zmienić statusu użytkownika.';
            setBlad(errorMsg);
            setTimeout(() => setBlad(null), 5000);
        } finally {
            setLadowanieAkcji(false);
        }
    };

    /**
     * Otwiera modal edycji użytkownika.
     */
    const handleOtworzEdycje = (user: UzytkownikLista) => {
        setEdytowanyUzytkownik(user);
        setDaneEdycji({
            username: user.username,
            email: user.email,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            rola: user.rola,
            // Pola profilu
            wydzial: user.profil?.wydzial || '',
            rok_studiow: user.profil?.rok_studiow || null,
            opis: user.profil?.opis || ''
        });
    };

    /**
     * Zamyka modal edycji.
     */
    const handleZamknijEdycje = () => {
        setEdytowanyUzytkownik(null);
        setDaneEdycji({});
    };

    /**
     * Zapisuje zmiany w danych użytkownika.
     */
    const handleZapiszEdycje = async () => {
        if (!edytowanyUzytkownik) return;

        try {
            setLadowanieAkcji(true);
            setBlad(null);

            const zaktualizowanyUzytkownik = await serwisUzytkownikowService.aktualizujUzytkownika(
                edytowanyUzytkownik.id,
                daneEdycji
            );

            // Aktualizacja listy użytkowników
            setUzytkownicy(prev =>
                prev.map(u => u.id === zaktualizowanyUzytkownik.id ? zaktualizowanyUzytkownik : u)
            );

            setSukces(`Dane użytkownika ${zaktualizowanyUzytkownik.username} zostały zaktualizowane.`);
            handleZamknijEdycje();

            setTimeout(() => setSukces(null), 3000);
        } catch (error: any) {
            console.error('Błąd aktualizacji użytkownika:', error);
            const errorMsg = error.response?.data?.error ||
                error.response?.data?.username?.[0] ||
                error.response?.data?.email?.[0] ||
                'Nie udało się zaktualizować danych użytkownika.';
            setBlad(errorMsg);
            setTimeout(() => setBlad(null), 5000);
        } finally {
            setLadowanieAkcji(false);
        }
    };

    // Bezpieczne filtrowanie
    const filtrowaniUzytkownicy = Array.isArray(uzytkownicy)
        ? uzytkownicy.filter((user) =>
            user.username.toLowerCase().includes(szukaj.toLowerCase()) ||
            user.email.toLowerCase().includes(szukaj.toLowerCase())
        )
        : [];

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content modal-lg" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Zarządzanie użytkownikami</h2>
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
                    {sukces && <div className="success-message">{sukces}</div>}

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
                                        <td>
                                            <span className={`status-badge ${user.is_active ? 'active' : 'blocked'}`}>
                                                {user.is_active ? 'Aktywny' : 'Zablokowany'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className={`btn-action-table ${user.is_active ? 'btn-danger' : 'btn-success'}`}
                                                onClick={() => handleToggleBlokada(user)}
                                                disabled={ladowanieAkcji}
                                            >
                                                {user.is_active ? 'Zablokuj' : 'Odblokuj'}
                                            </button>
                                            <button
                                                className="btn-action-table"
                                                onClick={() => handleOtworzEdycje(user)}
                                                disabled={ladowanieAkcji}
                                            >
                                                Zmień dane
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* Modal edycji użytkownika */}
            {edytowanyUzytkownik && (
                <div className="modal-overlay nested" onClick={handleZamknijEdycje}>
                    <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()} style={{ backgroundColor: '#ffffff' }}>
                        <div className="modal-header">
                            <h2 style={{ color: '#000000' }}>Edycja użytkownika</h2>
                            <button onClick={handleZamknijEdycje} className="modal-close">×</button>
                        </div>
                        <div className="modal-body" style={{ color: '#000000' }}>
                            <div className="form-group">
                                <label style={{ color: '#000000', fontWeight: 600 }}>Nazwa użytkownika</label>
                                <input
                                    type="text"
                                    value={daneEdycji.username || ''}
                                    onChange={(e) => setDaneEdycji({ ...daneEdycji, username: e.target.value })}
                                    className="form-input"
                                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ color: '#000000', fontWeight: 600 }}>E-mail</label>
                                <input
                                    type="email"
                                    value={daneEdycji.email || ''}
                                    onChange={(e) => setDaneEdycji({ ...daneEdycji, email: e.target.value })}
                                    className="form-input"
                                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ color: '#000000', fontWeight: 600 }}>Imię</label>
                                <input
                                    type="text"
                                    value={daneEdycji.first_name || ''}
                                    onChange={(e) => setDaneEdycji({ ...daneEdycji, first_name: e.target.value })}
                                    className="form-input"
                                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ color: '#000000', fontWeight: 600 }}>Nazwisko</label>
                                <input
                                    type="text"
                                    value={daneEdycji.last_name || ''}
                                    onChange={(e) => setDaneEdycji({ ...daneEdycji, last_name: e.target.value })}
                                    className="form-input"
                                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                                />
                            </div>
                            <div className="form-group">
                                <label style={{ color: '#000000', fontWeight: 600 }}>Rola</label>
                                <select
                                    value={daneEdycji.rola || 'USER'}
                                    onChange={(e) => setDaneEdycji({ ...daneEdycji, rola: e.target.value as 'ADMIN' | 'USER' })}
                                    className="form-input"
                                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                                >
                                    <option value="USER">Użytkownik</option>
                                    <option value="ADMIN">Administrator</option>
                                </select>
                            </div>

                            {/* Pola profilu */}
                            <div className="form-group">
                                <label style={{ color: '#000000', fontWeight: 600 }}>Wydział</label>
                                <select
                                    value={daneEdycji.wydzial || ''}
                                    onChange={(e) => setDaneEdycji({ ...daneEdycji, wydzial: e.target.value })}
                                    className="form-input"
                                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                                >
                                    <option value="">Brak</option>
                                    <option value="Informatyka">Wydział Informatyki</option>
                                    <option value="Ekonomia">Wydział Ekonomii</option>
                                    <option value="Zarządzanie">Wydział Zarządzania</option>
                                    <option value="Prawo">Wydział Prawa</option>
                                    <option value="Pedagogika">Wydział Pedagogiki</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ color: '#000000', fontWeight: 600 }}>Rok studiów</label>
                                <select
                                    value={daneEdycji.rok_studiow?.toString() || ''}
                                    onChange={(e) => setDaneEdycji({
                                        ...daneEdycji,
                                        rok_studiow: e.target.value ? parseInt(e.target.value) : null
                                    })}
                                    className="form-input"
                                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                                >
                                    <option value="">Brak</option>
                                    <option value="1">1 rok</option>
                                    <option value="2">2 rok</option>
                                    <option value="3">3 rok</option>
                                    <option value="4">4 rok</option>
                                    <option value="5">5 rok</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label style={{ color: '#000000', fontWeight: 600 }}>O mnie</label>
                                <textarea
                                    value={daneEdycji.opis || ''}
                                    onChange={(e) => setDaneEdycji({ ...daneEdycji, opis: e.target.value })}
                                    className="form-input form-textarea"
                                    rows={3}
                                    placeholder="Opis użytkownika..."
                                    style={{ color: '#000000', backgroundColor: '#ffffff' }}
                                />
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button
                                className="btn-cancel"
                                onClick={handleZamknijEdycje}
                                disabled={ladowanieAkcji}
                            >
                                Anuluj
                            </button>
                            <button
                                className="btn-save"
                                onClick={handleZapiszEdycje}
                                disabled={ladowanieAkcji}
                            >
                                {ladowanieAkcji ? 'Zapisywanie...' : 'Zapisz zmiany'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ZarzadzanieUzytkownikami;
