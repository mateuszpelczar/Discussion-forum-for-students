/**
 * Komponent formularza logowania.
 * Zgodnie z zasadami Clean Code i KISS.
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UzytkownikLogowanie } from '../services/serwisAutoryzacji';
import './Auth.css';
import logowanieBanner from '../assets/logowanie.png';

const Logowanie: React.FC = () => {
  const navigate = useNavigate();
  const { logowanie } = useAuth();

  const [formData, setFormData] = useState<UzytkownikLogowanie>({
    email: '',
    password: '',
  });

  const [blad, setBlad] = useState<string>('');
  const [ladowanie, setLadowanie] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setBlad('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLadowanie(true);
    setBlad('');

    try {
      await logowanie(formData);
      navigate('/');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { error?: string } } };
        setBlad(axiosError.response?.data?.error || 'Wystąpił błąd podczas logowania');
      } else {
        setBlad('Wystąpił błąd podczas logowania');
      }
    } finally {
      setLadowanie(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-banner">
          <img src={logowanieBanner} alt="Logowanie" />
        </div>
        <h1>Logowanie</h1>
        <p className="auth-subtitle">Forum dyskusyjne dla studentów</p>

        {blad && (
          <div className="error-message">
            {blad}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={ladowanie}
          >
            {ladowanie ? 'Logowanie...' : 'Zaloguj się'}
          </button>
        </form>

        <p className="auth-link">
          Nie masz konta? <Link to="/rejestracja">Zarejestruj się</Link>
        </p>
      </div>
    </div>
  );
};

export default Logowanie;
