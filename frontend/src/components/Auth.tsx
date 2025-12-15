/**
 * Komponent autoryzacji z tabami (logowanie/rejestracja).
 * Zgodnie z makietą GUI.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { UzytkownikLogowanie, UzytkownikRejestracja } from '../services/serwisAutoryzacji';
import './Auth.css';

type TabType = 'logowanie' | 'rejestracja';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logowanie, rejestracja, zalogowany } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>(
    location.pathname === '/rejestracja' ? 'rejestracja' : 'logowanie'
  );
  const [ladowanie, setLadowanie] = useState(false);
  const [blad, setBlad] = useState<string>('');

  // Przekieruj jeśli już zalogowany
  useEffect(() => {
    if (zalogowany) {
      navigate('/', { replace: true });
    }
  }, [zalogowany, navigate]);

  // Dane formularza logowania
  const [loginData, setLoginData] = useState<UzytkownikLogowanie>({
    email: '',
    password: '',
  });

  // Dane formularza rejestracji
  const [registerData, setRegisterData] = useState<UzytkownikRejestracja>({
    username: '',
    email: '',
    password: '',
    password2: '',
    first_name: '',
    last_name: '',
  });

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoginData(prev => ({ ...prev, [name]: value }));
    setBlad('');
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setRegisterData(prev => ({ ...prev, [name]: value }));
    setBlad('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLadowanie(true);
    setBlad('');

    try {
      await logowanie(loginData);
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLadowanie(true);
    setBlad('');

    if (registerData.password !== registerData.password2) {
      setBlad('Hasła nie są identyczne');
      setLadowanie(false);
      return;
    }

    try {
      await rejestracja(registerData);
      navigate('/');
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: Record<string, string[]> } };
        const errors = axiosError.response?.data;
        if (errors) {
          const firstError = Object.values(errors)[0];
          setBlad(Array.isArray(firstError) ? firstError[0] : 'Wystąpił błąd podczas rejestracji');
        } else {
          setBlad('Wystąpił błąd podczas rejestracji');
        }
      } else {
        setBlad('Wystąpił błąd podczas rejestracji');
      }
    } finally {
      setLadowanie(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Forum studenckie</h1>
        <p className="auth-subtitle">Dołącz do społeczności studentów</p>

        {/* Taby */}
        <div className="auth-tabs">
          <button
            className={`tab-button ${activeTab === 'logowanie' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('logowanie');
              setBlad('');
            }}
          >
            Logowanie
          </button>
          <button
            className={`tab-button ${activeTab === 'rejestracja' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('rejestracja');
              setBlad('');
            }}
          >
            Rejestracja
          </button>
        </div>

        {blad && (
          <div className="error-message">
            {blad}
          </div>
        )}

        {/* Formularz logowania */}
        {activeTab === 'logowanie' && (
          <div className="auth-form-wrapper">
            <div className="form-section">
              <h2>Logowanie</h2>
              <form onSubmit={handleLoginSubmit} className="auth-form-single">
                <div className="form-group">
                  <label htmlFor="login-email">E-mail</label>
                  <input
                    type="email"
                    id="login-email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="login-password">Hasło</label>
                  <input
                    type="password"
                    id="login-password"
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={ladowanie}
                >
                  {ladowanie ? 'Logowanie...' : 'Zaloguj'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Formularz rejestracji */}
        {activeTab === 'rejestracja' && (
          <div className="auth-form-wrapper">
            <div className="form-section">
              <h2>Rejestracja</h2>
              <form onSubmit={handleRegisterSubmit} className="auth-form-single">
                <div className="form-group">
                  <label htmlFor="register-email">E-mail</label>
                  <input
                    type="email"
                    id="register-email"
                    name="email"
                    value={registerData.email}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="register-password">Hasło</label>
                  <input
                    type="password"
                    id="register-password"
                    name="password"
                    value={registerData.password}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="register-password2">Powtórz hasło</label>
                  <input
                    type="password"
                    id="register-password2"
                    name="password2"
                    value={registerData.password2}
                    onChange={handleRegisterChange}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={ladowanie}
                >
                  {ladowanie ? 'Rejestracja...' : 'Zarejestruj'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
