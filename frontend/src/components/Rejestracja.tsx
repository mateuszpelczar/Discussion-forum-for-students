/**
 * Komponent formularza rejestracji.
 * Zgodnie z zasadami Clean Code - prosty, czytelny komponent.
 */
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UzytkownikRejestracja } from '../services/serwisAutoryzacji';
import './Auth.css';

const Rejestracja: React.FC = () => {
  const navigate = useNavigate();
  const { rejestracja } = useAuth();
  
  const [formData, setFormData] = useState<UzytkownikRejestracja>({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  });
  
  const [bledy, setBledy] = useState<{ [key: string]: string[] }>({});
  const [ladowanie, setLadowanie] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Wyczyść błąd dla tego pola
    if (bledy[name]) {
      setBledy(prev => {
        const nowe = { ...prev };
        delete nowe[name];
        return nowe;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLadowanie(true);
    setBledy({});

    try {
      await rejestracja(formData);
      navigate('/');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { [key: string]: string[] } } };
        if (axiosError.response?.data) {
          setBledy(axiosError.response.data);
        }
      } else {
        setBledy({ general: ['Wystąpił błąd podczas rejestracji'] });
      }
    } finally {
      setLadowanie(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Rejestracja</h1>
        <p className="auth-subtitle">Forum dyskusyjne dla studentów</p>

        {bledy.general && (
          <div className="error-message">
            {bledy.general[0]}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="username">Nazwa użytkownika *</label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              required
              className={bledy.username ? 'error' : ''}
            />
            {bledy.username && (
              <span className="error-text">{bledy.username[0]}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className={bledy.email ? 'error' : ''}
            />
            {bledy.email && (
              <span className="error-text">{bledy.email[0]}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">Imię</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Nazwisko</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Hasło *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className={bledy.password ? 'error' : ''}
            />
            {bledy.password && (
              <span className="error-text">{bledy.password[0]}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="password2">Potwierdź hasło *</label>
            <input
              type="password"
              id="password2"
              name="password2"
              value={formData.password2}
              onChange={handleChange}
              required
              className={bledy.password2 ? 'error' : ''}
            />
            {bledy.password2 && (
              <span className="error-text">{bledy.password2[0]}</span>
            )}
          </div>

          <button 
            type="submit" 
            className="btn-primary"
            disabled={ladowanie}
          >
            {ladowanie ? 'Rejestrowanie...' : 'Zarejestruj się'}
          </button>
        </form>

        <p className="auth-link">
          Masz już konto? <Link to="/logowanie">Zaloguj się</Link>
        </p>
      </div>
    </div>
  );
};

export default Rejestracja;
