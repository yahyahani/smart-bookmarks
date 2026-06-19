import { useState, useEffect, useCallback } from 'react';
import { bookmarksApi } from '../api/client';
import BookmarkCard from '../components/BookmarkCard';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';
import { useLanguage } from '../i18n/LanguageContext';

export default function DashboardPage({ user, onLogout }) {
  const { t } = useLanguage();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [newUrl, setNewUrl] = useState('');
  const [newTags, setNewTags] = useState('');
  const [adding, setAdding] = useState(false);

  const [search, setSearch] = useState('');

  const loadBookmarks = useCallback(async (searchTerm = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await bookmarksApi.getAll(searchTerm ? { search: searchTerm } : {});
      setBookmarks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks();
  }, [loadBookmarks]);

  // Debounce: wacht 400ms na de laatste toets voordat we zoeken,
  // zodat we niet bij elke letter een nieuwe request versturen.
  useEffect(() => {
    const timeout = setTimeout(() => loadBookmarks(search), 400);
    return () => clearTimeout(timeout);
  }, [search, loadBookmarks]);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newUrl.trim()) return;

    setAdding(true);
    setError(null);
    try {
      const tags = newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const bookmark = await bookmarksApi.create(newUrl.trim(), tags);
      setBookmarks((prev) => [bookmark, ...prev]);
      setNewUrl('');
      setNewTags('');
    } catch (err) {
      setError(err.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleDelete(id) {
    try {
      await bookmarksApi.remove(id);
      setBookmarks((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <p className="dashboard-eyebrow">{t('dashboardEyebrow')}</p>
          <h1 className="dashboard-title">{t('dashboardTitle')}</h1>
        </div>
        <div className="dashboard-user">
          <ThemeToggle />
          <LanguageSwitcher />
          <span>{user.email}</span>
          <button type="button" className="btn-ghost" onClick={onLogout}>
            {t('logoutButton')}
          </button>
        </div>
      </header>

      <form onSubmit={handleAdd} className="add-form">
        <input
          type="text"
          required
          placeholder={t('urlPlaceholder')}
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="add-url-input"
        />
        <input
          type="text"
          placeholder={t('tagsPlaceholder')}
          value={newTags}
          onChange={(e) => setNewTags(e.target.value)}
          className="add-tags-input"
        />
        <button type="submit" className="btn-primary" disabled={adding}>
          {adding ? t('savingButton') : t('saveButton')}
        </button>
      </form>

      <div className="search-row">
        <input
          type="search"
          placeholder={t('searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {error && <p className="dashboard-error">{error}</p>}

      {loading ? (
        <p className="dashboard-status">{t('loadingBookmarks')}</p>
      ) : bookmarks.length === 0 ? (
        <div className="empty-state">
          <p>{t('emptyStateTitle')}</p>
          <p className="empty-state-sub">{t('emptyStateSubtitle')}</p>
        </div>
      ) : (
        <div className="bm-grid">
          {bookmarks.map((bookmark, index) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onDelete={handleDelete}
              animationDelay={index * 40}
            />
          ))}
        </div>
      )}
    </div>
  );
}
