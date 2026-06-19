import { useState } from 'react';
import { authApi } from '../api/client';

export default function AuthPage({ onAuthSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' of 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const fn = mode === 'login' ? authApi.login : authApi.register;
      const data = await fn(email, password);
      localStorage.setItem('token', data.token);
      onAuthSuccess(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-eyebrow">Smart Bookmarks</p>
        <h1 className="auth-title">
          {mode === 'login' ? 'Welkom terug' : 'Begin je collectie'}
        </h1>
        <p className="auth-subtitle">
          {mode === 'login'
            ? 'Log in om je opgeslagen links te bekijken.'
            : 'Maak een account om links te bewaren met automatische previews.'}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span>E-mailadres</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jij@voorbeeld.com"
            />
          </label>

          <label className="field">
            <span>Wachtwoord</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimaal 6 tekens"
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Even geduld…' : mode === 'login' ? 'Inloggen' : 'Account aanmaken'}
          </button>
        </form>

        <button
          type="button"
          className="auth-switch"
          onClick={() => {
            setMode(mode === 'login' ? 'register' : 'login');
            setError(null);
          }}
        >
          {mode === 'login'
            ? 'Nog geen account? Maak er een aan'
            : 'Heb je al een account? Log in'}
        </button>
      </div>
    </div>
  );
}
