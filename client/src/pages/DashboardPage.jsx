import { useState, useEffect, useCallback } from 'react';
import { bookmarksApi } from '../api/client';
import BookmarkCard from '../components/BookmarkCard';

export default function DashboardPage({ user, onLogout }) {
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
          <p className="dashboard-eyebrow">Smart Bookmarks</p>
          <h1 className="dashboard-title">Jouw collectie</h1>
        </div>
        <div className="dashboard-user">
          <span>{user.email}</span>
          <button type="button" className="btn-ghost" onClick={onLogout}>
            Uitloggen
          </button>
        </div>
      </header>

      <form onSubmit={handleAdd} className="add-form">
        <input
          type="text"
          required
          placeholder="Plak hier een link…"
          value={newUrl}
          onChange={(e) => setNewUrl(e.target.value)}
          className="add-url-input"
        />
        <input
          type="text"
          placeholder="tags (komma-gescheiden)"
          value={newTags}
          onChange={(e) => setNewTags(e.target.value)}
          className="add-tags-input"
        />
        <button type="submit" className="btn-primary" disabled={adding}>
          {adding ? 'Ophalen…' : 'Bewaren'}
        </button>
      </form>

      <div className="search-row">
        <input
          type="search"
          placeholder="Zoek in je bookmarks…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
      </div>

      {error && <p className="dashboard-error">{error}</p>}

      {loading ? (
        <p className="dashboard-status">Bookmarks laden…</p>
      ) : bookmarks.length === 0 ? (
        <div className="empty-state">
          <p>Nog niets bewaard.</p>
          <p className="empty-state-sub">Plak een link hierboven om te beginnen.</p>
        </div>
      ) : (
        <div className="bm-grid">
          {bookmarks.map((bookmark) => (
            <BookmarkCard key={bookmark.id} bookmark={bookmark} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
