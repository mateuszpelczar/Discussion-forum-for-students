/**
 * Modal dodawania nowego posta - według makiety.
 * Widoczny dla wszystkich zalogowanych użytkowników.
 */
import React, { useState, useEffect } from 'react';
import serwisForumService from '../services/serwisForumService';
import type { Kategoria } from '../services/serwisForumService';
import './Modal.css';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onPostAdded: () => void; // Callback do odświeżenia listy postów
}

const DodajPost: React.FC<Props> = ({ isOpen, onClose, onPostAdded }) => {
    const [kategorie, setKategorie] = useState<Kategoria[]>([]);
    const [ladowanie, setLadowanie] = useState(false);
    const [blad, setBlad] = useState<string | null>(null);

    const [nowyPost, setNowyPost] = useState({
        tytul: '',
        kategoria_id: '',
        tresc: ''
    });

    useEffect(() => {
        if (isOpen) {
            pobierzKategorie();
        }
    }, [isOpen]);

    const pobierzKategorie = async () => {
        try {
            const dane = await serwisForumService.pobierzKategorie();
            setKategorie(Array.isArray(dane) ? dane : []);
        } catch (error) {
            console.error('Błąd pobierania kategorii:', error);
            setBlad('Nie udało się pobrać kategorii.');
        }
    };

    const handleSubmit = async () => {
        // Walidacja
        if (!nowyPost.tytul.trim()) {
            setBlad('Tytuł wątku jest wymagany.');
            return;
        }

        if (!nowyPost.kategoria_id) {
            setBlad('Wybierz kategorię.');
            return;
        }

        if (!nowyPost.tresc.trim()) {
            setBlad('Treść posta jest wymagana.');
            return;
        }

        try {
            setLadowanie(true);
            setBlad(null);

            await serwisForumService.utworzWatek({
                tytul: nowyPost.tytul.trim(),
                tresc: nowyPost.tresc.trim(),
                kategoria_id: parseInt(nowyPost.kategoria_id)
            });

            // Reset formularza
            setNowyPost({ tytul: '', kategoria_id: '', tresc: '' });
            onPostAdded(); // Odśwież listę
            onClose(); // Zamknij modal
        } catch (error: any) {
            console.error('Błąd dodawania posta:', error);
            const bladWiadomosc = error.response?.data?.tytul?.[0]
                || error.response?.data?.tresc?.[0]
                || error.response?.data?.kategoria_id?.[0]
                || error.response?.data?.detail
                || 'Nie udało się dodać wątku.';
            setBlad(bladWiadomosc);
        } finally {
            setLadowanie(false);
        }
    };

    const handleCancel = () => {
        setNowyPost({ tytul: '', kategoria_id: '', tresc: '' });
        setBlad(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleCancel}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Makieta GUI – dodawanie wątku</h2>
                    <button onClick={handleCancel} className="modal-close">×</button>
                </div>

                <div className="modal-body">
                    <h3>Nowy wątek</h3>

                    {blad && <div className="error-message">{blad}</div>}

                    <div className="add-form">
                        <div className="form-group">
                            <label htmlFor="tytul">Tytuł wątku</label>
                            <input
                                id="tytul"
                                type="text"
                                placeholder="Wpisz tytuł wątku"
                                value={nowyPost.tytul}
                                onChange={(e) => setNowyPost({ ...nowyPost, tytul: e.target.value })}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="kategoria">Kategoria</label>
                            <select
                                id="kategoria"
                                value={nowyPost.kategoria_id}
                                onChange={(e) => setNowyPost({ ...nowyPost, kategoria_id: e.target.value })}
                                className="form-input"
                            >
                                <option value="">Wybierz kategorię</option>
                                {kategorie.map((kategoria) => (
                                    <option key={kategoria.id} value={kategoria.id}>
                                        {kategoria.nazwa}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="tresc">Treść wątku</label>
                            <textarea
                                id="tresc"
                                placeholder="Wpisz treść wątku"
                                value={nowyPost.tresc}
                                onChange={(e) => setNowyPost({ ...nowyPost, tresc: e.target.value })}
                                className="form-textarea"
                                rows={6}
                            />
                        </div>

                        <div className="form-actions">
                            <button
                                onClick={handleSubmit}
                                className="btn-save"
                                disabled={ladowanie}
                            >
                                {ladowanie ? 'Dodawanie...' : 'Utwórz wątek'}
                            </button>
                            <button
                                onClick={handleCancel}
                                className="btn-cancel"
                                disabled={ladowanie}
                            >
                                Anuluj
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DodajPost;
