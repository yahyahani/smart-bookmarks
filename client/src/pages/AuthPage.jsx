import { useState } from 'react';
import { authApi } from '../api/client';
import { useLanguage } from '../i18n/LanguageContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';

export default function AuthPage({ onAuthSuccess }) {
  const { t } = useLanguage();
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
      <div className="auth-lang-bar">
        <ThemeToggle />
        <LanguageSwitcher />
      </div>

      <div className="auth-card">
        <p className="auth-eyebrow">{t('authEyebrow')}</p>
        <h1 className="auth-title">
          {mode === 'login' ? t('welcomeBackTitle') : t('startCollectionTitle')}
        </h1>
        <p className="auth-subtitle">
          {mode === 'login' ? t('loginSubtitle') : t('registerSubtitle')}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="field">
            <span>{t('emailLabel')}</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder')}
            />
          </label>

          <label className="field">
            <span>{t('passwordLabel')}</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('passwordPlaceholder')}
            />
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t('submitting') : mode === 'login' ? t('loginButton') : t('registerButton')}
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
          {mode === 'login' ? t('switchToRegister') : t('switchToLogin')}
        </button>
      </div>
    </div>
  );
}
