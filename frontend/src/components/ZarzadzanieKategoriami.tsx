/**
 * Modal zarządzania kategoriami - według makiety.
 * Widoczny tylko dla adminów.
 */
import React, { useState, useEffect } from 'react';
import serwisForumService from '../services/serwisForumService';
import type { Kategoria } from '../services/serwisForumService';
import './Modal.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const ZarzadzanieKategoriami: React.FC<Props> = ({ isOpen, onClose }) => {
    const [kategorie, setKategorie] = useState<Kategoria[]>([]);
    const [ladowanie, setLadowanie] = useState(false);
    const [blad, setBlad] = useState<string | null>(null);
    const [edytowanaKategoria, setEdytowanaKategoria] = useState<number | null>(null);
    const [nowaKategoria, setNowaKategoria] = useState({ nazwa: '', opis: '' });
    const [pokazFormularz, setPokazFormularz] = useState(false);

    useEffect(() => {
        if (isOpen) {
            pobierzKategorie();
        }
    }, [isOpen]);

    const pobierzKategorie = async () => {
        try {
            setLadowanie(true);
            const dane = await serwisForumService.pobierzKategorieAdmin();
            console.log('Pobrane kategorie:', dane); // Debug
            setKategorie(Array.isArray(dane) ? dane : []);
        } catch (error) {
            console.error('Błąd pobierania kategorii:', error);
            setBlad('Nie udało się pobrać kategorii.');
            setKategorie([]);
        } finally {
            setLadowanie(false);
        }
    };

    const handleDodaj = async () => {
        if (!nowaKategoria.nazwa.trim()) {
            setBlad('Nazwa kategorii jest wymagana.');
            return;
        }

        try {
            // Upewnij się, że dane są w poprawnym formacie
            const dane = {
                nazwa: nowaKategoria.nazwa.trim(),
                opis: nowaKategoria.opis.trim() || '' // Pusty string jeśli brak opisu
            };

            await serwisForumService.utworzKategorie(dane);
            setNowaKategoria({ nazwa: '', opis: '' });
            setPokazFormularz(false);
            setBlad(null);
            pobierzKategorie();
        } catch (error: any) {
            console.error('Błąd dodawania kategorii:', error);
            // Pokaż szczegółowy błąd z backendu jeśli dostępny
            const bladWiadomosc = error.response?.data?.nazwa?.[0]
                || error.response?.data?.opis?.[0]
                || error.response?.data?.detail
                || 'Nie udało się dodać kategorii.';
            setBlad(bladWiadomosc);
        }
    };

    const handleEdytuj = async (id: number, nazwa: string, opis: string) => {
        try {
            await serwisForumService.aktualizujKategorie(id, { nazwa, opis });
            setEdytowanaKategoria(null);
            pobierzKategorie();
        } catch (error) {
            console.error('Błąd edycji kategorii:', error);
            setBlad('Nie udało się edytować kategorii.');
        }
    };

    const handleUsun = async (id: number) => {
        if (!window.confirm('Czy na pewno chcesz usunąć tę kategorię?')) {
            return;
        }

        try {
            await serwisForumService.usunKategorie(id);
            pobierzKategorie();
        } catch (error) {
            console.error('Błąd usuwania kategorii:', error);
            setBlad('Nie udało się usunąć kategorii.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Makieta GUI – zarządzanie kategoriami</h2>
                    <button onClick={onClose} className="modal-close">×</button>
                </div>

                <div className="modal-body">
                    <div className="modal-section-header">
                        <h3>Kategorie</h3>
                        <button onClick={() => setPokazFormularz(!pokazFormularz)} className="btn-add">
                            Dodaj kategorię
                        </button>
                    </div>

                    {pokazFormularz && (
                        <div className="add-form">
                            <input
                                type="text"
                                placeholder="Nazwa kategorii"
                                value={nowaKategoria.nazwa}
                                onChange={(e) => setNowaKategoria({ ...nowaKategoria, nazwa: e.target.value })}
                                className="form-input"
                            />
                            <input
                                type="text"
                                placeholder="Opis kategorii"
                                value={nowaKategoria.opis}
                                onChange={(e) => setNowaKategoria({ ...nowaKategoria, opis: e.target.value })}
                                className="form-input"
                            />
                            <div className="form-actions">
                                <button onClick={handleDodaj} className="btn-save">Zapisz</button>
                                <button onClick={() => setPokazFormularz(false)} className="btn-cancel">Anuluj</button>
                            </div>
                        </div>
                    )}

                    {blad && <div className="error-message">{blad}</div>}

                    {ladowanie ? (
                        <p>Ładowanie...</p>
                    ) : kategorie.length === 0 ? (
                        <p className="empty-state">Brak kategorii. Dodaj pierwszą kategorię używając przycisku powyżej.</p>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Nazwa</th>
                                    <th>Opis</th>
                                    <th>Akcje</th>
                                </tr>
                            </thead>
                            <tbody>
                                {kategorie.map((kategoria) => (
                                    <tr key={kategoria.id}>
                                        {edytowanaKategoria === kategoria.id ? (
                                            <>
                                                <td>
                                                    <input
                                                        type="text"
                                                        defaultValue={kategoria.nazwa}
                                                        id={`edit-nazwa-${kategoria.id}`}
                                                        className="form-input"
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        defaultValue={kategoria.opis}
                                                        id={`edit-opis-${kategoria.id}`}
                                                        className="form-input"
                                                    />
                                                </td>
                                                <td>
                                                    <button
                                                        onClick={() => {
                                                            const nazwa = (document.getElementById(`edit-nazwa-${kategoria.id}`) as HTMLInputElement).value;
                                                            const opis = (document.getElementById(`edit-opis-${kategoria.id}`) as HTMLInputElement).value;
                                                            handleEdytuj(kategoria.id, nazwa, opis);
                                                        }}
                                                        className="btn-save-small"
                                                    >
                                                        Zapisz
                                                    </button>
                                                    <button
                                                        onClick={() => setEdytowanaKategoria(null)}
                                                        className="btn-cancel-small"
                                                    >
                                                        Anuluj
                                                    </button>
                                                </td>
                                            </>
                                        ) : (
                                            <>
                                                <td>{kategoria.nazwa}</td>
                                                <td>{kategoria.opis}</td>
                                                <td>
                                                    <button
                                                        onClick={() => setEdytowanaKategoria(kategoria.id)}
                                                        className="btn-edit-table"
                                                    >
                                                        Edytuj
                                                    </button>
                                                    <button
                                                        onClick={() => handleUsun(kategoria.id)}
                                                        className="btn-delete-table"
                                                    >
                                                        Usuń
                                                    </button>
                                                </td>
                                            </>
                                        )}
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

export default ZarzadzanieKategoriami;
