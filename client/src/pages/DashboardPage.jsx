import { useState, useEffect, useCallback } from 'react';
import { bookmarksApi } from '../api/client';
import BookmarkCard from '../components/BookmarkCard';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';
import ConfirmDialog from '../components/ConfirmDialog';
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
  const [activeTag, setActiveTag] = useState(null);

  // De bookmark waarvoor net op het verwijder-kruisje is geklikt,
  // in afwachting van bevestiging. null = geen dialoog open.
  const [pendingDelete, setPendingDelete] = useState(null);

  const loadBookmarks = useCallback(async (searchTerm = '', tag = null) => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (tag) params.tag = tag;
      const data = await bookmarksApi.getAll(params);
      setBookmarks(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookmarks(search, activeTag);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce: wacht 400ms na de laatste toets voordat we zoeken,
  // zodat we niet bij elke letter een nieuwe request versturen.
  useEffect(() => {
    const timeout = setTimeout(() => loadBookmarks(search, activeTag), 400);
    return () => clearTimeout(timeout);
  }, [search, activeTag, loadBookmarks]);

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

  async function handleSaveEdit(id, data) {
    try {
      const updated = await bookmarksApi.update(id, data);
      setBookmarks((prev) => prev.map((b) => (b.id === id ? updated : b)));
    } catch (err) {
      setError(err.message);
      throw err; // zodat BookmarkCard de edit-modus niet sluit bij een fout
    }
  }

  function handleDeleteRequest(bookmark) {
    setPendingDelete(bookmark);
  }

  async function handleConfirmDelete() {
    if (!pendingDelete) return;
    try {
      await bookmarksApi.remove(pendingDelete.id);
      setBookmarks((prev) => prev.filter((b) => b.id !== pendingDelete.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setPendingDelete(null);
    }
  }

  function handleTagClick(tag) {
    setActiveTag((prev) => (prev === tag ? null : tag));
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
        {activeTag && (
          <button type="button" className="active-tag-chip" onClick={() => setActiveTag(null)}>
            {t('activeTagPrefix')} {activeTag} <span aria-hidden="true">×</span>
          </button>
        )}
      </div>

      {error && <p className="dashboard-error">{error}</p>}

      {loading ? (
        <p className="dashboard-status">{t('loadingBookmarks')}</p>
      ) : bookmarks.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-state-icon" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z" />
          </svg>
          <p>{t('emptyStateTitle')}</p>
          <p className="empty-state-sub">{t('emptyStateSubtitle')}</p>
        </div>
      ) : (
        <div className="bm-grid">
          {bookmarks.map((bookmark, index) => (
            <BookmarkCard
              key={bookmark.id}
              bookmark={bookmark}
              onDeleteRequest={handleDeleteRequest}
              onSave={handleSaveEdit}
              onTagClick={handleTagClick}
              animationDelay={index * 40}
            />
          ))}
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title={t('confirmDeleteTitle')}
          body={t('confirmDeleteBody')}
          confirmLabel={t('confirmDeleteConfirm')}
          onConfirm={handleConfirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </div>
  );
}
