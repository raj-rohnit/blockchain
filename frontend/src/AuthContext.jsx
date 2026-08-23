import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [institution, setInstitution] = useState(() => {
    const raw = localStorage.getItem('cc_institution');
    return raw ? JSON.parse(raw) : null;
  });

  useEffect(() => {
    if (institution) {
      localStorage.setItem('cc_institution', JSON.stringify(institution));
    } else {
      localStorage.removeItem('cc_institution');
    }
  }, [institution]);

  function login(token, institutionData) {
    localStorage.setItem('cc_token', token);
    setInstitution(institutionData);
  }

  function logout() {
    localStorage.removeItem('cc_token');
    setInstitution(null);
  }

  return (
    <AuthContext.Provider value={{ institution, login, logout, isAuthenticated: !!institution }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
