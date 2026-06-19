import { useState, useEffect } from 'react';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import { getToken } from './api/client';

export default function App() {
  const [user, setUser] = useState(null);
  const [checkedToken, setCheckedToken] = useState(false);

  // Bij het laden van de app: als er al een token in de browser staat,
  // gaan we ervan uit dat de gebruiker nog ingelogd is. We bewaren
  // de e-mail apart zodat we die kunnen tonen zonder een extra API-call.
  useEffect(() => {
    const token = getToken();
    const savedEmail = localStorage.getItem('userEmail');
    if (token && savedEmail) {
      setUser({ email: savedEmail });
    }
    setCheckedToken(true);
  }, []);

  function handleAuthSuccess(loggedInUser) {
    localStorage.setItem('userEmail', loggedInUser.email);
    setUser(loggedInUser);
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setUser(null);
  }

  // Voorkom een korte flits van de loginpagina terwijl we de token checken
  if (!checkedToken) return null;

  return user ? (
    <DashboardPage user={user} onLogout={handleLogout} />
  ) : (
    <AuthPage onAuthSuccess={handleAuthSuccess} />
  );
}
