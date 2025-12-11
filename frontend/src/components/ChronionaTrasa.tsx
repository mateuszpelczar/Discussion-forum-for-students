/**
 * Komponent chronionej trasy.
 * Wymaga autoryzacji do wyświetlenia zawartości.
 */
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

interface ChronionaTrasakProps {
  children: ReactNode;
}

const ChronionaTrasa: React.FC<ChronionaTrasakProps> = ({ children }) => {
  const { zalogowany, ladowanie } = useAuth();

  if (ladowanie) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh' 
      }}>
        <div>Ładowanie...</div>
      </div>
    );
  }

  if (!zalogowany) {
    return <Navigate to="/logowanie" replace />;
  }

  return <>{children}</>;
};

export default ChronionaTrasa;
