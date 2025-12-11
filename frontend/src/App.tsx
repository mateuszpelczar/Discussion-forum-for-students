/**
 * Główny komponent aplikacji.
 * Konfiguracja routingu i AuthProvider.
 */
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ChronionaTrasa from './components/ChronionaTrasa';
import StronaGlowna from './components/StronaGlowna';
import Auth from './components/Auth';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Chronione trasy */}
          <Route
            path="/"
            element={
              <ChronionaTrasa>
                <StronaGlowna />
              </ChronionaTrasa>
            }
          />

          {/* Publiczne trasy */}
          <Route path="/logowanie" element={<Auth />} />
          <Route path="/rejestracja" element={<Auth />} />

          {/* Przekierowanie nieznanych ścieżek */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
